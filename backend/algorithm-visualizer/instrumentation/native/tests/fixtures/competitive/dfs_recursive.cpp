#include <iostream>
#include <vector>

std::vector<std::vector<int>> adj;
std::vector<int> vis;

void dfs(int u) {
    vis[u] = 1;
    for (int v : adj[u]) {
        if (!vis[v]) dfs(v);
    }
}

int main() {
    int n = 5;
    adj.resize(n);
    vis.resize(n, 0);
    adj[0].push_back(1);
    adj[0].push_back(2);
    adj[1].push_back(3);
    adj[2].push_back(4);
    dfs(0);
    for (int x : vis) std::cout << x << ' ';
    std::cout << '\n';
}
