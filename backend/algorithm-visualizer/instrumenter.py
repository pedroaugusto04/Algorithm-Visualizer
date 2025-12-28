#!/usr/bin/env python3
import clang.cindex
import sys
import os
import ast
import re

# 1. Configuração automática da biblioteca libclang
for path in ["/usr/lib/llvm-18/lib/libclang.so.1"]:
    if os.path.exists(path):
        clang.cindex.Config.set_library_file(path)
        break

# 2. Biblioteca C++ que será injetada no topo do código do usuário
CPP_LIBRARY = """
#include <iostream>
#include <vector>
#include <stack>
#include <queue>
#include <map>
#include <string>
#include <type_traits>
#include <algorithm>

static int __step = 1;
void __log(std::string type, std::string path, std::string op, double val) {
    std::cout << "{\\"time\\":" << __step++ << ",\\"type\\":\\"" << type << "\\",\\"path\\":\\"" << path << "\\",\\"op\\":\\"" << op << "\\",\\"value\\":" << val << "}" << std::endl;
}

template <typename T, typename = void> struct is_observable : std::false_type {};
template <typename T> struct is_observable<T, std::void_t<decltype(std::declval<T>().override_identity("", ""))>> : std::true_type {};

template <typename T>
struct AssignmentProxy {
    T& ref;
    std::string path;
    AssignmentProxy(T& r, std::string p) : ref(r), path(p) {}

    T& operator=(const T& v) {
        ref = v;
        __log("array", path, "update", (double)v);
        return ref;
    }

    T& operator=(const AssignmentProxy<T>& other) {
        return *this = (T)other;
    }

    T& operator+=(const T& v) { return *this = (ref + v); }
    T& operator-=(const T& v) { return *this = (ref - v); }
    T operator++(int) { T old = ref; *this = (ref + 1); return old; }

    operator T() const { return ref; }
};

template<typename T> class ObservedVector : public std::vector<T> {
    std::string path;
public:
    using std::vector<T>::vector;
    ObservedVector() : path("internal") {}
    ObservedVector(std::string p) : path(p) { __log("array", path, "init", 0); }
    void override_identity(std::string parent, std::string key) { path = parent + "[" + key + "]"; }
    
    void push_back(const T& v) {
        std::vector<T>::push_back(v);
        std::string idx = std::to_string(this->size()-1);
        if constexpr (is_observable<T>::value) const_cast<T&>(this->back()).override_identity(path, idx);
        __log("array", path + "[" + idx + "]", "add", (is_observable<T>::value ? 0 : (double)v));
    }
    
    auto operator[](size_t i) {
        std::string p = path + "[" + std::to_string(i) + "]";
        if constexpr (std::is_same_v<T, bool>) {
            __log("array", p, "access", 0);
            return std::vector<T>::operator[](i);
        } else if constexpr (is_observable<T>::value) {
            std::vector<T>::operator[](i).override_identity(path, std::to_string(i));
            return std::vector<T>::operator[](i);
        } else {
            return AssignmentProxy<T>(std::vector<T>::operator[](i), p);
        }
    }

    void assign(size_t n, const T& v) {
        std::vector<T>::assign(n, v);
        for(size_t i = 0; i < n; ++i) {
            __log("array", path + "[" + std::to_string(i) + "]", "add", (double)v);
        }
    }
};

template<typename K, typename V> class ObservedMap : public std::map<K, V> {
    std::string path;
public:
    using std::map<K, V>::map;
    ObservedMap() : path("internal") {}
    ObservedMap(std::string p) : path(p) { __log("map", path, "init", 0); }
    
    V& operator[](const K& key) {
        std::string ks = std::to_string(key);
        bool exists = this->count(key);
        V& val = std::map<K, V>::operator[](key);
        if constexpr (is_observable<V>::value) val.override_identity(path, ks);
        __log("map", path + "[" + ks + "]", exists ? "access" : "add", (is_observable<V>::value ? 0 : (double)key));
        return val;
    }
};

template<typename T> class ObservedQueue : public std::queue<T> {
    std::string path;
public:
    using std::queue<T>::queue;
    ObservedQueue() : path("internal") {}
    ObservedQueue(std::string p) : path(p) { __log("array", path, "init", 0); }
    void push(const T& v) {
        std::queue<T>::push(v);
        __log("array", path, "add", (double)v);
    }
    T& front() {
        __log("array", path, "access", 0);
        return std::queue<T>::front();
    }
    void pop() {
        __log("array", path, "remove", 0);
        std::queue<T>::pop();
    }
};

template<typename T> class ObservedStack : public std::stack<T> {
    std::string path;
public:
    using std::stack<T>::stack;
    ObservedStack() : path("internal") {}
    ObservedStack(std::string p) : path(p) { __log("array", path, "init", 0); }
    void push(const T& v) {
        std::stack<T>::push(v);
        __log("array", path, "add", (double)v);
    }
    T& top() {
        __log("array", path, "access", 0);
        return std::stack<T>::top();
    }
    void pop() {
        std::stack<T>::pop();
        __log("array", path, "remove", 0);
    }
};
"""

