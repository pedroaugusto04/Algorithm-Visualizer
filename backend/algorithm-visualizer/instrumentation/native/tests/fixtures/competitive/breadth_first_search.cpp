#include <iostream>
#include <queue>
#include <vector>

int main() {
    std::vector<std::vector<int>> graph{{1, 2}, {3}, {3}, {}};
    std::vector<int> distance(4, -1);
    std::queue<int> pending;

    distance[0] = 0;
    pending.push(0);
    while (!pending.empty()) {
        int node = pending.front();
        pending.pop();
        for (int next : graph[node]) {
            if (distance[next] == -1) {
                distance[next] = distance[node] + 1;
                pending.push(next);
            }
        }
    }

    for (int value : distance) {
        std::cout << value << ' ';
    }
    std::cout << '\n';
}
