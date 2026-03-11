export const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const getSafeRandomIndex = (max: number) => {
	const array = new Uint32Array(1);
	crypto.getRandomValues(array);
	return array[0] % max;
}