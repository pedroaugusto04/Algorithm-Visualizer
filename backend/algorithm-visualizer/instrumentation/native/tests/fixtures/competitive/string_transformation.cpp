#include <algorithm>
#include <iostream>
#include <string>

int main() {
    std::string word{"competitive"};
    std::reverse(word.begin(), word.end());
    std::cout << word << '\n';
}
