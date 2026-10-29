#pragma once

#include <algorithm>
#include <map>
#include <set>
#include <string>
#include <vector>

#include "clang/AST/DeclCXX.h"
#include "clang/Basic/SourceManager.h"
#include "clang/Rewrite/Core/Rewriter.h"
#include "ast_analysis.hpp"

namespace av::detail {

class UserTypeSerializer {
public:
    UserTypeSerializer(SourceManager& sourceManager, Rewriter& rewriter)
        : sourceManager_(sourceManager), rewriter_(rewriter) {}

    bool inject(const TrackedMap& tracked, const FunctionDecl* mainFunction) {
        for (const auto& [declaration, info] : tracked) {
            (void)info;
            if (!collectValueType(declaration->getType())) return false;
        }

        if (records_.empty()) return true;

        const SourceLocation mainLocation = mainFunction->getBeginLoc();
        for (const auto& [name, record] : records_) {
            (void)name;
            const SourceLocation definitionEnd = record->getEndLoc();
            if (definitionEnd.isInvalid() || mainLocation.isInvalid()
                    || sourceManager_.isBeforeInTranslationUnit(mainLocation, definitionEnd)) {
                error_ = "struct observado deve estar definido antes de main: "
                        + record->getQualifiedNameAsString();
                return false;
            }
        }

        std::string generated;
        for (const auto& [name, record] : records_) {
            (void)name;
            generated += wrapInNamespaces(record, declarationFor(record));
        }
        for (const auto& [name, record] : records_) {
            (void)name;
            generated += wrapInNamespaces(record, definitionFor(record));
        }

        if (rewriter_.InsertText(mainLocation, generated, false, true)) {
            error_ = "não foi possível inserir serializers para structs observadas";
            return false;
        }
        return true;
    }

    const std::string& error() const { return error_; }

    bool serializes(const CXXRecordDecl* record) const {
        const CXXRecordDecl* definition = record ? record->getDefinition() : nullptr;
        return definition && records_.count(definition->getQualifiedNameAsString()) > 0;
    }

private:
    SourceManager& sourceManager_;
    Rewriter& rewriter_;
    std::map<std::string, const CXXRecordDecl*> records_;
    std::set<const CXXRecordDecl*> visited_;
    std::string error_;

    bool collectValueType(QualType type) {
        type = type.getCanonicalType().getUnqualifiedType();
        if (type->isArithmeticType() || type->isEnumeralType()) return true;
        if (type->isPointerType() || type->isReferenceType()) {
            error_ = "ponteiros e referências em structs observadas não são suportados";
            return false;
        }
        if (const auto* array = dyn_cast<ConstantArrayType>(type.getTypePtr())) {
            return collectValueType(array->getElementType());
        }

        const auto* specialization = dyn_cast_or_null<ClassTemplateSpecializationDecl>(
                type->getAsCXXRecordDecl());
        if (specialization) {
            const std::string name = specialization->getSpecializedTemplate()->getNameAsString();
            const unsigned count = specialization->getTemplateArgs().size();
            if (name == "basic_string" && count > 0
                    && specialization->getTemplateArgs()[0].getKind() == TemplateArgument::Type
                    && specialization->getTemplateArgs()[0].getAsType()->isCharType()) return true;
            if (name == "bitset") return true;
            if (name == "pair" || name == "tuple") {
                for (unsigned index = 0; index < count; ++index) {
                    const TemplateArgument& argument = specialization->getTemplateArgs()[index];
                    if (argument.getKind() == TemplateArgument::Type
                            && !collectValueType(argument.getAsType())) return false;
                }
                return true;
            }

            static const std::set<std::string> sequenceTypes = {
                "vector", "deque", "list", "forward_list", "array", "set", "multiset",
                "unordered_set", "unordered_multiset", "stack", "queue", "priority_queue"
            };
            static const std::set<std::string> mapTypes = {
                "map", "multimap", "unordered_map", "unordered_multimap"
            };
            if (sequenceTypes.count(name) && count > 0) {
                const TemplateArgument& argument = specialization->getTemplateArgs()[0];
                return argument.getKind() != TemplateArgument::Type || collectValueType(argument.getAsType());
            }
            if (mapTypes.count(name) && count > 1) {
                for (unsigned index = 0; index < 2; ++index) {
                    const TemplateArgument& argument = specialization->getTemplateArgs()[index];
                    if (argument.getKind() == TemplateArgument::Type
                            && !collectValueType(argument.getAsType())) return false;
                }
                return true;
            }

            error_ = "tipo de campo não suportado em struct observada: " + type.getAsString();
            return false;
        }

        const auto* record = type->getAsCXXRecordDecl();
        if (!record || !sourceManager_.isWrittenInMainFile(record->getLocation())) {
            if (type->isBuiltinType()) return true;
            error_ = "tipo de campo não suportado em struct observada: " + type.getAsString();
            return false;
        }
        return collectRecord(record);
    }

