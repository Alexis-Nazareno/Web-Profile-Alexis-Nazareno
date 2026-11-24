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
import { getHighlightSchedule } from "./highlightSchedule.mjs";
import { MAX_ABOUT_PHOTOS } from "./portfolio";
import { getSocialLinks } from "./socialLinks.mjs";
import { MAX_MEMORY_IMAGES } from "./workMemories.mjs";
import { isCertificateFile } from "./certificateFiles.mjs";

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
  workAchievements: {
    drafts: "draftAchievements",
    published: "publicAchievements",
  },
  memories: { drafts: "draftMemories", published: "publicMemories" },
  lessons: { drafts: "draftLessons", published: "publicLessons" },
  highlights: { drafts: "draftHighlights", published: "publicHighlights" },
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
  const contentWithoutStatus = { ...item };
  delete contentWithoutStatus.status;

  if (section === "home") {
    const { photoImageId, cvDownloadLink, ...content } = contentWithoutStatus;
    return {
      ...content,
      photo: sanitizeAsset(contentWithoutStatus.photo),
      resume: sanitizeAsset(contentWithoutStatus.resume),
    };
  }

  if (section === "contact") {
    const content = contentWithoutStatus;
    delete content.phone;
    delete content.address;
    delete content.fullAddress;
    delete content.streetAddress;
    return content;
  }

  if (section === "about") {
    return {
      ...contentWithoutStatus,
      photos: Array.isArray(contentWithoutStatus.photos)
        ? contentWithoutStatus.photos.map(sanitizeAsset).filter(Boolean)
        : [],
    };
  }

  if (section === "projects" || section === "achievements" || section === "workAchievements" || section === "memories") {
    const { imageIds, ...content } = contentWithoutStatus;
    return {
      ...content,
      images: Array.isArray(contentWithoutStatus.images)
        ? contentWithoutStatus.images.map(sanitizeAsset).filter(Boolean)
        : [],
      ...(section === "workAchievements"
        ? { contentType: "workAchievement", document: sanitizeAsset(contentWithoutStatus.document) }
        : {}),
    };
  }

  if (section === "experience") {
    const { organizationLogo, ...content } = contentWithoutStatus;
    return {
      ...content,
      organizationLogo: sanitizeAsset(organizationLogo),
    };
  }

  if (section === "highlights") {
    return {
      ...contentWithoutStatus,
      image: sanitizeAsset(contentWithoutStatus.image),
    };
  }

  return contentWithoutStatus;
}

