#include <iostream>
#include <vector>

std::vector<int> memo;

int fib(int n) {
    if (memo[n] != -1) return memo[n];
    if (n <= 1) {
        memo[n] = n;
        return n;
    }
    int ans = fib(n - 1) + fib(n - 2);
    memo[n] = ans;
    return ans;
}

int main() {
    int n = 6;
    memo.resize(n + 1, -1);
    std::cout << fib(n) << '\n';
}
