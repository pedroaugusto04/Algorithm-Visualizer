#pragma once
#include <algorithm>
#include <cctype>
#include <initializer_list>
#include <set>
#include <string>
#include <unordered_map>
#include <vector>
#include "clang/AST/DeclCXX.h"
#include "clang/AST/ExprCXX.h"
#include "clang/AST/RecursiveASTVisitor.h"
#include "clang/Basic/SourceManager.h"
#include "clang/Lex/Lexer.h"
#include "clang/Rewrite/Core/Rewriter.h"
#include "../supported_type_names.hpp"
using namespace clang;
namespace av::detail {
struct TrackedVariable {
    const VarDecl* declaration;
    std::string type;
    std::string path;
    std::string expression;
    bool global = false;
    bool isParam = false;
};

using TrackedMap = std::unordered_map<const VarDecl*, TrackedVariable>;

const VarDecl* canonicalVariable(const VarDecl* variable) {
    return variable ? variable->getCanonicalDecl() : nullptr;
}

std::string observedType(QualType type) {
    type = type.getCanonicalType();
    if (type->isReferenceType()) type = type.getNonReferenceType().getCanonicalType();

    if (type->isConstantArrayType()) return avObservedStlType("C array");

    if (type->isArithmeticType() || type->isEnumeralType()) {
        return "scalar";
    }

    const auto* record = type->getAsCXXRecordDecl();
    const auto* specialization = dyn_cast_or_null<ClassTemplateSpecializationDecl>(record);
    if (!specialization) return "";

    const std::string name = specialization->getSpecializedTemplate()->getNameAsString();
    if (name == "basic_string" && specialization->getTemplateArgs().size() > 0
            && specialization->getTemplateArgs()[0].getKind() == TemplateArgument::Type
            && specialization->getTemplateArgs()[0].getAsType()->isCharType()) {
        return avObservedStlType("basic_string<char>");
    }
    return avObservedStlType(name);
}

bool isDirectBlockDeclaration(const DeclStmt* declaration, const Stmt* parent) {
    return declaration && isa<CompoundStmt>(parent);
}

class DeclarationCollector : public RecursiveASTVisitor<DeclarationCollector> {
public:
    explicit DeclarationCollector(SourceManager& sourceManager) : sourceManager_(sourceManager) {}

    bool TraverseStmt(Stmt* statement) {
        if (!statement) return true;
        const Stmt* old = currentStatement_;
        if (old
                && sourceManager_.isWrittenInMainFile(old->getBeginLoc())
                && sourceManager_.isWrittenInMainFile(statement->getBeginLoc())) {
            parents_[statement] = old;
        }
        currentStatement_ = statement;
        const bool result = RecursiveASTVisitor<DeclarationCollector>::TraverseStmt(statement);
        currentStatement_ = old;
        return result;
    }

    bool VisitVarDecl(VarDecl* declaration) {
        if (!sourceManager_.isWrittenInMainFile(declaration->getLocation())) return true;
        if (isa<ParmVarDecl>(declaration)) {
            const std::string type = observedType(declaration->getType());
            if (type.empty()) return true;
            const VarDecl* canonical = canonicalVariable(declaration);
            variables_.emplace(canonical, TrackedVariable{
                declaration, type, canonical->getNameAsString(), canonical->getNameAsString(), false, true
            });
            return true;
        }
        const std::string type = observedType(declaration->getType());
        if (!declaration->isLocalVarDecl()) {
            if (type.empty()) return true;
            if (declaration->isStaticDataMember() || !declaration->isFileVarDecl()) {
                unsupportedMemberName = declaration->getNameAsString();
                return true;
            }
            const std::string qualifiedName = declaration->getQualifiedNameAsString();
            if (qualifiedName.find("(anonymous namespace)") != std::string::npos) {
                unsupportedGlobalName = declaration->getNameAsString();
                return true;
            }
            const VarDecl* canonical = canonicalVariable(declaration);
            variables_.emplace(canonical, TrackedVariable{
                declaration, type, {}, "::" + qualifiedName, true
            });
            nameCounts_[canonical->getNameAsString()]++;
            return true;
        }
        const auto* declarationStatement = dyn_cast_or_null<DeclStmt>(currentStatement_);
        if (!declarationStatement) return true;
        auto parent = parents_.find(declarationStatement);
        if (parent == parents_.end()) {
            return true;
        }

        if (type.empty()) return true;
        if (isa<ForStmt>(parent->second)) {
            if (type != "scalar") {
                unsupportedForName = declaration->getNameAsString();
            }
            return true;
        }
        if (!isDirectBlockDeclaration(declarationStatement, parent->second)) return true;

        const VarDecl* canonical = canonicalVariable(declaration);
        variables_.emplace(canonical, TrackedVariable{
            declaration, type, {}, canonical->getNameAsString(), false
        });
        nameCounts_[canonical->getNameAsString()]++;
        return true;
    }

    bool VisitFieldDecl(FieldDecl* declaration) {
        if (sourceManager_.isWrittenInMainFile(declaration->getLocation())) {
            const std::string type = observedType(declaration->getType());
            if (!type.empty() && type != "scalar") {
                observedMemberFields_.push_back(declaration);
            }
        }
        return true;
    }

