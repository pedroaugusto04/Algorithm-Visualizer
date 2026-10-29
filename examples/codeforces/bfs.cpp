#include <iostream>
#include <queue>
#include <vector>

int main() {
    int n, m;
    std::cin >> n >> m;

    std::vector<std::vector<int>> graph(n + 1);
    for (int i = 0; i < m; ++i) {
        int from, to;
        std::cin >> from >> to;
        graph[from].push_back(to);
        graph[to].push_back(from);
    }

    int start;
    std::cin >> start;

    std::vector<int> distance(n + 1, -1);
    std::queue<int> pending;
    distance[start] = 0;
    pending.push(start);

    while (!pending.empty()) {
        int node = pending.front();
        pending.pop();

        for (int next : graph[node]) {
            if (distance[next] != -1) continue;
            distance[next] = distance[node] + 1;
            pending.push(next);
        }
    }

    for (int node = 1; node <= n; ++node) {
        if (node > 1) std::cout << ' ';
        std::cout << distance[node];
    }
    std::cout << '\n';

    return 0;
}