    bool collectRecord(const CXXRecordDecl* record) {
        const CXXRecordDecl* definition = record->getDefinition();
        if (!definition || !visited_.insert(definition).second) return true;
        if (!definition->isStruct() || definition->getDescribedClassTemplate() || definition->getNumBases() != 0
                || definition->getName().empty()) {
            error_ = "struct observado fora do subconjunto suportado: "
                    + definition->getQualifiedNameAsString();
            return false;
        }

        for (const DeclContext* context = definition->getDeclContext(); context; context = context->getParent()) {
            if (isa<FunctionDecl>(context) || isa<CXXRecordDecl>(context)) {
                error_ = "struct observado deve estar em escopo global ou namespace: "
                        + definition->getQualifiedNameAsString();
                return false;
            }
            if (const auto* nameSpace = dyn_cast<NamespaceDecl>(context)) {
                if (nameSpace->isAnonymousNamespace()) {
                    error_ = "struct observado em namespace anônimo não suportado: "
                            + definition->getNameAsString();
                    return false;
                }
            }
        }

        records_.emplace(definition->getQualifiedNameAsString(), definition);
        for (const FieldDecl* field : definition->fields()) {
            if (field->getAccess() != AS_public || field->isBitField()) {
                error_ = "campo não suportado em struct observado: "
                        + definition->getQualifiedNameAsString() + "::" + field->getNameAsString();
                return false;
            }
            if (!collectValueType(field->getType())) {
                if (error_.empty()) {
                    error_ = "campo não suportado em struct observado: "
                            + definition->getQualifiedNameAsString() + "::" + field->getNameAsString();
                }
                return false;
            }
        }

        return true;
    }

    std::string declarationFor(const CXXRecordDecl* record) const {
        return "inline std::string __serialize(const " + qualifiedType(record) + "& value); ";
    }

    std::string definitionFor(const CXXRecordDecl* record) const {
        std::string code = "inline std::string __serialize(const " + qualifiedType(record)
                + "& value) { std::string out = \"{\";";
        bool first = true;
        for (const FieldDecl* field : record->fields()) {
            if (!first) code += " out += \",\";";
            code += " out += __json_string(\"" + field->getNameAsString()
                    + "\") + \":\" + " + serializeField(field) + ";";
            first = false;
        }
        code += " return out + \"}\"; } ";
        return code;
    }

    std::string qualifiedType(const CXXRecordDecl* record) const {
        return "::" + record->getQualifiedNameAsString();
    }

    std::string serializeField(const FieldDecl* field) const {
        const QualType type = field->getType().getCanonicalType().getUnqualifiedType();
        const std::string expression = "value." + field->getNameAsString();
        if (type->isEnumeralType()) {
            const TagDecl* declaration = type->getAsTagDecl();
            const std::string enumType = declaration
                    ? "::" + declaration->getQualifiedNameAsString() : type.getAsString();
            return "::__serialize(static_cast<std::underlying_type_t<" + enumType + ">>(" + expression + "))";
        }

        const auto* record = type->getAsCXXRecordDecl();
        if (record && records_.count(record->getQualifiedNameAsString())) {
            return namespaceQualifier(record) + "::__serialize(" + expression + ")";
        }
        return "::__serialize(" + expression + ")";
    }

    std::string namespaceQualifier(const CXXRecordDecl* record) const {
        std::vector<std::string> namespaces;
        for (const DeclContext* context = record->getDeclContext(); context; context = context->getParent()) {
            if (const auto* nameSpace = dyn_cast<NamespaceDecl>(context)) {
                namespaces.push_back(nameSpace->getNameAsString());
            }
        }
        std::reverse(namespaces.begin(), namespaces.end());
        std::string qualifier = "";
        for (const std::string& name : namespaces) qualifier += "::" + name;
        return qualifier.empty() ? "::" : qualifier;
    }

    std::string wrapInNamespaces(const CXXRecordDecl* record, const std::string& code) const {
        std::vector<std::string> namespaces;
        for (const DeclContext* context = record->getDeclContext(); context; context = context->getParent()) {
            if (const auto* nameSpace = dyn_cast<NamespaceDecl>(context)) {
                namespaces.push_back(nameSpace->getNameAsString());
            }
        }
        std::reverse(namespaces.begin(), namespaces.end());
        std::string wrapped;
        for (const std::string& name : namespaces) wrapped += "namespace " + name + " { ";
        wrapped += code;
        for (size_t index = 0; index < namespaces.size(); ++index) wrapped += "} ";
        return wrapped + " ";
    }
};

} // namespace av::detail
