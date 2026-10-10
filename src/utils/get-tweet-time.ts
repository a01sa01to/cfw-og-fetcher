export const getTweetTime = (id: string): Date => {
	const idNum = BigInt(id);
	const timestamp = (idNum >> 22n) + 1288834974657n; // Twitter epoch in milliseconds
	return new Date(Number(timestamp));
};
