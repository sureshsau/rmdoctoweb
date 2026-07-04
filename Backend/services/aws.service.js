import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { IndexFacesCommand, SearchFacesByImageCommand, CreateCollectionCommand, ListCollectionsCommand, DeleteFacesCommand, DeleteCollectionCommand } from "@aws-sdk/client-rekognition";
import { rekognition, s3 } from "../config/aws.config.js";

export const registerFaceToAwsAndStoreImageToS3 = async ({
  userId,
  imageBuffer,
  mimeType
}) => {
  console.log("👉 registerFaceToAwsAndStoreImageToS3 called");

  try {
    const bucketName = process.env.AWS_BUCKET_NAME;
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
          Bytes: imageBuffer
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


export const uploadAttendanceImageToS3 = async ({
  userId,
  imageBuffer,
  mimeType = 'image/jpeg'
}) => {
  if (!userId || !imageBuffer) {
    throw new Error('Missing parameters for attendance image upload');
  }

  const bucketName = process.env.AWS_BUCKET_NAME;
  const region = process.env.AWS_REGION;

  if (!bucketName) {
    throw new Error('AWS_BUCKET_NAME is not configured');
  }

  const key = `attendance/${userId}/${Date.now()}.jpg`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: imageBuffer,
      ContentType: mimeType
    })
  );

  const url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

  return { url, key, bucketName };
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



export const uploadKycDocumentToS3 = async ({
  userId,
  documentType,   // "aadhaar_front" | "aadhaar_back" | "pan" | "gst"
  imageBuffer,
  mimeType
}) => {
  console.log("👉 uploadKycDocumentToS3 called");

  try {
    const bucketName = process.env.AWS_BUCKET_NAME;
    const region = process.env.AWS_REGION;


    if (!userId || !documentType || !imageBuffer || !bucketName) {
      throw new Error("Missing required parameters for KYC upload");
    }

    // 🗂️ Structured S3 key (important for audit & security)
    const key = `kyc/${userId}/${documentType}.jpg`;

    console.log("⏫ Uploading KYC document to S3...", key);

    const uploadResult = await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: imageBuffer,
        ContentType: mimeType,
        ACL: "private" // 🔒 IMPORTANT for KYC
      })
    );

    console.log(" KYC upload success:", uploadResult);

    const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

    console.log("🔹 KYC S3 URL:", s3Url);

    return {
      bucket: bucketName,
      key,
      url: s3Url,
      documentType
    };

  } catch (error) {
    console.error("❌ KYC upload failed");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Full error:", error);
    throw error;
  }
};


export const uploadMedicineImageToS3 = async ({
  medicineId,
  imageType,
  imageBuffer,
  mimeType,
  fileName
}) => {
  const bucketName = process.env.AWS_BUCKET_NAME;
  const region = process.env.AWS_REGION;

  if (!imageBuffer || !bucketName) {
    throw new Error("Missing image upload parameters");
  }

  const ext = mimeType.split("/")[1] || "jpg";
  const key = `medicines/${medicineId}/${imageType}/${Date.now()}-${fileName}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: imageBuffer,
      ContentType: mimeType
    })
  );

  return {
    url: `https://${bucketName}.s3.${region}.amazonaws.com/${key}`,
    key
  };
};


export const deleteMedicineImageFromS3 = async (key) => {
  if (!key) return;

  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      })
    );
  } catch (error) {
    console.warn(`Failed to delete S3 object (${key}):`, error.message);
  }
};


export const uploadAgreementToS3 = async ({
  userId,
  documentType,   // "agreement" | "license"
  fileBuffer,
  mimeType
}) => {
  console.log("👉 uploadAgreementToS3 called");

  try {
    const bucketName = process.env.AWS_BUCKET_NAME;
    const region = process.env.AWS_REGION;

    if (!userId || !documentType || !fileBuffer || !bucketName) {
      throw new Error("Missing required parameters for Agreement upload");
    }

    // 🗂️ Structured S3 key (audit + easy cleanup)
    const key = `agents/${userId}/agreement/${documentType}.pdf`;

    console.log("⏫ Uploading agreement to S3...", key);

    const uploadResult = await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
        ACL: "private" // 🔒 Legal document → MUST be private
      })
    );

    console.log("✅ Agreement upload success:", uploadResult);

    const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

    console.log("🔹 Agreement S3 URL:", s3Url);

    return {
      bucket: bucketName,
      key,
      url: s3Url,
      documentType
    };

  } catch (error) {
    console.error("❌ Agreement upload failed");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Full error:", error);
    throw error;
  }
};

export const uploadProfileImageToS3 = async ({
  userId,
  imageBuffer,
  mimeType,
  fileName
}) => {
  const bucketName = process.env.AWS_BUCKET_NAME;
  const region = process.env.AWS_REGION;

  if (!imageBuffer || !bucketName) {
    throw new Error("Missing image upload parameters");
  }

  const ext = mimeType.split("/")[1] || "jpg";
  const safeName = fileName ? fileName.replace(/[^a-zA-Z0-9.\-]/g, "") : "pic";
  const key = `profiles/${userId}/${Date.now()}-${safeName}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: imageBuffer,
      ContentType: mimeType
    })
  );

  return {
    url: `https://${bucketName}.s3.${region}.amazonaws.com/${key}`,
    key,
    bucket: bucketName
  };
};

export const deleteProfileImageFromS3 = async (bucket, key) => {
  if (!key || !bucket) return;

  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
  } catch (error) {
    console.warn(`Failed to delete S3 object (${key}):`, error.message);
  }
};

export const wipeAllFacesFromRekognition = async () => {
  try {
    const collectionId = process.env.REKOGNITION_COLLECTION;
    if (!collectionId) throw new Error("REKOGNITION_COLLECTION not defined");

    console.log(`🧹 Attempting to wipe all faces by deleting collection: ${collectionId}`);

    // Delete the collection
    await rekognition.send(new DeleteCollectionCommand({ CollectionId: collectionId }));
    console.log(`✅ Deleted collection: ${collectionId}`);

    // Recreate the collection empty
    await rekognition.send(new CreateCollectionCommand({ CollectionId: collectionId }));
    console.log(`✅ Recreated empty collection: ${collectionId}`);

    return { success: true, message: "All face vectors have been successfully wiped." };
  } catch (err) {
    if (err.name === "ResourceNotFoundException") {
       console.log("Collection didn't exist, creating a fresh one.");
       await ensureRekognitionCollection();
       return;
    }
    console.error("❌ Failed to wipe faces from Rekognition", err.message);
  }
};


