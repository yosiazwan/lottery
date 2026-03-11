export const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const getSafeRandomIndex = (max: number): number => {
    if (max <= 0) throw new Error("max harus lebih besar dari 0");

    const array = new Uint32Array(1);

    // Rejection sampling (cara standar menghilangkan modulo bias)
    let randomValue: number;
    const maxValid = Math.floor(0x100000000 / max) * max; // 2³²

    do {
        crypto.getRandomValues(array);
        randomValue = array[0];
    } while (randomValue >= maxValid);

    return randomValue % max;
};