import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Lab from "../models/lab.model.js";
import LabTest from "../models/lab/labTest.model.js";
import User from "../models/user.model.js";

const PACKAGES = [
  {
    name: "Swastho Basic Health Package",
    shortCode: "SBHP42",
    category: "Health Package",
    sampleType: "Blood",
    description: "Essential health screening covering vital parameters for blood, heart, liver, and kidneys to detect early warning signs.",
    testCount: 42,
    pricing: {
      mrp: 1999,
      userPrice: 599,
      communityPartnerPrice: 499,
    },
    discountPercentage: 70,
    badge: "Popular",
    isPackage: true,
    popularPackage: true,
    fastingRequired: true,
    fastingDuration: "10-12 hrs fasting",
    reportTat: 12,
    preparationRequired: "10-12 hours overnight fasting is required. Only plain water is permitted.",
    homeCollectionAvailable: true,
    testsIncluded: [
      "Complete Hemogram (CBC - 24 tests)",
      "Lipid Profile Basic (5 tests)",
      "Liver Function Test (LFT - 8 tests)",
      "Kidney Function Test (KFT - 5 tests)"
    ],
    tags: ["package", "basic", "fullbody", "health checkup"],
    imageUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80",
    isActive: true,
  },
  {
    name: "Swastho Pariksha Full Body Profile",
    shortCode: "SPFB63",
    category: "Health Package",
    sampleType: "Blood",
    description: "Comprehensive full body checkup designed to screen cardiovascular health, thyroid, blood counts, diabetes, liver and kidney functions.",
    testCount: 63,
    pricing: {
      mrp: 2999,
      userPrice: 1499,
      communityPartnerPrice: 1299,
    },
    discountPercentage: 50,
    badge: "Best Value",
    isPackage: true,
    popularPackage: true,
    fastingRequired: true,
    fastingDuration: "10-12 hrs fasting",
    reportTat: 24,
    preparationRequired: "10-12 hours overnight fasting required. Water intake allowed.",
    homeCollectionAvailable: true,
    testsIncluded: [
      "Complete Hemogram (CBC - 24 tests)",
      "Comprehensive Lipid Profile (8 tests)",
      "Liver Function Profile (11 tests)",
      "Kidney Function Profile (6 tests)",
      "Thyroid Profile (T3, T4, TSH - 3 tests)",
      "Blood Sugar Fasting (1 test)",
      "Urine Routine & Microscopic (10 tests)"
    ],
    tags: ["package", "full body", "comprehensive", "routine"],
    imageUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&q=80",
    isActive: true,
  },
  {
    name: "RMDOCTO Senior Citizen Care Package",
    shortCode: "SRCARE78",
    category: "Health Package",
    sampleType: "Blood",
    description: "Specially curated for elders aged 50+ to monitor arthritis, bone strength, heart disease, diabetes, vitamin deficiencies, and organ health.",
    testCount: 78,
    pricing: {
      mrp: 3999,
      userPrice: 1899,
      communityPartnerPrice: 1699,
    },
    discountPercentage: 52,
    badge: "Senior Special",
    isPackage: true,
    popularPackage: true,
    fastingRequired: true,
    fastingDuration: "10-12 hrs fasting",
    reportTat: 24,
    preparationRequired: "10-12 hours overnight fasting required. Morning medications can be taken as advised by doctor.",
    homeCollectionAvailable: true,
    testsIncluded: [
      "CBC (24 tests)",
      "Lipid & Cardiac Markers (9 tests)",
      "Liver Function (11 tests)",
      "Kidney Function & Electrolytes (8 tests)",
      "Bone & Joint / Vitamin D & B12 (4 tests)",
      "HbA1c & Fasting Glucose (2 tests)",
      "Thyroid Profile (3 tests)",
      "Urine Routine (17 tests)"
    ],
    tags: ["senior citizen", "elderly", "package", "bones", "heart"],
    imageUrl: "https://images.unsplash.com/photo-1581056771107-24ca5f033842?w=800&q=80",
    isActive: true,
  },
  {
    name: "Women Wellness & Hormonal Balance Profile",
    shortCode: "WWP52",
    category: "Health Package",
    sampleType: "Blood",
    description: "Tailored health assessment for women addressing anemia, hormonal fluctuations, bone density markers, thyroid issues, and vitality.",
    testCount: 52,
    pricing: {
      mrp: 2499,
      userPrice: 1199,
      communityPartnerPrice: 999,
    },
    discountPercentage: 52,
    badge: "Women Health",
    isPackage: true,
    popularPackage: false,
    fastingRequired: true,
    fastingDuration: "8-10 hrs fasting",
    reportTat: 24,
    preparationRequired: "8-10 hours fasting required. Drink adequate water.",
    homeCollectionAvailable: true,
    testsIncluded: [
      "CBC with ESR (25 tests)",
      "Iron Deficiency Profile (4 tests)",
      "Thyroid Profile Total (3 tests)",
      "Vitamin D & Calcium (2 tests)",
      "Blood Sugar Fasting (1 test)",
      "Lipid Profile Basic (7 tests)",
      "Urine Routine (10 tests)"
    ],
    tags: ["women", "wellness", "hormones", "package"],
    imageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80",
    isActive: true,
  },
  {
    name: "Cardiac & Diabetic Care Health Package",
    shortCode: "CDCARE45",
    category: "Health Package",
    sampleType: "Blood",
    description: "Targeted evaluation for individuals managing hypertension, elevated cholesterol, diabetes, or early signs of cardiovascular complications.",
    testCount: 45,
    pricing: {
      mrp: 2299,
      userPrice: 999,
      communityPartnerPrice: 849,
    },
    discountPercentage: 56,
    badge: "Heart & Sugar",
    isPackage: true,
    popularPackage: true,
    fastingRequired: true,
    fastingDuration: "10-12 hrs fasting",
    reportTat: 12,
    preparationRequired: "10-12 hours fasting required. Avoid smoking and strenuous exercise prior to sample collection.",
    homeCollectionAvailable: true,
    testsIncluded: [
      "HbA1c & Average Blood Glucose (2 tests)",
      "Fasting Blood Sugar (1 test)",
      "High Sensitivity CRP (1 test)",
      "Lipid Profile Advanced (9 tests)",
      "Kidney Screening Profile (5 tests)",
      "CBC (24 tests)",
      "Urine Microalbumin (3 tests)"
    ],
    tags: ["cardiac", "heart", "diabetic", "package", "sugar"],
    imageUrl: "https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=800&q=80",
    isActive: true,
  }
];

async function seed() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not defined");

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  // Find or pick a lab
  let lab = await Lab.findOne({ isActive: true });
  if (!lab) {
    console.log("No active lab found, searching any lab...");
    lab = await Lab.findOne();
  }

  if (!lab) {
    console.error("No lab found in database! Please create a lab first.");
    process.exit(1);
  }

  console.log(`Using lab: ${lab.name} (${lab._id})`);

  let admin = await User.findOne({ role: { $in: ["admin", "superadmin"] } });
  const adminId = admin ? admin._id : lab.createdBy || new mongoose.Types.ObjectId();

  for (const pkg of PACKAGES) {
    const existing = await LabTest.findOne({ shortCode: pkg.shortCode, labId: lab._id });
    if (existing) {
      Object.assign(existing, pkg, { labId: lab._id });
      await existing.save();
      console.log(`Updated package: ${pkg.name} (${pkg.shortCode})`);
    } else {
      await LabTest.create({
        ...pkg,
        labId: lab._id,
        addedBy: adminId,
      });
      console.log(`Created package: ${pkg.name} (${pkg.shortCode})`);
    }
  }

  console.log("Seeding completed successfully!");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error("Error seeding packages:", err);
  process.exit(1);
});
