cmake_minimum_required(VERSION 3.18.1)

project(FocalytApp)

# Set C++ standard
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find required packages
find_package(ReactAndroid REQUIRED CONFIG)

# Add your native modules here if needed
# add_library(your_module SHARED your_source.cpp)
# target_link_libraries(your_module ReactAndroid::jsi) 