#include <iostream>

int main() {
    int testCases;
    std::cin >> testCases;

    while (testCases--) {
        int a, b;
        std::cin >> a >> b;
        std::cout << a + b << '\n';
    }

    return 0;
}
