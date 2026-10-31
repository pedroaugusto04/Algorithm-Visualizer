export interface SampleAlgorithm {
  name: string;
  description: string;
  language: 'cpp17' | 'cpp20' | 'cpp23';
  sourceCode: string;
  input: string;
}

export const DIJKSTRA_SAMPLE: SampleAlgorithm = {
  name: "Dijkstra's Shortest Path",
  description: "Graph shortest path algorithm using std::priority_queue and std::map.",
  language: 'cpp17',
  sourceCode: `#include <functional>
#include <iostream>
#include <map>
#include <queue>
#include <utility>
#include <vector>

int main() {
    int n, m;
    std::cin >> n >> m;

    std::map<int, std::vector<std::pair<int, int>>> graph;
    for (int node = 1; node <= n; ++node) {
        graph[node] = {};
    }

    for (int i = 0; i < m; ++i) {
        int from, to, weight;
        std::cin >> from >> to >> weight;
        graph[from].push_back({to, weight});
        graph[to].push_back({from, weight});
    }

    int start;
    std::cin >> start;

    const long long infinity = 1LL << 60;
    std::map<int, long long> distance;
    for (int node = 1; node <= n; ++node) {
        distance[node] = infinity;
    }

    using State = std::pair<long long, int>;
    std::priority_queue<State, std::vector<State>, std::greater<State>> pending;
    distance[start] = 0;
    pending.push({0, start});

    while (!pending.empty()) {
        State state = pending.top();
        pending.pop();

        long long currentDistance = state.first;
        int node = state.second;
        if (currentDistance != distance[node]) continue;

        for (int i = 0; i < static_cast<int>(graph[node].size()); ++i) {
            int next = graph[node][i].first;
            int weight = graph[node][i].second;
            long long candidate = currentDistance + weight;

            if (candidate < distance[next]) {
                distance[next] = candidate;
                pending.push({candidate, next});
            }
        }
    }

    for (int node = 1; node <= n; ++node) {
        if (node > 1) std::cout << ' ';
        if (distance[node] == infinity) {
            std::cout << -1;
        } else {
            std::cout << distance[node];
        }
    }
    std::cout << '\\n';

    return 0;
}`,
  input: `5 6
1 2 4
1 3 1
3 2 2
2 4 1
3 4 5
4 5 3
1`
};
