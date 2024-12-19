Compilare C in WASM

emcc sorting.c -o sorting.js -s WASM=1 -s EXPORTED_FUNCTIONS="['_sort_chunk', '_malloc', '_free']" -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]' -O3
wat2wasm .\add.wat -o add.wasm
wat2wasm add.wat -o add.wasm --enable-threads