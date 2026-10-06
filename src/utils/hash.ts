const ceilPow2 = (x: number): number => {
	let p = 1;
	while (p < x) p <<= 1;
	return p;
};

const grayCode = (x: number): number => x ^ (x >> 1);

export const generateHash = async (input: string): Promise<string> => {
	let s = "";
	const n = ceilPow2(input.length);
	for (let i = 0; i < n; i++) {
		const idx = grayCode(i);
		s += idx < input.length ? input[idx] : " ";
	}
	const hash = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(s),
	);
	return Array.from(new Uint8Array(hash))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
};
