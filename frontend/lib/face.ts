// lib/face.ts

export async function generateFaceVector(
  capturedImage: string
): Promise<number[]> {
  // 🔴 Replace later with real face-api.js logic

  const dummyVector: number[] = Array.from({ length: 128 }, () =>
    Number((Math.random() * 2 - 1).toFixed(6))
  );

  return dummyVector;
}