    const TrackedMap& variables() const { return variables_; }
    const std::unordered_map<const Stmt*, const Stmt*>& parents() const { return parents_; }
    const std::unordered_map<std::string, unsigned>& nameCounts() const { return nameCounts_; }
    const std::vector<const FieldDecl*>& observedMemberFields() const { return observedMemberFields_; }
    const std::string& unsupportedGlobal() const { return unsupportedGlobalName; }
    const std::string& unsupportedFor() const { return unsupportedForName; }
    const std::string& unsupportedMember() const { return unsupportedMemberName; }

private:
    SourceManager& sourceManager_;
    const Stmt* currentStatement_ = nullptr;
    std::unordered_map<const Stmt*, const Stmt*> parents_;
    TrackedMap variables_;
    std::unordered_map<std::string, unsigned> nameCounts_;
    std::vector<const FieldDecl*> observedMemberFields_;
    std::string unsupportedGlobalName;
    std::string unsupportedForName;
    std::string unsupportedMemberName;
};

class MainFinder : public RecursiveASTVisitor<MainFinder> {
public:
    explicit MainFinder(SourceManager& sourceManager) : sourceManager_(sourceManager) {}
    bool VisitFunctionDecl(FunctionDecl* function) {
        if (function->getNameAsString() == "main" && function->hasBody()
                && sourceManager_.isWrittenInMainFile(function->getLocation())) {
            found = true;
            mainFunction = function;
        }
        return true;
    }
    bool found = false;
    FunctionDecl* mainFunction = nullptr;

private:
    SourceManager& sourceManager_;
};

class ReferenceCollector : public RecursiveASTVisitor<ReferenceCollector> {
public:
    explicit ReferenceCollector(const TrackedMap& tracked) : tracked_(tracked) {}

    bool VisitDeclRefExpr(DeclRefExpr* reference) {
        const auto* variable = dyn_cast<VarDecl>(reference->getDecl());
        if (!variable) return true;
        const auto* canonical = canonicalVariable(variable);
        if (tracked_.find(canonical) != tracked_.end()) found_.insert(canonical);
        return true;
    }

    const std::set<const VarDecl*>& found() const { return found_; }

private:
    const TrackedMap& tracked_;
    std::set<const VarDecl*> found_;
};

class AliasDetector : public RecursiveASTVisitor<AliasDetector> {
public:
    AliasDetector(const TrackedMap& tracked, SourceManager& sourceManager)
        : tracked_(tracked), sourceManager_(sourceManager) {}

    bool VisitVarDecl(VarDecl* declaration) {
        const Expr* initializer = declaration->getInit();
        if (!initializer || !declaration->hasLocalStorage()
                || !sourceManager_.isWrittenInMainFile(declaration->getLocation())) return true;

        ReferenceCollector references(tracked_);
        references.TraverseStmt(const_cast<Expr*>(initializer));
        if (references.found().empty()) return true;

        if (declaration->getType()->isReferenceType() || declaration->getType()->isPointerType()
                || isNonOwningViewType(declaration->getType())
                || isIteratorType(declaration->getType()) || isDirectIteratorFactory(initializer)
                || containsReferenceCapture(initializer)) {
            variableName = declaration->getNameAsString();
        }
        return true;
    }

    std::string variableName;

private:
    const TrackedMap& tracked_;
    SourceManager& sourceManager_;

    bool isNonOwningViewType(QualType type) const {
        const auto* record = type->getAsCXXRecordDecl();
        const auto* specialization = dyn_cast_or_null<ClassTemplateSpecializationDecl>(record);
        if (!specialization) return false;
        const std::string name = specialization->getSpecializedTemplate()->getNameAsString();
        return name == "span" || name == "reference_wrapper" || name == "subrange"
                || name == "basic_string_view" || name == "ref_view"
                || (name.size() > 5 && name.substr(name.size() - 5) == "_view");
    }

    bool isIteratorType(QualType type) const {
        const auto* record = type->getAsCXXRecordDecl();
        if (!record) return false;
        std::string name = type.getAsString();
        std::transform(name.begin(), name.end(), name.begin(), [](unsigned char ch) {
            return static_cast<char>(std::tolower(ch));
        });
        return name.find("iterator") != std::string::npos || name.find("_iter<") != std::string::npos;
    }

    bool isDirectIteratorFactory(const Expr* expression) const {
        expression = expression->IgnoreParenImpCasts();
        const auto* call = dyn_cast<CXXMemberCallExpr>(expression);
        if (!call) return false;
        const std::string method = call->getMethodDecl()->getNameAsString();
        return method == "begin" || method == "end" || method == "rbegin" || method == "rend"
                || method == "cbegin" || method == "cend" || method == "crbegin" || method == "crend";
    }

    bool containsReferenceCapture(const Stmt* statement) const {
        class ReferenceCaptureVisitor : public RecursiveASTVisitor<ReferenceCaptureVisitor> {
        public:
            explicit ReferenceCaptureVisitor(const TrackedMap& tracked) : tracked_(tracked) {}
            bool VisitLambdaExpr(LambdaExpr* lambda) {
                for (const LambdaCapture& capture : lambda->captures()) {
                    if (!capture.capturesVariable() || capture.getCaptureKind() != LCK_ByRef) continue;
                    const auto* variable = dyn_cast<VarDecl>(capture.getCapturedVar());
                    if (variable && tracked_.find(canonicalVariable(variable)) != tracked_.end()) {
                        found = true;
                    }
                }
                return true;
            }
            bool found = false;
        private:
            const TrackedMap& tracked_;
        } visitor(tracked_);
        visitor.TraverseStmt(const_cast<Stmt*>(statement));
        return visitor.found;
    }
};

}
