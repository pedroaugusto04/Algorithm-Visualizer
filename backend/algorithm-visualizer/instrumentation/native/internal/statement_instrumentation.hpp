#pragma once
#include "ast_analysis.hpp"
#include "clang/AST/ASTContext.h"
#include "clang/AST/Stmt.h"
namespace av::detail {
struct Annotation {
    const Stmt* statement = nullptr;
    std::set<const VarDecl*> variables;
    bool wrapInBraces = false;
};

bool isControlBody(const Stmt* parent, const Stmt* child) {
    if (const auto* statement = dyn_cast<IfStmt>(parent)) {
        return statement->getThen() == child || statement->getElse() == child;
    }
    if (const auto* statement = dyn_cast<ForStmt>(parent)) return statement->getBody() == child;
    if (const auto* statement = dyn_cast<WhileStmt>(parent)) return statement->getBody() == child;
    if (const auto* statement = dyn_cast<DoStmt>(parent)) return statement->getBody() == child;
    if (const auto* statement = dyn_cast<CXXForRangeStmt>(parent)) return statement->getBody() == child;
    if (const auto* statement = dyn_cast<SwitchStmt>(parent)) return statement->getBody() == child;
    return false;
}

class StatementInstrumenter : public RecursiveASTVisitor<StatementInstrumenter> {
public:
    StatementInstrumenter(
        ASTContext& context,
        Rewriter& rewriter,
        const TrackedMap& variables,
        const std::unordered_map<const Stmt*, const Stmt*>& parents)
        : context_(context), rewriter_(rewriter), variables_(variables), parents_(parents) {}

    bool TraverseStmt(Stmt* statement) {
        if (!statement) return true;
        const Stmt* old = currentStatement_;
        currentStatement_ = statement;
        const bool result = RecursiveASTVisitor<StatementInstrumenter>::TraverseStmt(statement);
        currentStatement_ = old;
        return result;
    }

    bool VisitStmt(Stmt* statement) {
        const auto parent = parents_.find(statement);
        if (parent == parents_.end()) return true;
        const Stmt* container = parent->second;

        if (!isa<CompoundStmt>(statement)
                && (isa<CompoundStmt>(container) || isControlBody(container, statement))
                && !isControlStatement(statement)) {
            annotate(statement, true);
        }

        if (isa<IfStmt>(statement)) {
            annotateHeader(statement, {cast<IfStmt>(statement)->getCond()});
        } else if (isa<ForStmt>(statement)) {
            const auto* loop = cast<ForStmt>(statement);
            annotateHeader(statement, {loop->getInit(), loop->getCond(), loop->getInc()});
        } else if (isa<WhileStmt>(statement)) {
            annotateHeader(statement, {cast<WhileStmt>(statement)->getCond()});
        } else if (isa<DoStmt>(statement)) {
            annotateHeader(statement, {cast<DoStmt>(statement)->getCond()});
        } else if (isa<SwitchStmt>(statement)) {
            annotateHeader(statement, {cast<SwitchStmt>(statement)->getCond()});
        } else if (isa<CXXForRangeStmt>(statement)) {
            annotateHeader(statement, {cast<CXXForRangeStmt>(statement)->getRangeInit()});
        }
        return true;
    }

    bool VisitReturnStmt(ReturnStmt* statement) {
        const Expr* value = statement->getRetValue();
        if (!value) return true;
        const auto references = collectReferences(value);
        if (references.empty()) return true;

        class CallCollector : public RecursiveASTVisitor<CallCollector> {
        public:
            bool VisitCallExpr(CallExpr* call) {
                if (const auto* operation = dyn_cast<CXXOperatorCallExpr>(call)) {
                    if (operation->getOperator() == OO_Subscript) return true;
                }
                hasCall = true;
                return true;
            }
            bool hasCall = false;
        } calls;
        calls.TraverseStmt(const_cast<Expr*>(value));
        if (calls.hasCall) {
            reportUnsupported("retorno que pode modificar um contêiner observado");
        }
        return true;
    }

