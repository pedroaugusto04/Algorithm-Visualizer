cmake_minimum_required(VERSION 3.20)
project(av_instrumenter LANGUAGES CXX)

find_package(LLVM REQUIRED CONFIG)
find_package(Clang REQUIRED CONFIG)

add_executable(av-instrumenter instrumenter.cpp)
target_compile_features(av-instrumenter PRIVATE cxx_std_17)
target_include_directories(av-instrumenter SYSTEM PRIVATE ${LLVM_INCLUDE_DIRS} ${CLANG_INCLUDE_DIRS})
target_link_libraries(av-instrumenter PRIVATE clang-cpp LLVM)
set_target_properties(av-instrumenter PROPERTIES INSTALL_RPATH "/usr/lib/llvm-18/lib")

install(TARGETS av-instrumenter RUNTIME DESTINATION bin)
install(FILES ../runtime_cpp.hpp DESTINATION include/algorithm-visualizer)
install(DIRECTORY ../runtime/detail DESTINATION include/algorithm-visualizer/runtime)
