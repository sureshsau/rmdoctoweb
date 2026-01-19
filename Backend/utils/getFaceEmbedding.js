import * as faceapi from "face-api.js";
import canvas from "canvas";
import fs from "fs";

const { loadImage } = canvas;

export const getFaceEmbedding = async (imagePath) => {
  if (!imagePath || !fs.existsSync(imagePath)) {
    throw new Error("Invalid image path");
  }

  let img;
  try {
    img = await loadImage(imagePath);
  } catch {
    throw new Error("Unable to load image");
  }

  const detection = await faceapi
    .detectSingleFace(img)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    throw new Error("No face detected");
  }

  return Array.from(detection.descriptor);
};
