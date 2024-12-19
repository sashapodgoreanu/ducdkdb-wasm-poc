int main() {
    return 0;
}

__attribute__((used)) int sumArrayInt32 (int *array, int length) {
    int total = 0;

    for (int i = 0; i < length; ++i) {
        total += array[i];
    }

    return total;
}