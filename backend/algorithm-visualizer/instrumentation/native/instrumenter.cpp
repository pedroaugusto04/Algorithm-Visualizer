#include <algorithm>
#include <array>
#include <iostream>
#include <initializer_list>
#include <iterator>
#include <map>
#include <memory>
#include <forward_list>
#include <list>
#include <queue>
#include <set>
#include <stack>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>

#include "clang/AST/ASTConsumer.h"
#include "clang/AST/DeclCXX.h"
#include "clang/AST/ExprCXX.h"
#include "clang/AST/RecursiveASTVisitor.h"
#include "clang/Basic/Diagnostic.h"
#include "clang/Basic/SourceManager.h"
#include "clang/Frontend/CompilerInstance.h"
#include "clang/Frontend/FrontendAction.h"
#include "clang/Lex/Lexer.h"
#include "clang/Rewrite/Core/Rewriter.h"
#include "clang/Tooling/CompilationDatabase.h"
#include "clang/Tooling/Tooling.h"
#include "llvm/Support/CommandLine.h"
#include "internal/statement_instrumentation.hpp"
#include "internal/user_type_serialization.hpp"

using namespace clang;
using namespace clang::tooling;

namespace {

using namespace av::detail;

llvm::cl::OptionCategory Category("algorithm visualizer instrumenter");
llvm::cl::opt<std::string> SourceFile(
    llvm::cl::Positional,
    llvm::cl::desc("C++ source file"),
    llvm::cl::Required,
    llvm::cl::cat(Category));
llvm::cl::opt<std::string> Standard(
    "std",
    llvm::cl::desc("C++ standard (gnu++17, gnu++20, gnu++23)"),
    llvm::cl::init("gnu++17"),
    llvm::cl::cat(Category));

class InstrumentConsumer : public ASTConsumer {
public:
    InstrumentConsumer(Rewriter& rewriter, std::string& error, SourceManager& sourceManager)
        : rewriter_(rewriter), error_(error), sourceManager_(sourceManager) {}

    void HandleTranslationUnit(ASTContext& context) override {
        MainFinder mainFinder(sourceManager_);
        mainFinder.TraverseDecl(context.getTranslationUnitDecl());
        if (!mainFinder.found) {
            error_ = "o código precisa definir uma função main";
            return;
        }

        DeclarationCollector declarations(sourceManager_);
        declarations.TraverseDecl(context.getTranslationUnitDecl());
        if (!declarations.unsupportedGlobal().empty()) {
            error_ = "contêiner em namespace anônimo não suportado para visualização: "
                    + declarations.unsupportedGlobal();
            return;
        }
        if (!declarations.unsupportedMember().empty()) {
            error_ = "contêiner membro de classe não suportado para visualização: "
                    + declarations.unsupportedMember();
            return;
        }
        if (!declarations.unsupportedFor().empty()) {
            error_ = "contêiner declarado no cabeçalho de for não suportado para visualização: "
                    + declarations.unsupportedFor();
            return;
        }

        TrackedMap tracked = declarations.variables();
        std::unordered_map<std::string, unsigned> duplicateNames = declarations.nameCounts();
        for (auto& [declaration, info] : tracked) {
            (void)declaration;
            const std::string name = info.declaration->getNameAsString();
            if (duplicateNames[name] > 1) {
                const SourceLocation location = info.declaration->getBeginLoc();
                info.path = name + "@" + std::to_string(sourceManager_.getSpellingLineNumber(location))
                        + ":" + std::to_string(sourceManager_.getSpellingColumnNumber(location));
            } else {
                info.path = name;
            }
        }

        AliasDetector aliases(tracked, sourceManager_);
        aliases.TraverseDecl(context.getTranslationUnitDecl());
        if (!aliases.variableName.empty()) {
            error_ = "alias de contêiner observado não suportado: " + aliases.variableName;
            return;
        }

        UserTypeSerializer userTypeSerializer(sourceManager_, rewriter_);
        if (!userTypeSerializer.inject(tracked, mainFinder.mainFunction)) {
            error_ = userTypeSerializer.error();
            return;
        }
        for (const FieldDecl* field : declarations.observedMemberFields()) {
            if (userTypeSerializer.serializes(dyn_cast<CXXRecordDecl>(field->getParent()))) continue;
            error_ = "contêiner membro de classe não suportado para visualização: "
                    + field->getNameAsString();
            return;
        }

        StatementInstrumenter instrumenter(context, rewriter_, tracked, declarations.parents());
        instrumenter.TraverseDecl(context.getTranslationUnitDecl());
        if (!instrumenter.apply()) {
            error_ = instrumenter.error();
            return;
        }
        instrumentGlobals(context, tracked, mainFinder.mainFunction);
    }

private:
    bool instrumentGlobals(ASTContext& context, const TrackedMap& tracked, FunctionDecl* mainFunction) {
        const auto* body = mainFunction ? dyn_cast<CompoundStmt>(mainFunction->getBody()) : nullptr;
        if (!body) {
            error_ = "não foi possível localizar o bloco de main para inicializar snapshots globais";
            return false;
        }

        std::vector<const TrackedVariable*> globals;
        for (const auto& [declaration, info] : tracked) {
            (void)declaration;
            if (info.global) globals.push_back(&info);
        }
        std::sort(globals.begin(), globals.end(), [](const TrackedVariable* left, const TrackedVariable* right) {
            return left->declaration->getBeginLoc().getRawEncoding()
                    < right->declaration->getBeginLoc().getRawEncoding();
        });
        if (globals.empty()) return true;

        std::string code;
        for (const TrackedVariable* info : globals) {
            const unsigned line = context.getSourceManager().getSpellingLineNumber(info->declaration->getBeginLoc());
            code += "\n__av_snapshot_if_changed(\"" + info->type + "\", \"" + info->path
                    + "\", " + info->expression + ", " + std::to_string(line) + ");";
        }

        const SourceLocation brace = body->getLBracLoc();
        if (brace.isInvalid() || brace.isMacroID() || rewriter_.InsertTextAfterToken(brace, code)) {
            error_ = "não foi possível inserir snapshots globais no início de main";
            return false;
        }
        return true;
    }