    bool apply() {
        if (!error_.empty()) return false;

        std::vector<Annotation> ordered;
        ordered.reserve(annotations_.size());
        for (auto& [statement, annotation] : annotations_) {
            (void)statement;
            ordered.push_back(annotation);
        }
        std::sort(ordered.begin(), ordered.end(), [](const Annotation& left, const Annotation& right) {
            return left.statement->getBeginLoc().getRawEncoding() < right.statement->getBeginLoc().getRawEncoding();
        });

        for (const Annotation& annotation : ordered) {
            const Stmt* statement = annotation.statement;
            SourceLocation begin = statement->getBeginLoc();
            SourceLocation end = statement->getEndLoc();
            if (begin.isInvalid() || end.isInvalid() || begin.isMacroID() || end.isMacroID()) {
                reportUnsupported("instrução dentro de macro");
                return false;
            }

            std::string code;
            if (const auto* declStmt = dyn_cast<DeclStmt>(statement)) {
                for (const Decl* decl : declStmt->decls()) {
                    if (const auto* var = dyn_cast<VarDecl>(decl)) {
                        const auto* canonical = canonicalVariable(var);
                        auto it = variables_.find(canonical);
                        if (it != variables_.end() && !it->second.global && !it->second.isParam) {
                            const auto& info = it->second;
                            const unsigned line = context_.getSourceManager().getSpellingLineNumber(statement->getBeginLoc());
                            code += " auto __av_guard_" + info.expression + "_" + std::to_string(line)
                                    + " = __av_make_scope_guard(" + info.expression + ", \"" + info.path
                                    + "\", \"" + info.type + "\", " + std::to_string(line) + ");";
                        }
                    }
                }
            }

            for (const VarDecl* variable : orderedVariables(annotation.variables)) {
                const auto& info = variables_.at(variable);
                const unsigned line = context_.getSourceManager().getSpellingLineNumber(statement->getBeginLoc());
                // Keep generated code on the original line so compiler diagnostics match the user's source.
                code += " __av_snapshot_if_changed(\"" + info.type + "\", \"" + info.path
                        + "\", " + info.expression + ", " + std::to_string(line) + ");";
            }
            if (code.empty()) continue;

            SourceLocation afterStatement = endOfStatement(statement);
            if (afterStatement.isInvalid()) {
                reportUnsupported("não foi possível localizar o fim da instrução");
                return false;
            }

            if (annotation.wrapInBraces) {
                if (rewriter_.InsertText(begin, "{ ", true, true)) {
                    reportUnsupported("não foi possível abrir o bloco instrumentado");
                    return false;
                }
                if (rewriter_.InsertText(afterStatement, code + " }", false, true)) {
                    reportUnsupported("não foi possível fechar o bloco instrumentado");
                    return false;
                }
            } else if (rewriter_.InsertText(afterStatement, code, false, true)) {
                reportUnsupported("não foi possível inserir o snapshot após a instrução");
                return false;
            }
        }
        return error_.empty();
    }

    const std::string& error() const { return error_; }

private:
    ASTContext& context_;
    Rewriter& rewriter_;
    const TrackedMap& variables_;
    const std::unordered_map<const Stmt*, const Stmt*>& parents_;
    const Stmt* currentStatement_ = nullptr;
    std::unordered_map<const Stmt*, Annotation> annotations_;
    std::string error_;

    std::set<const VarDecl*> collectReferences(const Stmt* statement) const {
        if (!statement) return {};
        ReferenceCollector collector(variables_);
        collector.TraverseStmt(const_cast<Stmt*>(statement));
        return collector.found();
    }

    std::vector<const VarDecl*> orderedVariables(const std::set<const VarDecl*>& variables) const {
        std::vector<const VarDecl*> ordered(variables.begin(), variables.end());
        std::sort(ordered.begin(), ordered.end(), [](const VarDecl* left, const VarDecl* right) {
            return left->getBeginLoc().getRawEncoding() < right->getBeginLoc().getRawEncoding();
        });
        return ordered;
    }

    SourceLocation endOfStatement(const Stmt* statement) const {
        SourceLocation end = statement->getEndLoc();
        if (isa<Expr>(statement) || isa<DoStmt>(statement)
                || isa<BreakStmt>(statement) || isa<ContinueStmt>(statement)
                || isa<ReturnStmt>(statement)) {
            return Lexer::findLocationAfterToken(
                end,
                tok::semi,
                context_.getSourceManager(),
                context_.getLangOpts(),
                false);
        }
        return Lexer::getLocForEndOfToken(end, 0, context_.getSourceManager(), context_.getLangOpts());
    }

    void annotate(const Stmt* statement, bool wrapInBraces) {
        if (!statement) return;
        auto references = collectReferences(statement);
        if (const auto* declarationStatement = dyn_cast<DeclStmt>(statement)) {
            for (const Decl* declaration : declarationStatement->decls()) {
                if (const auto* variable = dyn_cast<VarDecl>(declaration)) {
                    const auto* canonical = canonicalVariable(variable);
        if (variables_.find(canonical) != variables_.end()) references.insert(canonical);
                }
            }
        }
        if (references.empty()) return;
        if (statement->getBeginLoc().isMacroID() || statement->getEndLoc().isMacroID()) {
            reportUnsupported("instrução com acesso observado dentro de macro");
            return;
        }

        Annotation& annotation = annotations_[statement];
        annotation.statement = statement;
        annotation.variables.insert(references.begin(), references.end());
        annotation.wrapInBraces = annotation.wrapInBraces || (wrapInBraces && isUnbracedControlBody(statement));
    }

