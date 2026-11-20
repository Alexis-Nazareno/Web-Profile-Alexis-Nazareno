import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { cvStarterContent } from "./cvStarterContent";
import { db } from "./firebase";

const collectionNames = {
  home: { drafts: "draftContent", published: "publicContent" },
  about: { drafts: "draftContent", published: "publicContent" },
  contact: { drafts: "draftContent", published: "publicContent" },
  projects: { drafts: "draftProjects", published: "publicProjects" },
  experience: { drafts: "draftExperience", published: "publicExperience" },
  achievements: {
    drafts: "draftAchievements",
    published: "publicAchievements",
  },
};

function isCloudinaryAsset(asset) {
  return (
    asset &&
    typeof asset.url === "string" &&
    asset.url.startsWith("https://") &&
    typeof asset.publicId === "string"
  );
}

function sanitizeAsset(asset) {
  if (!isCloudinaryAsset(asset)) return null;
  return {
    id: asset.publicId,
    name: asset.name || "",
    url: asset.url,
    publicId: asset.publicId,
    resourceType: asset.resourceType || "",
    format: asset.format || "",
    contentType: asset.contentType || "",
    sizeBytes: Number(asset.sizeBytes) || 0,
  };
}

function contentWithCloudinaryMedia(section, item) {
  if (section === "home") {
    const { photoImageId, cvDownloadLink, ...content } = item;
    return {
      ...content,
      photo: sanitizeAsset(item.photo),
      resume: sanitizeAsset(item.resume),
    };
  }

  if (section === "contact") {
    const content = { ...item };
    delete content.phone;
    delete content.address;
    delete content.fullAddress;
    delete content.streetAddress;
    return content;
  }

  if (section === "projects" || section === "achievements") {
    const { imageIds, ...content } = item;
    return {
      ...content,
      images: Array.isArray(item.images)
        ? item.images.map(sanitizeAsset).filter(Boolean)
        : [],
    };
  }

  return item;
}

function validateContent(section, item) {
  const urlFields =
    section === "projects"
      ? ["liveUrl", "sourceUrl"]
      : section === "contact"
        ? ["website"]
        : [];

  for (const field of urlFields) {
    if (!item[field]) continue;
    let url;
    try {
      url = new URL(item[field]);
    } catch {
      throw new Error(`${field} must be a complete http(s) URL.`);
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error(`${field} must use http or https.`);
    }
  }

  if (section === "home") {
    if (item.photo && !isCloudinaryAsset(item.photo)) {
      throw new Error("The profile photo is missing its Cloudinary URL or public ID.");
    }
    if (item.resume && !isCloudinaryAsset(item.resume)) {
      throw new Error("The CV PDF is missing its Cloudinary URL or public ID.");
    }
    if (item.resume && item.resume.contentType !== "application/pdf") {
      throw new Error("The CV upload must be a PDF.");
    }
    if (item.resume && item.resume.resourceType !== "raw") {
      throw new Error("The CV PDF must be stored as a raw Cloudinary file.");
    }
  }

  if (section === "projects" || section === "achievements") {
    if (!Array.isArray(item.images) || item.images.length > 4) {
      throw new Error("Projects and certificates can have up to 4 images.");
    }
    if (item.images.some((asset) => !isCloudinaryAsset(asset))) {
      throw new Error("Each image must have a Cloudinary URL and public ID.");
    }
  }
}

export async function publishCvStarterContent() {
  const collectionNamesToCheck = [
    "draftContent",
    "publicContent",
    "draftProjects",
    "publicProjects",
    "draftExperience",
    "publicExperience",
    "draftAchievements",
    "publicAchievements",
  ];
  const snapshots = await Promise.all(
    collectionNamesToCheck.map((name) => getDocs(collection(db, name))),
  );
  if (snapshots.some((snapshot) => !snapshot.empty)) {
    throw new Error(
      "CV import stopped to protect existing content. Import is available only when the CMS collections are empty.",
    );
  }

  const batch = writeBatch(db);
  let itemCount = 0;
  const addPublishedItem = (section, item) => {
    const config = collectionNames[section];
    const content = contentWithCloudinaryMedia(section, item);
    batch.set(doc(db, config.drafts, item.id), {
      ...content,
      published: true,
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, config.published, item.id), {
      ...content,
      published: true,
      updatedAt: serverTimestamp(),
    });
    itemCount += 1;
  };

  Object.entries(cvStarterContent.sections).forEach(([section, item]) => {
    addPublishedItem(section, item);
  });
  cvStarterContent.experience.forEach((item) =>
    addPublishedItem("experience", item),
  );
  cvStarterContent.projects.forEach((item) =>
    addPublishedItem("projects", item),
  );
  cvStarterContent.achievements.forEach((item) =>
    addPublishedItem("achievements", item),
  );

  await batch.commit();
  return itemCount;
}

export async function saveDraft(section, item) {
  const config = collectionNames[section];
  if (!config) throw new Error("Unknown portfolio content section.");
  validateContent(section, item);

  await setDoc(doc(db, config.drafts, item.id), {
    ...contentWithCloudinaryMedia(section, item),
    updatedAt: serverTimestamp(),
  });
}

export async function publishDraft(section, item) {
  const config = collectionNames[section];
  if (!config) throw new Error("Unknown portfolio content section.");
  validateContent(section, item);

  const content = contentWithCloudinaryMedia(section, item);
  const batch = writeBatch(db);
  batch.set(doc(db, config.drafts, item.id), {
    ...content,
    published: true,
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(db, config.published, item.id), {
    ...content,
    published: true,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function unpublishDraft(section, item) {
  const config = collectionNames[section];
  if (!config) throw new Error("Unknown portfolio content section.");

  const batch = writeBatch(db);
  batch.delete(doc(db, config.published, item.id));
  batch.set(
    doc(db, config.drafts, item.id),
    {
      ...contentWithCloudinaryMedia(section, item),
      published: false,
      updatedAt: serverTimestamp(),
    },
  );
  await batch.commit();
}

export async function deleteContent(section, item) {
  const config = collectionNames[section];
  if (!config) throw new Error("Unknown portfolio content section.");

  const batch = writeBatch(db);
  batch.delete(doc(db, config.published, item.id));
  batch.delete(doc(db, config.drafts, item.id));
  await batch.commit();
}
