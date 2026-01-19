import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {  IndexFacesCommand, SearchFacesByImageCommand, CreateCollectionCommand, ListCollectionsCommand } from "@aws-sdk/client-rekognition";
import { rekognition, s3 } from "../config/aws.config.js";

export const registerFaceToAwsAndStoreImageToS3 = async ({
  userId,
  imageBuffer,
  mimeType
}) => {
  console.log("👉 registerFaceToAwsAndStoreImageToS3 called");

  try {
    const bucketName = process.env.ATTENDANCE_BUCKET;
    const region = process.env.AWS_REGION;
    const collectionId = process.env.REKOGNITION_COLLECTION;

    console.log("🔹 ENV CHECK", {
      bucketName,
      region,
      collectionId,
      hasImageBuffer: !!imageBuffer,
      mimeType
    });

    if (!userId || !imageBuffer || !bucketName || !collectionId) {
      throw new Error("Missing required parameters");
    }

    const key = `faces/${userId}.jpg`;
    console.log("🔹 S3 Key:", key);

    // 1️⃣ Upload image to S3
    console.log("⏫ Uploading image to S3...");
    const s3Result = await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: imageBuffer,
        ContentType: mimeType
      })
    );
    console.log("✅ S3 upload success:", s3Result);

    const imageUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
    console.log("🔹 Image URL:", imageUrl);

    // 2️⃣ Index face in Rekognition
    console.log("🧠 Indexing face in Rekognition...");
    const rekognitionResult = await rekognition.send(
      new IndexFacesCommand({
        CollectionId: collectionId,
        Image: {
          S3Object: {
            Bucket: bucketName,
            Name: key
          }
        },
        ExternalImageId: userId,
        MaxFaces: 1,
        QualityFilter: "AUTO",
        DetectionAttributes: []
      })
    );

    console.log("✅ Rekognition raw result:", JSON.stringify(rekognitionResult, null, 2));

    if (
      !rekognitionResult.FaceRecords ||
      rekognitionResult.FaceRecords.length === 0
    ) {
      throw new Error("No face detected in image");
    }

    const faceId = rekognitionResult.FaceRecords[0].Face.FaceId;

    console.log("🎯 Face indexed successfully:", {
      faceId
    });

    return {
      faceId,
      imageUrl,
      key,
      bucketName
    };

  } catch (error) {
    console.error("❌ Face registration failed");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Full error:", error);

    throw error;
  }
};



export const verifyFaceWithRekognition = async ({
  imageBuffer,
  expectedFaceId,
  threshold = 90
}) => {
  if (!imageBuffer) {
    throw new Error("Image buffer is required for face verification");
  }

  const command = new SearchFacesByImageCommand({
    CollectionId: process.env.REKOGNITION_COLLECTION,
    Image: {
      Bytes: imageBuffer // 🔥 KEY FIX
    },
    FaceMatchThreshold: threshold,
    MaxFaces: 1
  });

  const result = await rekognition.send(command);

  if (!result.FaceMatches || result.FaceMatches.length === 0) {
    return { verified: false };
  }

  const match = result.FaceMatches[0];

  if (match.Face.FaceId !== expectedFaceId) {
    return { verified: false };
  }

  return {
    verified: true,
    confidence: match.Similarity,
    faceId: match.Face.FaceId
  };
};




export const ensureRekognitionCollection = async () => {
  const collectionId = process.env.REKOGNITION_COLLECTION;

  if (!collectionId) {
    throw new Error("REKOGNITION_COLLECTION is not defined");
  }

  try {
    // 1️⃣ List existing collections
    const listResult = await rekognition.send(
      new ListCollectionsCommand({})
    );

    const collections = listResult.CollectionIds || [];

    // 2️⃣ Create only if not exists
    if (!collections.includes(collectionId)) {
      await rekognition.send(
        new CreateCollectionCommand({
          CollectionId: collectionId
        })
      );
      console.log(`Rekognition collection created: ${collectionId}`);
    } else {
      console.log(`Rekognition collection already exists: ${collectionId}`);
    }
  } catch (error) {
    console.error("Failed to ensure Rekognition collection:", error.message);
    throw error;
  }
};

