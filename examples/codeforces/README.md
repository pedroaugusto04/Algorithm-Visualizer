# Exemplos no estilo Codeforces

Cada exemplo tem um arquivo `.cpp` e um `.in` correspondente. No visualizador,
cole o conteúdo do `.cpp` em **Source Code** e o do `.in` em **Standard input**.
Os arquivos `.out` mostram a saída esperada.

- `a_plus_b`: vários casos de teste e leitura de `stdin`.
- `sort_vector`: vetor e ordenação, para conferir eventos de visualização.
- `frequency_map`: contagem com `std::map`, para conferir visualização de mapa.
- `bfs`: lista de adjacência em vetor aninhado e fila `std::queue`.
- `dfs`: busca iterativa com vetor aninhado e pilha `std::stack`.
- `dijkstra_map`: pesos em `std::map<int, std::vector<std::pair<int, int>>>` e fila de prioridade.

Todos são programas completos com `main()`, no formato stdin/stdout usado pelo
backend atual. O visualizador mostra a lista de adjacência como estrutura
aninhada; ele não infere as arestas para desenhar automaticamente um grafo
semântico a partir do código.
