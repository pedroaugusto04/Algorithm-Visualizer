#!/bin/sh
set -eu

mode="${1:-}"
standard="${2:-}"
case "$standard" in
    gnu++17|gnu++20|gnu++23) ;;
    *) echo "Padrão C++ inválido para o runner" >&2; exit 2 ;;
esac

case "$mode" in
    instrument)
        exec av-instrumenter /work/main.cpp "--std=$standard"
        ;;
    compile)
        g++ "-std=$standard" -O2 -pipe -Wall -Wextra /work/instrumented.cpp -o /work/run
        ;;
    execute)
        exec /work/run < /work/testcase.txt
        ;;
    *) echo "Etapa do runner inválida" >&2; exit 2 ;;
esac
