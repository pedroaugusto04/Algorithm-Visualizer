#include <iostream>
#include <map>

int main() {
    int n;
    std::cin >> n;

    std::map<int, int> frequency;
    for (int i = 0; i < n; ++i) {
        int value;
        std::cin >> value;
        ++frequency[value];
    }

    for (const auto& [value, count] : frequency) {
        std::cout << value << ' ' << count << '\n';
    }

    return 0;
}
