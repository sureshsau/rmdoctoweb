import * as faceapi from "face-api.js";
import canvas from "canvas";
import path from "path";

const { Canvas, Image, ImageData } = canvas;

faceapi.env.monkeyPatch({
  Canvas,
  Image,
  ImageData,
});

export const loadModels = async () => {
  const MODEL_PATH = path.join(process.cwd(), "MLmodels");

  await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);

  console.log("Face models loaded");
};