    Rewriter& rewriter_;
    std::string& error_;
    SourceManager& sourceManager_;
};

class InstrumentAction : public ASTFrontendAction {
public:
    explicit InstrumentAction(std::string& error) : error_(error) {}

    bool BeginSourceFileAction(CompilerInstance& compiler) override {
        rewriter_.setSourceMgr(compiler.getSourceManager(), compiler.getLangOpts());
        return true;
    }

    std::unique_ptr<ASTConsumer> CreateASTConsumer(CompilerInstance& compiler, StringRef) override {
        return std::make_unique<InstrumentConsumer>(rewriter_, error_, compiler.getSourceManager());
    }

    void EndSourceFileAction() override {
        CompilerInstance& compiler = getCompilerInstance();
        if (!error_.empty() || compiler.getDiagnostics().hasErrorOccurred()) return;

        SourceManager& sourceManager = compiler.getSourceManager();
        const FileID mainFile = sourceManager.getMainFileID();
        std::cout << "#include <algorithm-visualizer/runtime_cpp.hpp>\n";
        if (const RewriteBuffer* buffer = rewriter_.getRewriteBufferFor(mainFile)) {
            std::copy(buffer->begin(), buffer->end(), std::ostreambuf_iterator<char>(std::cout));
        } else {
            const llvm::StringRef source = sourceManager.getBufferData(mainFile);
            std::cout.write(source.data(), static_cast<std::streamsize>(source.size()));
        }
    }

private:
    Rewriter rewriter_;
    std::string& error_;
};

class InstrumentActionFactory : public FrontendActionFactory {
public:
    explicit InstrumentActionFactory(std::string& error) : error_(error) {}
    std::unique_ptr<FrontendAction> create() override {
        return std::make_unique<InstrumentAction>(error_);
    }

private:
    std::string& error_;
};

} // namespace

int main(int argc, const char** argv) {
    llvm::cl::HideUnrelatedOptions(Category);
    llvm::cl::ParseCommandLineOptions(argc, argv, "C++ structure snapshot instrumenter\n");

    std::vector<std::string> arguments = {"-std=" + Standard};
    FixedCompilationDatabase database(".", arguments);
    ClangTool tool(database, {SourceFile});

    std::string error;
    InstrumentActionFactory factory(error);
    const int result = tool.run(&factory);
    if (result != 0) return result;
    if (!error.empty()) {
        llvm::errs() << "Falha na instrumentação: " << error << "\n";
        return 1;
    }
    return 0;
}
