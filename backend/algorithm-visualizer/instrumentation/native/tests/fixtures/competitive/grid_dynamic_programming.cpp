#include <iostream>
#include <vector>

int main() {
    std::vector<std::vector<int>> ways(3, std::vector<int>(3, 0));
    ways[0][0] = 1;

    for (int row = 0; row < 3; ++row) {
        for (int col = 0; col < 3; ++col) {
            if (row + 1 < 3) {
                ways[row + 1][col] += ways[row][col];
            }
            if (col + 1 < 3) {
                ways[row][col + 1] += ways[row][col];
            }
        }
    }

    std::cout << ways[2][2] << '\n';
}