    void annotateHeader(const Stmt* statement, std::initializer_list<const Stmt*> expressions) {
        if (!statement) return;
        std::set<const VarDecl*> references;
        for (const Stmt* expression : expressions) {
            if (headerMayMutateObservedValue(expression)) {
                reportUnsupported("efeito colateral em cabeçalho de controle que envolve contêiner observado");
                return;
            }
            const auto expressionReferences = collectReferences(expression);
            references.insert(expressionReferences.begin(), expressionReferences.end());
        }
        if (references.empty()) return;
        const Stmt* target = statement;
        bool wrapInBraces = false;
        if (const Stmt* body = controlBody(statement); body && !isa<CompoundStmt>(body)) {
            target = body;
            wrapInBraces = true;
        }
        Annotation& annotation = annotations_[target];
        annotation.statement = target;
        annotation.variables.insert(references.begin(), references.end());
        annotation.wrapInBraces = annotation.wrapInBraces || wrapInBraces;
    }

    bool headerMayMutateObservedValue(const Stmt* expression) const {
        if (!expression) return false;
        class MutationVisitor : public RecursiveASTVisitor<MutationVisitor> {
        public:
            explicit MutationVisitor(const TrackedMap& tracked) : tracked_(tracked) {}

            bool VisitBinaryOperator(BinaryOperator* operation) {
                if (operation->isAssignmentOp() && referencesObserved(operation->getLHS())) found = true;
                return true;
            }

            bool VisitUnaryOperator(UnaryOperator* operation) {
                if (operation->isIncrementDecrementOp() && referencesObserved(operation->getSubExpr())) found = true;
                return true;
            }

            bool VisitCXXMemberCallExpr(CXXMemberCallExpr* call) {
                if (!referencesObserved(call->getImplicitObjectArgument())) return true;
                const std::string method = call->getMethodDecl()->getNameAsString();
                static const std::set<std::string> readOnly = {
                    "size", "length", "empty", "capacity", "max_size", "count", "find",
                    "contains", "lower_bound", "upper_bound", "equal_range", "top", "front", "back"
                };
                if (readOnly.find(method) == readOnly.end()) found = true;
                return true;
            }

            bool VisitCallExpr(CallExpr* call) {
                if (isa<CXXMemberCallExpr>(call)) return true;
                if (const auto* operation = dyn_cast<CXXOperatorCallExpr>(call)) {
                    if (operation->getOperator() == OO_Subscript) return true;
                }
                for (const Expr* argument : call->arguments()) {
                    if (referencesObserved(argument)) found = true;
                }
                return true;
            }

            bool found = false;

        private:
            const TrackedMap& tracked_;
            bool referencesObserved(const Stmt* node) const {
                ReferenceCollector references(tracked_);
                references.TraverseStmt(const_cast<Stmt*>(node));
                return !references.found().empty();
            }
        } visitor(variables_);
        visitor.TraverseStmt(const_cast<Stmt*>(expression));
        return visitor.found;
    }

    bool isUnbracedControlBody(const Stmt* statement) const {
        const auto parent = parents_.find(statement);
        return parent != parents_.end()
                && isControlBody(parent->second, statement)
                && !isa<CompoundStmt>(statement);
    }

    const Stmt* controlBody(const Stmt* statement) const {
        if (const auto* node = dyn_cast<IfStmt>(statement)) return node->getThen();
        if (const auto* node = dyn_cast<ForStmt>(statement)) return node->getBody();
        if (const auto* node = dyn_cast<WhileStmt>(statement)) return node->getBody();
        if (const auto* node = dyn_cast<DoStmt>(statement)) return node->getBody();
        if (const auto* node = dyn_cast<CXXForRangeStmt>(statement)) return node->getBody();
        if (const auto* node = dyn_cast<SwitchStmt>(statement)) return node->getBody();
        return nullptr;
    }

    bool isControlStatement(const Stmt* statement) const {
        return isa<IfStmt>(statement) || isa<ForStmt>(statement) || isa<WhileStmt>(statement)
                || isa<DoStmt>(statement) || isa<CXXForRangeStmt>(statement) || isa<SwitchStmt>(statement);
    }

    void reportUnsupported(const std::string& message) {
        if (error_.empty()) error_ = message;
    }
};

}