function validateContent(section, item, { requireHighlightImage = false } = {}) {
  const urlFields =
    section === "projects"
      ? ["liveUrl", "sourceUrl"]
      : section === "contact"
        ? ["website"]
        : section === "highlights"
          ? ["link"]
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

  if (section === "contact") {
    const { invalid } = getSocialLinks(item);
    if (invalid.length) {
      throw new Error(`${invalid.join(", ")} URL must be a complete http(s) URL.`);
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

  if (section === "highlights") {
    if (!item.title?.trim()) {
      throw new Error("Enter a title for this holiday or event.");
    }
    if (item.kind && !["holiday", "event"].includes(item.kind)) {
      throw new Error("Choose whether this is a holiday or an event.");
    }
    if (
      (requireHighlightImage || item.image) &&
      (!isCloudinaryAsset(item.image) ||
        item.image.resourceType !== "image" ||
        !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
          item.image.contentType,
        ))
    ) {
      throw new Error("Upload a JPG, PNG, WEBP, or GIF poster or event image.");
    }
    if (!getHighlightSchedule(item)) {
      throw new Error(
        "Set a valid start and end time. The end must not be before the start.",
      );
    }
    if (
      item.date &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(item.date) ||
        Number.isNaN(Date.parse(`${item.date}T00:00:00.000Z`)) ||
        new Date(`${item.date}T00:00:00.000Z`).toISOString().slice(0, 10) !==
          item.date)
    ) {
      throw new Error("Choose a valid event date.");
    }
  }

  if (section === "about") {
    const photos = item.photos ?? [];
    if (!Array.isArray(photos) || photos.length > MAX_ABOUT_PHOTOS) {
      throw new Error(
        `About can have up to ${MAX_ABOUT_PHOTOS} photos.`,
      );
    }
    if (
      photos.some(
        (asset) =>
          !isCloudinaryAsset(asset) ||
          asset.resourceType !== "image" ||
          !["image/jpeg", "image/png", "image/webp"].includes(
            asset.contentType,
          ),
      )
    ) {
      throw new Error("About photos must be JPG, PNG, or WEBP Cloudinary images.");
    }
  }

  if (section === "projects" || section === "achievements" || section === "workAchievements" || section === "memories") {
    const maximumImages = section === "memories" ? MAX_MEMORY_IMAGES : 4;
    if (!Array.isArray(item.images) || item.images.length > maximumImages) {
      throw new Error(
        section === "memories"
          ? "Memory albums can have up to 20 images."
          : "Projects and certificates can have up to 4 images.",
      );
    }
    if (item.images.some((asset) => !isCloudinaryAsset(asset))) {
      throw new Error("Each image must have a Cloudinary URL and public ID.");
    }
  }

  if (section === "memories" && !item.organization?.trim()) {
    throw new Error("Enter a company for this memory album.");
  }

  if (section === "workAchievements" && item.document) {
    const document = item.document;
    if (
      !isCloudinaryAsset(document) ||
      document.resourceType !== "raw" ||
      !isCertificateFile({ name: document.name, type: document.contentType })
    ) {
      throw new Error("The achievement document must be a PDF, DOC, or DOCX Cloudinary file.");
    }
  }

  if (
    section === "experience" &&
    item.organizationLogo &&
    (!isCloudinaryAsset(item.organizationLogo) ||
      item.organizationLogo.resourceType !== "image" ||
      !["image/jpeg", "image/png", "image/webp"].includes(
        item.organizationLogo.contentType,
      ))
  ) {
    throw new Error(
      "The company logo must be a JPG, PNG, or WEBP Cloudinary image.",
    );
  }
}

export function getHighlightPublishIssue(item) {
  try {
    validateContent("highlights", item, { requireHighlightImage: true });
    return null;
  } catch (validationError) {
    if (validationError instanceof Error) return validationError.message;
    throw validationError;
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
    "draftHighlights",
    "publicHighlights",
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
      status: "published",
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
    published: item.published === true,
    status: "draft",
    updatedAt: serverTimestamp(),
  });
}

export async function saveImportedDrafts(section, items) {
  if (
    !["lessons", "projects", "achievements", "experience", "highlights"].includes(
      section,
    )
  ) {
    throw new Error("This section does not support bulk imports.");
  }
  const batch = writeBatch(db);
  for (const item of items) {
    try {
      validateContent(section, item);
    } catch (validationError) {
      throw new Error(`"${item.title}": ${validationError.message}`);
    }
    batch.set(doc(db, collectionNames[section].drafts, item.id), {
      ...contentWithCloudinaryMedia(section, item),
      published: false,
      status: "draft",
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

export async function publishDraft(section, item) {
  const config = collectionNames[section];
  if (!config) throw new Error("Unknown portfolio content section.");
  validateContent(section, item, { requireHighlightImage: section === "highlights" });

  const content = contentWithCloudinaryMedia(section, item);
  const batch = writeBatch(db);
  batch.set(doc(db, config.drafts, item.id), {
    ...content,
    published: true,
    status: "published",
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(db, config.published, item.id), {
    ...content,
    published: true,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function publishHighlightDrafts(items) {
  const section = "highlights";
  const config = collectionNames[section];
  if (!items.length) return;

  for (const item of items) {
    const issue = getHighlightPublishIssue(item);
    if (issue) throw new Error(`"${item.title}": ${issue}`);
  }

  const batchSize = 250;
  for (let start = 0; start < items.length; start += batchSize) {
    const batch = writeBatch(db);
    for (const item of items.slice(start, start + batchSize)) {
      const content = contentWithCloudinaryMedia(section, item);
      batch.set(doc(db, config.drafts, item.id), {
        ...content,
        published: true,
        status: "published",
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, config.published, item.id), {
        ...content,
        published: true,
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }
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
      status: "unpublished",
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
