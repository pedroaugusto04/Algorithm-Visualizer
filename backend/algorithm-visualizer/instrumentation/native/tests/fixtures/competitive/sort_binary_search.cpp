#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> values{4, 1, 3, 2};
    std::sort(values.begin(), values.end());

    std::cout << values[0] << ' '
              << std::binary_search(values.begin(), values.end(), 3) << '\n';
}