# 3. Instrumentação com Clang
def instrument(file_path, testcase_file):
    index = clang.cindex.Index.create()
    abs_path = os.path.abspath(file_path)
    tu = index.parse(abs_path, args=["-std=c++17"])

    with open(abs_path, "r") as f:
        lines = f.readlines()

    replacements = []
    has_main = False
    method_name = None
    method_return_type = "auto"

    def walk(node):
        nonlocal has_main, method_name
        # Detecta main
        if node.kind == clang.cindex.CursorKind.FUNCTION_DECL:
            if node.spelling == "main":
                has_main = True
        # Detecta classe Solution e pega o primeiro método
        if node.kind == clang.cindex.CursorKind.CLASS_DECL and node.spelling == "Solution":
            for c in node.get_children():
                if c.kind == clang.cindex.CursorKind.CXX_METHOD:
                    if method_name is None:
                        method_name = c.spelling
                        method_return_type = c.result_type.spelling
                    break
        # Substituição de variáveis para Observed*
        if node.location.file and os.path.abspath(node.location.file.name) == abs_path:
            if node.kind == clang.cindex.CursorKind.VAR_DECL:
                t = node.type.spelling
                subs = {"vector": "ObservedVector", "map": "ObservedMap",
                        "queue": "ObservedQueue", "stack": "ObservedStack"}

                for stl, obs in subs.items():
                    if f"{stl}" in t and "Observed" not in t:
                        clean_type = t.replace("std::", "")
                        for s, o in subs.items():
                            clean_type = clean_type.replace(s, o)

                        start = node.extent.start
                        end = node.extent.end
                        new_text = f"{clean_type} {node.spelling}(\"{node.spelling}\")"

                        replacements.append({
                            'line': start.line - 1,
                            'start': start.column - 1,
                            'end': end.column - 1,
                            'text': new_text
                        })
                        break

        for c in node.get_children():
            walk(c)

    walk(tu.cursor)

    for r in sorted(replacements, key=lambda x: (x['line'], x['start']), reverse=True):
        line = lines[r['line']]
        lines[r['line']] = line[:r['start']] + r['text'] + ";" + line[r['end']:]

    print(CPP_LIBRARY)
    print("".join(lines))

    # Gera main automático se não houver e houver método Solution
    if not has_main and method_name and os.path.exists(testcase_file):
        with open(testcase_file, "r") as f:
            testcase = f.read().strip()

        user_params = {}
        if testcase:
            # Regex para separar name = value sem quebrar listas
            pattern = r"(\w+)\s*=\s*(\[.*?\]|[^,]+)"
            matches = re.findall(pattern, testcase)
            for name, val in matches:
                name = name.strip()
                val = val.strip()
                try:
                    user_params[name] = ast.literal_eval(val)
                except Exception:
                    user_params[name] = val

        main_vars = []
        method_args_order = list(user_params.keys())

        for name, value in user_params.items():
            if isinstance(value, list):
                main_vars.append(f"ObservedVector<int> {name};")
                main_vars.append(f"{name}.assign({len(value)}, 0);")
                for i, val in enumerate(value):
                    main_vars.append(f"{name}[{i}] = {val};")
            elif isinstance(value, str):
                main_vars.append(f'std::string {name} = "{value}";')
            elif isinstance(value, bool):
                main_vars.append(f"bool {name} = {'true' if value else 'false'};")
            else:
                main_vars.append(f"int {name} = {value};")

        main_vars_code = "\n    ".join(main_vars)
        args_list = ", ".join(method_args_order)

        main_code = f"""
int main() {{
    Solution sol;
    {main_vars_code}

    {method_return_type} result = sol.{method_name}({args_list});
    std::cout << "SystemLog: " << result << std::endl;
    return 0;
}}
"""
        print(main_code)

if __name__ == "__main__":
    if len(sys.argv) > 2:
        instrument(sys.argv[1], sys.argv[2])
    else:
        sys.stderr.write("Uso: python3 instrumenter.py arquivo.cpp testcase.txt\n")
        sys.exit(1)
