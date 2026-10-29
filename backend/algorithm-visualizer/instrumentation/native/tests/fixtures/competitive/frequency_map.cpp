#include <iostream>
#include <unordered_map>

int main() {
    int n;
    std::cin >> n;

    std::unordered_map<int, int> frequency;
    for (int i = 0, value; i < n; ++i) {
        std::cin >> value;
        ++frequency[value];
    }

    std::cout << frequency[1] << ' ' << frequency[2] << ' '
              << frequency[3] << '\n';
}
