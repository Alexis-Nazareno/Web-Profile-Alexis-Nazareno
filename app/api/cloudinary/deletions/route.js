import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export const runtime = "nodejs";

const adminAppName = "portfolio-cloudinary-cleanup";
const contentCollections = [
  "draftContent",
  "publicContent",
  "draftProjects",
  "publicProjects",
  "draftExperience",
  "publicExperience",
  "draftAchievements",
  "publicAchievements",
];

function getAdminApp() {
  const existingApp = getApps().find((app) => app.name === adminAppName);
  if (existingApp) return existingApp;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!serviceAccountJson || !projectId) {
    throw new Error(
      "Cloudinary deletion requires FIREBASE_SERVICE_ACCOUNT_JSON and NEXT_PUBLIC_FIREBASE_PROJECT_ID.",
    );
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON must be valid JSON.");
  }

  if (serviceAccount.project_id !== projectId) {
    throw new Error(
      "The Firebase service account does not match NEXT_PUBLIC_FIREBASE_PROJECT_ID.",
    );
  }

  return initializeApp(
    {
      credential: cert(serviceAccount),
      projectId,
    },
    adminAppName,
  );
}

function isAssetReferenced(data, asset) {
  const candidates = [
    data.photo,
    data.resume,
    data.organizationLogo,
    ...(Array.isArray(data.images) ? data.images : []),
  ];

  return candidates.some(
    (candidate) =>
      candidate?.publicId === asset.publicId &&
      (!candidate.resourceType || candidate.resourceType === asset.resourceType),
  );
}

async function destroyCloudinaryAsset(asset) {
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary deletion requires CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
    );
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params = {
    invalidate: "true",
    public_id: asset.publicId,
    timestamp,
  };
  const signatureBase = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  const signature = createHash("sha1")
    .update(`${signatureBase}${apiSecret}`)
    .digest("hex");
  const body = new URLSearchParams({
    ...params,
    api_key: apiKey,
    signature,
  });

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${asset.resourceType}/destroy`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    },
  );

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("Cloudinary returned an unreadable deletion response.");
  }

  if (!response.ok || !["ok", "not found"].includes(result.result)) {
    throw new Error(
      result.error?.message || `Cloudinary deletion failed (${response.status}).`,
    );
  }
}

export async function POST(request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  const adminUid = process.env.NEXT_PUBLIC_FIREBASE_ADMIN_UID;
  if (!token) {
    return NextResponse.json(
      { error: "Admin authentication is required." },
      { status: 401 },
    );
  }
  if (!adminUid) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_FIREBASE_ADMIN_UID is not configured." },
      { status: 503 },
    );
  }

  try {
    const app = getAdminApp();
    const decodedToken = await getAuth(app).verifyIdToken(token);
    if (decodedToken.uid !== adminUid) {
      return NextResponse.json(
        { error: "You are not allowed to delete Cloudinary assets." },
        { status: 403 },
      );
    }

    const database = getFirestore(app);
    const queuedAssets = await database
      .collection("cloudinaryDeletionQueue")
      .get();
    if (queuedAssets.empty) {
      return NextResponse.json({ deletedCount: 0, deferredCount: 0 });
    }

    const contentSnapshots = await Promise.all(
      contentCollections.map((name) => database.collection(name).get()),
    );
    const allContent = contentSnapshots.flatMap((snapshot) =>
      snapshot.docs.map((content) => content.data()),
    );
    let deletedCount = 0;
    let deferredCount = 0;

    for (const queuedAsset of queuedAssets.docs) {
      const asset = queuedAsset.data();
      if (
        typeof asset.publicId !== "string" ||
        !asset.publicId ||
        !["image", "raw"].includes(asset.resourceType)
      ) {
        throw new Error(
          `Invalid Cloudinary deletion request in queue item ${queuedAsset.id}.`,
        );
      }

      if (allContent.some((content) => isAssetReferenced(content, asset))) {
        deferredCount += 1;
        continue;
      }

      await destroyCloudinaryAsset(asset);
      await queuedAsset.ref.delete();
      deletedCount += 1;
    }

    return NextResponse.json({ deletedCount, deferredCount });
  } catch (error) {
    console.error("Could not process Cloudinary deletion queue:", error);
    return NextResponse.json(
      { error: error.message || "Cloudinary cleanup failed." },
      { status: 500 },
    );
  }
}
