#include <iostream>
#include <format>
#include <vector>
#include <cstdlib>
#include <cstring>
#include <numeric>

#include <emscripten/emscripten.h>

int main() {
	std::string author { "world" };
	std::cout << "Hello, " << author << "! (C++ by Sm3P)" << std::endl;
	// std::cout << 	std::format("Hello, {}! (C++ by Sm3P)", author) << std::endl;
	
	int number = 0;
	std::cout << "Insert a number: " << std::endl;
	std::cin >> number;
	
	std::cout << "You wrote: " << number << std::endl;
	
	return 0;
}

#ifdef __cplusplus
#define EXTERN extern "C"
#else
#define EXTERN
#endif

EXTERN EMSCRIPTEN_KEEPALIVE void myFunction(int argc, char ** argv) {
    std::cout << "MyFunction Called\n";
}

EXTERN EMSCRIPTEN_KEEPALIVE int sum(int a, int b) {
	std::cout << "Function Sum Called\n";
	int result = a + b;
	return result;
}

struct Employee {
	std::string name;
	int age;
};

EXTERN EMSCRIPTEN_KEEPALIVE void set_employee(Employee* employee) {
	// std::cout << std::format("Name: {}, age: {}", employee->name, employee->age) << std::endl;
}