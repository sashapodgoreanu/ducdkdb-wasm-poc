
#include <emscripten/emscripten.h>

extern "C" {
    // Exporting the add_numbers function
    EMSCRIPTEN_KEEPALIVE
    int add_numbers(int a, int b) {
        return a + b;
    }
}

int main() {
    return 0;
}
