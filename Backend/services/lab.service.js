// services/lab.service.js
import mongoose from "mongoose";
import Lab from "../models/lab.model.js";
import LabTest from "../models/lab/labTest.model.js";
import AppError from "../utils/AppError.js";
import { s3 } from "../config/aws.config.js";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

/* ═══════════════════════════════════════════════════
   S3 HELPERS
═══════════════════════════════════════════════════ */

export const uploadLabImageToS3 = async ({
  labId,
  imageBuffer,
  mimeType,
  fileName
}) => {
  const bucketName = process.env.AWS_BUCKET_NAME;
  const region     = process.env.AWS_REGION;

  if (!imageBuffer || !bucketName) {
    throw new AppError("Missing image upload parameters", 400);
  }

  const ext = mimeType.split("/")[1] || "jpg";
  const key = `labs/${labId}/${Date.now()}-${fileName}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket:      bucketName,
      Key:         key,
      Body:        imageBuffer,
      ContentType: mimeType
    })
  );

  return {
    url: `https://${bucketName}.s3.${region}.amazonaws.com/${key}`,
    key
  };
};

export const deleteLabImageFromS3 = async (key) => {
  if (!key) return;
  try {
    await s3.send(
      new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key })
    );
  } catch (error) {
    console.warn(`Failed to delete S3 object (${key}):`, error.message);
  }
};

/* ═══════════════════════════════════════════════════
   LAB CRUD
═══════════════════════════════════════════════════ */

export const createLabService = async ({ labData, files, userId }) => {
  let images = [];

  if (files && files.length > 0) {
    for (const file of files) {
      const result = await uploadLabImageToS3({
        labId:       "temp",
        imageBuffer: file.buffer,
        mimeType:    file.mimetype,
        fileName:    file.originalname
      });
      images.push(result);
    }
  }

  const lab = await Lab.create({ ...labData, images, addedBy: userId });
  return lab;
};

export const getLabsService = async ({
  page   = 1,
  limit  = 10,
  search = "",
  city   = ""
}) => {
  page  = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  const query = { isActive: true };

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), "i");
    query.$or = [
      { name: regex },
      { brandName: regex },
      { "address.city": regex }
    ];
  }

  if (city && city.trim()) {
    query["address.city"] = new RegExp(city.trim(), "i");
  }

  const [labs, total] = await Promise.all([
    Lab.find(query)
      .select("name brandName address.city address.state phone images isActive")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Lab.countDocuments(query)
  ]);

  return {
    data: labs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getLabByIdService = async (labId) => {
  if (!mongoose.Types.ObjectId.isValid(labId)) {
    throw new AppError("Invalid lab ID", 400);
  }

  const lab = await Lab.findById(labId)
    .select("-images.key")
    .populate({ path: "addedBy", select: "name phone email" })
    .lean();

  if (!lab) throw new AppError("Lab not found", 404);
  return lab;
};

export const updateLabService = async (labId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(labId)) {
    throw new AppError("Invalid lab ID", 400);
  }

  const lab = await Lab.findById(labId);
  if (!lab) throw new AppError("Lab not found", 404);

  Object.keys(updateData).forEach((key) => {
    if (updateData[key] !== undefined) lab[key] = updateData[key];
  });

  await lab.save();
  return lab;
};

export const deleteLabService = async (labId) => {
  if (!mongoose.Types.ObjectId.isValid(labId)) {
    throw new AppError("Invalid lab ID", 400);
  }

  const lab = await Lab.findById(labId);
  if (!lab) throw new AppError("Lab not found", 404);

  // Soft delete
  lab.isActive = false;
  await lab.save();
  return true;
};

/* ═══════════════════════════════════════════════════
   LAB TEST CRUD
═══════════════════════════════════════════════════ */

export const createLabTestService = async ({ testData, userId }) => {
  const { labId } = testData;

  if (!mongoose.Types.ObjectId.isValid(labId)) {
    throw new AppError("Invalid lab ID", 400);
  }

  const labExists = await Lab.exists({ _id: labId, isActive: true });
  if (!labExists) throw new AppError("Lab not found or inactive", 404);

  const test = await LabTest.create({ ...testData, addedBy: userId });
  return test;
};

export const getLabTestsService = async ({
  page     = 1,
  limit    = 10,
  search   = "",
  labId    = "",
  category = "",
  sampleType = ""
}) => {
  page  = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  const query = { isActive: true };

  if (labId && mongoose.Types.ObjectId.isValid(labId)) {
    query.labId = new mongoose.Types.ObjectId(labId);
  }
  if (category && category.trim()) {
    query.category = new RegExp(category.trim(), "i");
  }
  if (sampleType && sampleType.trim()) {
    query.sampleType = sampleType;
  }
  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), "i");
    query.$or = [{ name: regex }, { shortCode: regex }, { category: regex }, { tags: regex }];
  }

  const [tests, total] = await Promise.all([
    LabTest.find(query)
      .select("name shortCode category sampleType pricing gstPercentage homeCollectionAvailable reportTat labId isActive")
      .populate({ path: "labId", select: "name brandName address.city" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    LabTest.countDocuments(query)
  ]);

  return {
    data: tests,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  };
};

export const getLabTestByIdService = async (testId) => {
  if (!mongoose.Types.ObjectId.isValid(testId)) {
    throw new AppError("Invalid test ID", 400);
  }

  const test = await LabTest.findById(testId)
    .populate({ path: "labId", select: "name brandName address phone email" })
    .populate({ path: "addedBy", select: "name phone" })
    .lean();

  if (!test) throw new AppError("Lab test not found", 404);
  return test;
};

export const updateLabTestService = async (testId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(testId)) {
    throw new AppError("Invalid test ID", 400);
  }

  const test = await LabTest.findById(testId);
  if (!test) throw new AppError("Lab test not found", 404);

  Object.keys(updateData).forEach((key) => {
    if (updateData[key] !== undefined) test[key] = updateData[key];
  });

  await test.save();
  return test;
};

export const deleteLabTestService = async (testId) => {
  if (!mongoose.Types.ObjectId.isValid(testId)) {
    throw new AppError("Invalid test ID", 400);
  }

  const test = await LabTest.findById(testId);
  if (!test) throw new AppError("Lab test not found", 404);

  test.isActive = false;
  await test.save();
  return true;
};
