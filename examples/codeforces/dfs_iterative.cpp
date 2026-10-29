#include <iostream>
#include <stack>
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

    std::vector<int> visited(n + 1, 0);
    std::vector<int> order;
    std::stack<int> pending;
    pending.push(start);
    visited[start] = 1;

    while (!pending.empty()) {
        int node = pending.top();
        pending.pop();
        order.push_back(node);

        for (int i = static_cast<int>(graph[node].size()) - 1; i >= 0; --i) {
            int next = graph[node][i];
            if (visited[next]) continue;
            visited[next] = 1;
            pending.push(next);
        }
    }

    for (std::size_t i = 0; i < order.size(); ++i) {
        if (i > 0) std::cout << ' ';
        std::cout << order[i];
    }
    std::cout << '\n';

    return 0;
}
