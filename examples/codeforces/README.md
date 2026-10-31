# Codeforces-style Examples

Each example includes a `.cpp` source file and a corresponding `.in` input file. In the visualizer, paste the contents of `.cpp` into **Source Code** and `.in` into **Standard input**. The `.out` files indicate the expected standard output.

- `a_plus_b`: multiple test cases and reading from `stdin`.
- `sort_vector`: vector manipulation and sorting to inspect trace visualization events.
- `frequency_map`: frequency counting using `std::map` to inspect map visualization.
- `bfs`: breadth-first search using nested vector adjacency list and `std::queue`.
- `dfs`: iterative depth-first search using nested vector and `std::stack`.
- `dijkstra_map`: weighted shortest paths using `std::map<int, std::vector<std::pair<int, int>>>` and `std::priority_queue`.

All examples are complete standalone programs with `main()`, conforming to the standard stdin/stdout format used by the backend execution engine. The visualizer renders adjacency lists as nested structures; it does not automatically infer graph topology directly from the code syntax.
