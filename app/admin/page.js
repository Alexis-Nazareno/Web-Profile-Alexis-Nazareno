"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import PortfolioImage from "../components/PortfolioImage";
import MonthPicker from "../components/MonthPicker";
import RichTextEditor from "../components/RichTextEditor";
import BulkContentImport from "./BulkContentImport";
import {
  deleteContent,
  publishCvStarterContent,
  publishDraft,
  saveDraft,
  saveImportedDrafts,
  unpublishDraft,
} from "../../lib/contentAdmin";
import { uploadCloudinaryFiles } from "../../lib/cloudinaryClient";
import { adminUid, auth, db, isFirebaseConfigured } from "../../lib/firebase";
import { MAX_MEMORY_IMAGES } from "../../lib/workMemories.mjs";
import { socialPlatforms } from "../../lib/socialLinks.mjs";
import {
  MAX_ABOUT_PHOTOS,
  defaultAbout,
  defaultContact,
  defaultHome,
} from "../../lib/portfolio";
import {
  formatExperienceDateRange,
  parseExperienceDateRange,
} from "../../lib/experienceDates";

const defaultSections = {
  home: { ...defaultHome, published: false },
  about: { ...defaultAbout, published: false },
  contact: { ...defaultContact, published: false },
};

const tabs = [
  ["home", "Home"],
  ["about", "About"],
  ["contact", "Contact"],
  ["experience", "Experience"],
  ["projects", "Projects"],
  ["achievements", "Training & Certificates"],
  ["memories", "Work Memories"],
  ["lessons", "Work Lessons"],
  ["feedback", "Feedback"],
];

const itemLabels = {
  projects: "Project",
  experience: "Experience",
  achievements: "Training / Certificate",
  memories: "Memory album",
  lessons: "Work lesson",
};

async function deleteFeedbackLikes(database, feedbackId) {
  const likesSnapshot = await getDocs(
    collection(database, "publicFeedback", feedbackId, "likes"),
  );

  for (let index = 0; index < likesSnapshot.docs.length; index += 450) {
    const batch = writeBatch(database);
    likesSnapshot.docs
      .slice(index, index + 450)
      .forEach((like) => batch.delete(like.ref));
    await batch.commit();
  }
}

const newItem = (section, order) => ({
  id: crypto.randomUUID(),
  title: "",
  description: "",
  ...(section === "projects"
    ? { liveUrl: "", sourceUrl: "", technologies: [] }
    : section === "experience"
      ? {
          startDate: "",
          endDate: "",
        isCurrent: true,
          organization: "",
          organizationLogo: null,
        }
      : { date: "", organization: "" }),
  images: [],
  published: false,
  status: "unsaved",
  order,
});

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sections, setSections] = useState(defaultSections);
  const [items, setItems] = useState({
    experience: [],
    projects: [],
    achievements: [],
    memories: [],
    lessons: [],
  });
  const [workContentErrors, setWorkContentErrors] = useState({});
  const [workContentLoading, setWorkContentLoading] = useState({
    memories: true,
    lessons: true,
  });
  const [feedbackSubmissions, setFeedbackSubmissions] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth) {
      setAuthReady(true);
      return;
    }

    return onAuthStateChanged(auth, (nextUser) => {
      setAuthReady(true);
      if (nextUser && adminUid && nextUser.uid !== adminUid) {
        signOut(auth).catch((authError) => {
          console.error("Could not sign out non-admin user:", authError);
          setError(authError.message);
        });
        setUser(null);
        setError("This account is not authorized to edit the portfolio.");
        return;
      }

      setUser(nextUser);
      if (nextUser) setError("");
    });
  }, []);

  useEffect(() => {
    if (!user || !db) return;

    setFeedbackLoading(true);
    const unsubscribeSections = onSnapshot(
      collection(db, "draftContent"),
      (snapshot) => {
        const nextSections = { ...defaultSections };
        snapshot.docs.forEach((item) => {
          if (Object.prototype.hasOwnProperty.call(nextSections, item.id)) {
            const data = item.data();
            nextSections[item.id] = {
              ...nextSections[item.id],
              ...data,
              photo:
                data.photo?.url && data.photo?.publicId ? data.photo : null,
              resume:
                data.resume?.url && data.resume?.publicId ? data.resume : null,
              photos: Array.isArray(data.photos)
                ? data.photos.filter(
                    (asset) =>
                      asset &&
                      typeof asset.url === "string" &&
                      typeof asset.publicId === "string",
                  )
                : [],
            };
          }
        });
        setSections(nextSections);
      },
      (snapshotError) => {
        console.error("Could not load content drafts:", snapshotError);
        setError(snapshotError.message);
      },
    );
    const unsubscribeProjects = onSnapshot(
      collection(db, "draftProjects"),
      (snapshot) => {
        setItems((current) => {
          const savedItems = snapshot.docs
            .map((item) => {
              const data = item.data();
              return {
                id: item.id,
                ...data,
                images: Array.isArray(data.images)
                  ? data.images.filter(
                      (asset) =>
                        asset &&
                        typeof asset.url === "string" &&
                        typeof asset.publicId === "string",
                    )
                  : [],
              };
            });
          const savedIds = new Set(savedItems.map((item) => item.id));
          const unsavedItems = current.projects.filter(
            (item) => item.status === "unsaved" && !savedIds.has(item.id),
          );
          return {
            ...current,
            projects: [...unsavedItems, ...savedItems].sort(
              (left, right) => (left.order || 0) - (right.order || 0),
            ),
          };
        });
      },
      (snapshotError) => {
        console.error("Could not load project drafts:", snapshotError);
        setError(snapshotError.message);
      },
    );
    const unsubscribeExperience = onSnapshot(
      collection(db, "draftExperience"),
      (snapshot) => {
        setItems((current) => ({
          ...current,
          experience: snapshot.docs
              .map((item) => {
                const data = item.data();
                const hasStructuredDates =
                  typeof data.startDate === "string" ||
                  typeof data.endDate === "string";
                const legacyDates = hasStructuredDates
                  ? null
                  : parseExperienceDateRange(data.date);

                return {
                  id: item.id,
                  ...data,
                  startDate: hasStructuredDates
                    ? data.startDate || ""
                    : legacyDates?.startDate || "",
                  endDate: hasStructuredDates
                    ? data.endDate || ""
                    : legacyDates?.endDate || "",
                  isCurrent:
                    typeof data.isCurrent === "boolean"
                      ? data.isCurrent
                      : !(hasStructuredDates
                          ? data.endDate
                          : legacyDates?.endDate),
                  datePrecision:
                    data.datePrecision || legacyDates?.datePrecision || "month",
                };
              })
            .sort((left, right) => (left.order || 0) - (right.order || 0)),
        }));
      },
      (snapshotError) => {
        console.error("Could not load experience drafts:", snapshotError);
        setError(snapshotError.message);
      },
    );
    const unsubscribeAchievements = onSnapshot(
      collection(db, "draftAchievements"),
      (snapshot) => {
        setItems((current) => {
          const savedItems = snapshot.docs
            .map((item) => {
              const data = item.data();
              return {
                id: item.id,
                ...data,
                images: Array.isArray(data.images)
                  ? data.images.filter(
                      (asset) =>
                        asset &&
                        typeof asset.url === "string" &&
                        typeof asset.publicId === "string",
                    )
                  : [],
              };
            });
          const savedIds = new Set(savedItems.map((item) => item.id));
          const unsavedItems = current.achievements.filter(
            (item) => item.status === "unsaved" && !savedIds.has(item.id),
          );
          return {
            ...current,
            achievements: [...unsavedItems, ...savedItems].sort(
              (left, right) => (left.order || 0) - (right.order || 0),
            ),
          };
        });
      },
      (snapshotError) => {
        console.error("Could not load achievement drafts:", snapshotError);
        setError(snapshotError.message);
      },
    );
    const unsubscribeWorkContent = [
      ["memories", "draftMemories"],
      ["lessons", "draftLessons"],
    ].map(([section, collectionName]) =>
      onSnapshot(
        collection(db, collectionName),
        (snapshot) => {
          setItems((current) => {
            const savedItems = snapshot.docs
              .map((item) => {
                const data = item.data();
                return {
                  id: item.id,
                  ...data,
                  images: Array.isArray(data.images)
                    ? data.images.filter(
                        (asset) =>
                          asset &&
                          typeof asset.url === "string" &&
                          typeof asset.publicId === "string",
                      )
                    : [],
                };
              });
            const savedIds = new Set(savedItems.map((item) => item.id));
            const unsavedItems = current[section].filter(
              (item) => item.status === "unsaved" && !savedIds.has(item.id),
            );
            return {
              ...current,
              [section]: [...unsavedItems, ...savedItems].sort(
                (left, right) => (left.order || 0) - (right.order || 0),
              ),
            };
          });
          setWorkContentErrors((current) => ({ ...current, [section]: "" }));
          setWorkContentLoading((current) => ({ ...current, [section]: false }));
        },
        (snapshotError) => {
          console.error(`Could not load ${section} drafts:`, snapshotError);
          setWorkContentErrors((current) => ({
            ...current,
            [section]:
              snapshotError.code === "permission-denied"
                ? "Access denied. Publish the updated Firestore rules before managing this section."
                : `Could not load this section: ${snapshotError.message}`,
          }));
          setWorkContentLoading((current) => ({ ...current, [section]: false }));
        },
      ),
    );
    const unsubscribeFeedback = onSnapshot(
      collection(db, "feedbackInbox"),
      (snapshot) => {
        setFeedbackSubmissions(
          snapshot.docs
            .map((item) => ({ id: item.id, ...item.data() }))
            .sort(
              (left, right) =>
                (right.submittedAt?.seconds || 0) -
                (left.submittedAt?.seconds || 0),
            ),
        );
        setFeedbackLoading(false);
      },
      (snapshotError) => {
        console.error("Could not load feedback submissions:", snapshotError);
        setFeedbackLoading(false);
        setError(snapshotError.message);
      },
    );

    return () => {
      unsubscribeSections();
      unsubscribeProjects();
      unsubscribeExperience();
      unsubscribeAchievements();
      unsubscribeWorkContent.forEach((unsubscribe) => unsubscribe());
      unsubscribeFeedback();
    };
  }, [user]);

  const runAction = async (action, successMessage, tone = "success") => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      setMessage(successMessage);
      setMessageTone(tone);
    } catch (actionError) {
      console.error("Portfolio admin action failed:", actionError);
      setError(actionError.message);
    } finally {
      setBusy(false);
    }
  };

  const updateSection = (section, key, value) => {
    setSections((current) => ({
      ...current,
      [section]: { ...current[section], [key]: value },
    }));
  };

  const updateAboutDetail = (index, key, value) => {
    const details = Array.isArray(sections.about.details)
      ? sections.about.details
      : [];
    updateSection(
      "about",
      "details",
      details.map((detail, detailIndex) =>
        detailIndex === index ? { ...detail, [key]: value } : detail,
      ),
    );
  };

  const addAboutDetail = () => {
    const details = Array.isArray(sections.about.details)
      ? sections.about.details
      : [];
    updateSection("about", "details", [...details, { label: "", value: "" }]);
  };

  const removeAboutDetail = (index) => {
    const details = Array.isArray(sections.about.details)
      ? sections.about.details
      : [];
    updateSection(
      "about",
      "details",
      details.filter((_, detailIndex) => detailIndex !== index),
    );
  };

  const updateItem = (section, id, key, value) => {
    setItems((current) => ({
      ...current,
      [section]: current[section].map((item) =>
        item.id === id ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const uploadFiles = async (
    event,
    section,
    itemId,
    field,
    targetImageIndex = null,
  ) => {
    const files = Array.from(event.currentTarget.files || []);
    event.currentTarget.value = "";
    if (!files.length) return;

    const isPdf = field === "resume";
    const allowedTypes = isPdf
      ? ["application/pdf"]
      : ["image/jpeg", "image/png", "image/webp"];
    if (files.some((file) => !allowedTypes.includes(file.type))) {
      setError(
        isPdf
          ? "Choose a PDF file for the CV."
          : "Choose JPG, PNG, or WEBP image files only.",
      );
      return;
    }
    if (files.some((file) => file.size > 5 * 1024 * 1024)) {
      setError("Each image or PDF must be 5 MB or smaller.");
      return;
    }

    const isHomeMedia = section === "home";
    const isAboutPhotos = section === "about" && field === "photos";
    const isExperienceLogo =
      section === "experience" && field === "organizationLogo";
    const item = isHomeMedia || isAboutPhotos
      ? null
      : items[section]?.find((candidate) => candidate.id === itemId);
    const currentImages = isAboutPhotos
      ? sections.about.photos || []
      : item?.images || [];
    const maximumImages =
      section === "memories"
        ? MAX_MEMORY_IMAGES
        : section === "about"
          ? MAX_ABOUT_PHOTOS
          : 4;
    if (
      (isHomeMedia ||
        isExperienceLogo ||
        Number.isInteger(targetImageIndex)) &&
      files.length !== 1
    ) {
      setError("Select exactly one file to replace.");
      return;
    }
    if (
      !isHomeMedia &&
      !isExperienceLogo &&
      !Number.isInteger(targetImageIndex) &&
      currentImages.length + files.length > maximumImages
    ) {
      setError(
        section === "memories"
          ? "Memory albums can have up to 20 images."
          : section === "about"
            ? `About can have up to ${MAX_ABOUT_PHOTOS} photos.`
            : "Projects and certificates can have up to 4 images.",
      );
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");
    try {
      const uploadedAssets = await uploadCloudinaryFiles(files);
      if (isHomeMedia) {
        updateSection("home", field, uploadedAssets[0]);
      } else if (isAboutPhotos) {
        const nextPhotos = [...currentImages];
        if (Number.isInteger(targetImageIndex)) {
          nextPhotos[targetImageIndex] = uploadedAssets[0];
        } else {
          nextPhotos.push(...uploadedAssets);
        }
        updateSection("about", "photos", nextPhotos);
      } else if (isExperienceLogo) {
        updateItem(section, itemId, field, uploadedAssets[0]);
      } else {
        if (Number.isInteger(targetImageIndex)) {
          const nextImages = [...currentImages];
          nextImages[targetImageIndex] = uploadedAssets[0];
          updateItem(section, itemId, "images", nextImages);
        } else {
          updateItem(section, itemId, "images", [
            ...currentImages,
            ...uploadedAssets,
          ]);
        }
      }
      setMessage(
        `${uploadedAssets.length} file${uploadedAssets.length === 1 ? "" : "s"} uploaded.`,
      );
      setMessageTone("success");
    } catch (uploadError) {
      if (uploadError.uploadedAssets?.length) {
        if (isAboutPhotos) {
          updateSection("about", "photos", [
            ...currentImages,
            ...uploadError.uploadedAssets,
          ]);
        } else if (field === "images") {
          updateItem(section, itemId, "images", [
            ...currentImages,
            ...uploadError.uploadedAssets,
          ]);
        }
      }
      console.error("Could not upload portfolio media:", uploadError);
      setError(uploadError.message);
    } finally {
      setUploading(false);
    }
  };

  const removeAsset = (section, item, asset, field) => {
    if (
      !window.confirm(
        "Remove this file from the portfolio? The Cloudinary file will remain in your account.",
      )
    ) {
      return;
    }

    setError("");
    setMessage("");
    if (section === "home") {
      updateSection("home", field, null);
    } else if (section === "about" && field === "photos") {
      updateSection(
        "about",
        "photos",
        (sections.about.photos || []).filter(
          (currentAsset) => currentAsset.publicId !== asset.publicId,
        ),
      );
    } else if (field === "organizationLogo") {
      updateItem(section, item.id, field, null);
    } else {
      updateItem(
        section,
        item.id,
        "images",
        item.images.filter(
          (currentAsset) => currentAsset.publicId !== asset.publicId,
        ),
      );
    }

    setMessage("File removed from the draft. Save or publish to update the site.");
    setMessageTone("draft");
  };

  const shiftImage = (section, item, index, direction) => {
    const images = [...(item.images || [])];
    const destination = index + direction;
    if (destination < 0 || destination >= images.length) return;
    [images[index], images[destination]] = [
      images[destination],
      images[index],
    ];
    updateItem(section, item.id, "images", images);
  };

  const shiftAboutPhoto = (index, direction) => {
    const photos = [...(sections.about.photos || [])];
    const destination = index + direction;
    if (destination < 0 || destination >= photos.length) return;
    [photos[index], photos[destination]] = [
      photos[destination],
      photos[index],
    ];
    updateSection("about", "photos", photos);
  };

  const saveSection = (section) => {
    const content = { id: section, ...sections[section] };
    if (section === "home" && !content.name.trim()) {
      setError("Please enter a name before saving.");
      return;
    }
    const sectionName = tabs.find(([id]) => id === section)?.[1];
    void runAction(
      () => saveDraft(section, content),
      `${sectionName} draft saved.${content.published ? " The published version remains live." : ""}`,
      "draft",
    );
  };

  const publishSection = (section) => {
    const content = { id: section, ...sections[section] };
    if (section === "home" && !content.name.trim()) {
      setError("Please enter a name before publishing.");
      return;
    }
    void runAction(
      () => publishDraft(section, content),
      `${tabs.find(([id]) => id === section)?.[1]} section published.`,
      "success",
    );
  };

  const unpublishSection = (section) => {
    const content = { id: section, ...sections[section] };
    void runAction(
      () => unpublishDraft(section, content),
      `${tabs.find(([id]) => id === section)?.[1]} section unpublished.`,
      "unpublished",
    );
  };

  const removeSection = (section) => {
    if (
      !window.confirm(
        `Delete the ${section} section and its media references? Cloudinary files will remain in your account.`,
      )
    ) {
      return;
    }

    const content = { id: section, ...sections[section] };
    void runAction(async () => {
      await deleteContent(section, content);
      setSections((current) => ({
        ...current,
        [section]: { ...defaultSections[section] },
      }));
    }, `${section} section deleted.`);
  };

  const addItem = (section) => {
    const nextOrder =
      items[section].reduce(
        (lowestOrder, item) => Math.min(lowestOrder, Number(item.order) || 0),
        0,
      ) - 1;
    const nextItem = newItem(section, nextOrder);
    setItems((current) => ({
      ...current,
      [section]: [nextItem, ...current[section]],
    }));
  };

  const importContentDrafts = async (section, entries) => {
    if (busy || uploading) throw new Error("Wait for the current action to finish before importing.");
    const names = {
      experience: "experiences",
      projects: "projects",
      achievements: "training and certificates",
      lessons: "work lessons",
    };
    const name = names[section];
    if (!name) throw new Error("This section does not support bulk imports.");
    if (!window.confirm(
      `Save ${entries.length} ${name} as drafts? They will not be published. Save any edits to existing entries first, as the list may refresh.`,
    )) return false;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      const collectionName = {
        experience: "draftExperience",
        projects: "draftProjects",
        achievements: "draftAchievements",
        lessons: "draftLessons",
      }[section];
      const snapshot = await getDocs(collection(db, collectionName));
      const existing = [
        ...items[section],
        ...snapshot.docs.map((entry) => entry.data()),
      ];
      const firstOrder = existing.reduce(
        (lowest, item) => Math.min(lowest, Number(item.order) || 0),
        0,
      ) - entries.length;
      const drafts = entries.map((entry, index) => {
        const draft = {
          ...newItem(section, firstOrder + index),
          ...entry,
          title: entry.title.trim(),
        };
        if (section !== "projects") {
          draft.organization = (entry.organization || "").trim();
        }
        if (section === "projects") {
          draft.liveUrl = (entry.liveUrl || "").trim();
          draft.sourceUrl = (entry.sourceUrl || "").trim();
          draft.technologies = (entry.technologies || "")
            .split(",").map((value) => value.trim()).filter(Boolean);
        }
        if (section === "experience") {
          const startDate = entry.startDate.trim();
          const endDate = entry.endDate.trim();
          draft.startDate = /^\d{4}$/.test(startDate)
            ? `${startDate}-01`
            : startDate;
          draft.endDate = /^\d{4}$/.test(endDate)
            ? `${endDate}-12`
            : endDate;
          draft.isCurrent = entry.isCurrent;
          draft.datePrecision = entry.datePrecision;
          draft.date = formatExperienceDateRange(draft);
        }
        return draft;
      });
      await saveImportedDrafts(section, drafts);
      setMessage(`${drafts.length} ${name} imported as drafts. Review them before publishing.`);
      setMessageTone("draft");
      return true;
    } finally {
      setBusy(false);
    }
  };

  const validateItem = (section, item) => {
    if (!item.title.trim()) {
      setError("Please enter a title before saving or publishing.");
      return false;
    }
    if (section === "memories" && !item.organization.trim()) {
      setError("Please enter a company for this memory album.");
      return false;
    }
    if (section === "experience") {
      const isCurrent = item.isCurrent ?? !item.endDate;
      if (item.endDate && !item.startDate) {
        setError("Choose a start date before entering an end date.");
        return false;
      }
      if (!isCurrent && !item.endDate) {
        setError("Choose an end date or mark this as your current role.");
        return false;
      }
      if (item.startDate && item.endDate && item.endDate < item.startDate) {
        setError("The end date must be the same as or later than the start date.");
        return false;
      }
      if (!item.startDate && !item.date) {
        setError("Choose a start date before saving this experience.");
        return false;
      }
    }
    return true;
  };

  const getItemForSave = (section, item) =>
    section === "experience" && item.startDate
      ? { ...item, date: formatExperienceDateRange(item) }
      : item;

  const saveItem = (section, item) => {
    if (!validateItem(section, item)) return;
    const content = getItemForSave(section, item);
    void runAction(
      () => saveDraft(section, content),
      `${itemLabels[section]} draft saved.${content.published ? " The published version remains live." : ""}`,
      "draft",
    );
  };

  const publishItem = (section, item) => {
    if (!validateItem(section, item)) return;
    const content = getItemForSave(section, item);
    void runAction(
      () => publishDraft(section, content),
      `${itemLabels[section]} published.`,
      "success",
    );
  };

  const unpublishItem = (section, item) =>
    void runAction(
      () => unpublishDraft(section, item),
      `${itemLabels[section]} unpublished.`,
      "unpublished",
    );

  const removeItem = (section, item) => {
    if (
      !window.confirm(
        section === "lessons"
          ? `Delete "${item.title}" from the portfolio?`
          : `Delete "${item.title}" from the portfolio? Its Cloudinary assets will remain in your account.`,
      )
    ) {
      return;
    }

    if (
      ["memories", "lessons", "projects", "achievements"].includes(section) &&
      item.status === "unsaved"
    ) {
      setItems((current) => ({
        ...current,
        [section]: current[section].filter((entry) => entry.id !== item.id),
      }));
      setError("");
      setMessage(`${itemLabels[section]} deleted.`);
      setMessageTone("success");
      return;
    }

    void runAction(
      () => deleteContent(section, item),
      `${itemLabels[section]} deleted.`,
    );
  };

  const publishFeedback = (item) =>
    void runAction(async () => {
      const batch = writeBatch(db);
      batch.set(doc(db, "publicFeedback", item.id), {
        name: item.name || "Anonymous",
        role: item.role || "",
        message: item.message,
        publishedAt: serverTimestamp(),
      });
      batch.update(doc(db, "feedbackInbox", item.id), {
        status: "published",
        publishedAt: serverTimestamp(),
      });
      await batch.commit();
    }, "Feedback published on the homepage.");

  const unpublishFeedback = (item) =>
    void runAction(async () => {
      const batch = writeBatch(db);
      batch.delete(doc(db, "publicFeedback", item.id));
      batch.update(doc(db, "feedbackInbox", item.id), {
        status: "unpublished",
        unpublishedAt: serverTimestamp(),
      });
      await batch.commit();
    }, "Feedback removed from the homepage.");

  const deleteFeedback = (item) => {
    if (!window.confirm(`Delete feedback from "${item.name || "Anonymous"}"?`)) {
      return;
    }

    void runAction(async () => {
      const publicFeedbackRef = doc(db, "publicFeedback", item.id);
      const publicFeedbackSnapshot = await getDoc(publicFeedbackRef);
      if (publicFeedbackSnapshot.exists()) {
        await updateDoc(publicFeedbackRef, { likesDisabled: true });
      }
      await deleteFeedbackLikes(db, item.id);

      const batch = writeBatch(db);
      batch.delete(publicFeedbackRef);
      batch.delete(doc(db, "feedbackInbox", item.id));
      await batch.commit();
    }, "Feedback deleted.");
  };

  const importCv = () => {
    if (
      !window.confirm(
        "Import and publish the CV content now? This only works when the CMS is empty and will not include the CV PDF or photos.",
      )
    ) {
      return;
    }

    void runAction(
      publishCvStarterContent,
      "CV content imported and published. You can edit it anytime from this dashboard.",
    );
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (credential.user.uid !== adminUid) {
        await signOut(auth);
        throw new Error("This account is not authorized to edit the portfolio.");
      }
    } catch (signInError) {
      console.error("Could not sign in to portfolio admin:", signInError);
      setError(signInError.message);
    } finally {
      setBusy(false);
      setPassword("");
    }
  };

  const handleSignOut = () =>
    void runAction(() => signOut(auth), "Signed out.");

  if (!isFirebaseConfigured) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="mb-4 text-3xl font-bold">Portfolio Admin</h1>
        <p>Firebase is not configured. Copy the values from firebase.env.example to .env.local.</p>
      </section>
    );
  }

  if (!adminUid) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="mb-4 text-3xl font-bold">Portfolio Admin</h1>
        <p>
          Set NEXT_PUBLIC_FIREBASE_ADMIN_UID to the admin user&apos;s UID from
          Firebase Authentication before signing in.
        </p>
      </section>
    );
  }

  if (!authReady) {
    return <p className="py-12 text-center">Checking admin session...</p>;
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-md px-5 py-12">
        <h1 className="mb-2 text-3xl font-bold">Portfolio Admin</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          Sign in with the admin account created in Firebase Authentication.
        </p>
        {error && (
          <AdminNotice tone="error" onDismiss={() => setError("")}>
            {error}
          </AdminNotice>
        )}
        <form onSubmit={handleSignIn} className="space-y-4">
          <label className="block">
            <span className="mb-1 block">Admin email</span>
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded border border-gray-300 bg-transparent p-3"
            />
          </label>
          <label className="block">
            <span className="mb-1 block">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded border border-gray-300 bg-transparent p-3"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-[#168e78] px-4 py-3 font-semibold text-white transition hover:bg-[#0f766e] disabled:opacity-60 dark:bg-[#4ed8b6] dark:text-[#09201e] dark:hover:bg-[#7ce9ce]"
          >
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    );
  }

  const section = activeTab;
  const sectionData = sections[section];

  return (
    <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Portfolio Admin</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Signed in as {user.email}
          </p>
        </div>
        <button
          type="button"
          onClick={importCv}
          disabled={busy || uploading}
          className="rounded-lg bg-[#168e78] px-4 py-2 font-semibold text-white transition hover:bg-[#0f766e] disabled:opacity-50 dark:bg-[#4ed8b6] dark:text-[#09201e] dark:hover:bg-[#7ce9ce]"
        >
          Import and publish CV
        </button>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={busy}
          className="rounded-lg border border-[#cbd9d5] bg-white/70 px-4 py-2 font-medium transition hover:border-[#21b995] dark:border-white/15 dark:bg-white/5 dark:hover:border-[#4ed8b6]"
        >
          Sign out
        </button>
      </div>

      {message && (
        <AdminNotice
          tone={messageTone}
          onDismiss={() => setMessage("")}
        >
          {message}
        </AdminNotice>
      )}
      {error && (
        <AdminNotice tone="error" onDismiss={() => setError("")}>
          {error}
        </AdminNotice>
      )}
      {uploading && (
        <AdminNotice tone="info">
          Uploading media to Cloudinary...
        </AdminNotice>
      )}
      {busy && (
        <AdminNotice tone="info">
          Saving changes...
        </AdminNotice>
      )}

      <div className="mb-8 flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setActiveTab(id);
              setError("");
              setMessage("");
            }}
            className={`border-b-2 px-4 py-3 font-medium transition-colors ${
              activeTab === id
                ? "border-[#168e78] text-[#168e78] dark:border-[#5be0bf] dark:text-[#5be0bf]"
                : "border-transparent text-[#5b6d70] hover:text-[#168e78] dark:text-white/70 dark:hover:text-[#5be0bf]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {section === "feedback" ? (
        <FeedbackManager
          items={feedbackSubmissions}
          loading={feedbackLoading}
          busy={busy}
          onPublish={publishFeedback}
          onUnpublish={unpublishFeedback}
          onDelete={deleteFeedback}
        />
      ) : sectionData ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">
              {tabs.find(([id]) => id === section)?.[1]} section
            </h2>
          </div>

          <div className="grid gap-4 rounded-2xl border border-[#dce7e4] bg-white/70 p-5 shadow-sm dark:border-white/10 dark:bg-[#102127]/70 sm:grid-cols-2">
            <div className="flex justify-end sm:col-span-2">
              <ContentStatusBadge item={sectionData} />
            </div>
            {section === "home" && (
              <>
                <TextField
                  label="Name"
                  value={sectionData.name}
                  required
                  onChange={(value) => updateSection(section, "name", value)}
                />
                <TextField
                  label="Headline"
                  value={sectionData.headline}
                  onChange={(value) => updateSection(section, "headline", value)}
                />
                <MediaField
                  label="Profile photo"
                  asset={sectionData.photo}
                  accept="image/jpeg,image/png,image/webp"
                  busy={busy || uploading}
                  onUpload={(event) =>
                    uploadFiles(event, "home", "home", "photo")
                  }
                  onRemove={() =>
                    sectionData.photo &&
                    removeAsset("home", sectionData, sectionData.photo, "photo")
                  }
                />
                <MediaField
                  label="CV PDF"
                  asset={sectionData.resume}
                  accept="application/pdf"
                  isPdf
                  busy={busy || uploading}
                  onUpload={(event) =>
                    uploadFiles(event, "home", "home", "resume")
                  }
                  onRemove={() =>
                    sectionData.resume &&
                    removeAsset("home", sectionData, sectionData.resume, "resume")
                  }
                />
              </>
            )}

            {section === "about" && (
              <>
                <TextField
                  label="About / biography"
                  multiline
                  value={sectionData.bio}
                  onChange={(value) => updateSection(section, "bio", value)}
                  className="sm:col-span-2"
                />
                <TextField
                  label="Position"
                  value={sectionData.position}
                  onChange={(value) => updateSection(section, "position", value)}
                />
                <TextField
                  label="Education"
                  value={sectionData.education}
                  onChange={(value) => updateSection(section, "education", value)}
                />
                <TextField
                  label="Location"
                  value={sectionData.location}
                  onChange={(value) => updateSection(section, "location", value)}
                />
                <div className="rounded-xl border border-[#dce7e4] p-4 dark:border-white/10 sm:col-span-2">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">More about you</h3>
                      <p className="mt-1 text-sm text-[#65777a] dark:text-white/60">
                        Add details like languages, interests, or work style. These show in My Perspective.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addAboutDetail}
                      className="rounded-lg border border-[#45b69a] px-3 py-2 text-sm font-semibold text-[#126d5b] transition hover:bg-[#e8f7f2] dark:border-[#327d70] dark:text-[#83e6ce] dark:hover:bg-[#123a34]"
                    >
                      Add detail
                    </button>
                  </div>
                  {(Array.isArray(sectionData.details)
                    ? sectionData.details
                    : []
                  ).map((detail, index) => (
                    <div
                      key={index}
                      className="mt-4 grid items-end gap-3 rounded-lg bg-[#f5f9f7] p-3 dark:bg-white/5 sm:grid-cols-[1fr_1.5fr_auto]"
                    >
                      <TextField
                        label="Label"
                        value={detail.label || ""}
                        onChange={(value) =>
                          updateAboutDetail(index, "label", value)
                        }
                      />
                      <TextField
                        label="Detail"
                        value={detail.value || ""}
                        onChange={(value) =>
                          updateAboutDetail(index, "value", value)
                        }
                      />
                      <button
                        type="button"
                        aria-label={`Remove detail ${index + 1}`}
                        onClick={() => removeAboutDetail(index)}
                        className="rounded-lg px-3 py-2 text-sm font-medium text-[#b42318] transition hover:bg-[#fff0f0] dark:text-[#ffaaa8] dark:hover:bg-[#3b1e20]"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <AboutPhotoField
                  images={Array.isArray(sectionData.photos)
                    ? sectionData.photos
                    : []}
                  maximumImages={MAX_ABOUT_PHOTOS}
                  busy={busy || uploading}
                  onUpload={(event, photoIndex) =>
                    uploadFiles(
                      event,
                      "about",
                      "about",
                      "photos",
                      photoIndex,
                    )
                  }
                  onRemove={(asset) =>
                    removeAsset("about", sectionData, asset, "photos")
                  }
                  onMove={shiftAboutPhoto}
                />
                <TextField
                  label="Skills (comma separated)"
                  value={(sectionData.skills || []).join(", ")}
                  onChange={(value) =>
                    updateSection(
                      section,
                      "skills",
                      value.split(",").map((skill) => skill.trim()).filter(Boolean),
                    )
                  }
                />
              </>
            )}

            {section === "contact" && (
              <>
                <TextField
                  label="Public email"
                  type="email"
                  value={sectionData.email}
                  onChange={(value) => updateSection(section, "email", value)}
                />
                <TextField
                  label="Location"
                  value={sectionData.location}
                  onChange={(value) => updateSection(section, "location", value)}
                />
                <TextField
                  label="Website URL"
                  type="url"
                  value={sectionData.website}
                  onChange={(value) => updateSection(section, "website", value)}
                />
                <div className="sm:col-span-2">
                  <p className="font-semibold">Social media links</p>
                  <p className="mt-1 text-sm text-[#65777a] dark:text-white/60">
                    Add complete profile URLs. Only filled links appear in the footer after publishing.
                  </p>
                </div>
                {socialPlatforms.map(({ field, label }) => (
                  <TextField
                    key={field}
                    label={`${label} URL`}
                    type="url"
                    value={sectionData[field]}
                    onChange={(value) => updateSection(section, field, value)}
                  />
                ))}
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy || uploading}
              onClick={() => saveSection(section)}
              className="rounded-lg border border-[#45b69a] bg-[#e8f7f2] px-4 py-2 font-semibold text-[#126d5b] transition hover:bg-[#d7f0e7] disabled:opacity-50 dark:border-[#327d70] dark:bg-[#123a34] dark:text-[#83e6ce] dark:hover:bg-[#18483f]"
            >
              Save draft
            </button>
            <button
              type="button"
              disabled={busy || uploading}
              onClick={() => publishSection(section)}
              className="rounded-lg bg-[#168e78] px-4 py-2 font-semibold text-white transition hover:bg-[#0f766e] disabled:opacity-50 dark:bg-[#4ed8b6] dark:text-[#09201e] dark:hover:bg-[#7ce9ce]"
            >
              {busy ? "Working..." : "Publish changes"}
            </button>
            {sectionData.published && (
              <button
                type="button"
                disabled={busy || uploading}
                onClick={() => unpublishSection(section)}
                className="rounded-lg border border-[#e4b54a] bg-[#fff7e6] px-4 py-2 font-semibold text-[#8a5a00] transition hover:bg-[#ffefcc] disabled:opacity-50 dark:border-[#8c6925] dark:bg-[#3b2e13] dark:text-[#f6d27e] dark:hover:bg-[#493717]"
              >
                Unpublish
              </button>
            )}
            <button
              type="button"
              disabled={busy || uploading}
              onClick={() => removeSection(section)}
              className="rounded-lg border border-[#ef9a9a] bg-[#fff0f0] px-4 py-2 font-semibold text-[#b42318] transition hover:bg-[#ffe0e0] disabled:opacity-50 dark:border-[#78383b] dark:bg-[#3b1e20] dark:text-[#ffaaa8] dark:hover:bg-[#4a2528]"
            >
              Delete section
            </button>
          </div>
        </div>
      ) : (section === "memories" || section === "lessons") &&
        workContentErrors[section] ? (
        <AdminNotice tone="error">{workContentErrors[section]}</AdminNotice>
      ) : (section === "memories" || section === "lessons") &&
        workContentLoading[section] ? (
        <p>Loading {section}...</p>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold">
              {section === "projects"
                ? "Projects"
                : section === "experience"
                  ? "Professional Experience"
                  : section === "memories"
                    ? "Work Memories"
                    : section === "lessons"
                      ? "Work Lessons"
                      : "Training & Certificates"}
            </h2>
            <button
              type="button"
              onClick={() => addItem(section)}
              className="rounded-lg bg-[#168e78] px-4 py-2 font-semibold text-white transition hover:bg-[#0f766e] dark:bg-[#4ed8b6] dark:text-[#09201e] dark:hover:bg-[#7ce9ce]"
            >
              Add{" "}
              {section === "projects"
                ? "project"
                : section === "experience"
                  ? "experience"
                  : section === "memories"
                    ? "memory album"
                    : section === "lessons"
                      ? "lesson"
                      : "certificate"}
            </button>
          </div>
          {["experience", "projects", "achievements", "lessons"].includes(
            section,
          ) && (
            <BulkContentImport
              key={section}
              section={section}
              busy={busy || uploading}
              onSave={importContentDrafts}
            />
          )}
          {items[section].length === 0 && (
            <p className="text-gray-600 dark:text-gray-300">
              No {section} yet. Add one to get started.
            </p>
          )}
          <div className="space-y-6">
            {items[section].map((item) => (
              <ItemEditor
                key={item.id}
                section={section}
                item={item}
                busy={busy || uploading}
                onChange={(key, value) => updateItem(section, item.id, key, value)}
                onUpload={(event, field, imageIndex) =>
                  uploadFiles(event, section, item.id, field, imageIndex)
                }
                onReplaceImage={(event, imageIndex) =>
                  uploadFiles(event, section, item.id, "images", imageIndex)
                }
                onRemoveImage={(asset) => removeAsset(section, item, asset, "images")}
                onRemoveLogo={(asset) =>
                  removeAsset(section, item, asset, "organizationLogo")
                }
                onMoveImage={(index, direction) =>
                  shiftImage(section, item, index, direction)
                }
                onSave={() => saveItem(section, item)}
                onPublish={() => publishItem(section, item)}
                onUnpublish={() => unpublishItem(section, item)}
                onDelete={() => removeItem(section, item)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function FeedbackManager({
  items,
  loading,
  busy,
  onPublish,
  onUnpublish,
  onDelete,
}) {
  const [filter, setFilter] = useState("pending");
  const pendingCount = items.filter(
    (item) => !["published", "unpublished"].includes(item.status),
  ).length;
  const publishedCount = items.filter(
    (item) => item.status === "published",
  ).length;
  const unpublishedCount = items.filter(
    (item) => item.status === "unpublished",
  ).length;
  const counts = {
    all: items.length,
    pending: pendingCount,
    published: publishedCount,
    unpublished: unpublishedCount,
  };
  const filters = [
    ["pending", "Pending"],
    ["published", "Published"],
    ["unpublished", "Unpublished"],
    ["all", "All"],
  ];
  const visibleItems =
    filter === "all"
      ? items
      : items.filter((item) =>
          filter === "pending"
            ? !["published", "unpublished"].includes(item.status)
            : item.status === filter,
        );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">Feedback inbox</h2>
        <p className="mt-1 text-sm text-[#667779] dark:text-white/55">
          Review submissions here. Only feedback you publish is shown on the homepage.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              filter === id
                ? "border-[#168e78] bg-[#eaf8f2] text-[#11654f] dark:border-[#5be0bf] dark:bg-[#123a31] dark:text-[#a7eed9]"
                : "border-[#dce7e4] text-[#5b6d70] hover:border-[#9bdcc8] dark:border-white/10 dark:text-white/65 dark:hover:border-[#2d705f]"
            }`}
          >
            {label} <span className="ml-1 text-xs opacity-70">{counts[id]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div
          aria-label="Loading feedback submissions"
          className="grid gap-4"
        >
          {[0, 1].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-2xl border border-[#dce7e4] bg-white/70 dark:border-white/10 dark:bg-white/5"
            />
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#cbd9d5] px-5 py-8 text-center text-sm text-[#667779] dark:border-white/15 dark:text-white/55">
          {items.length === 0
            ? "No feedback submissions yet."
            : `No ${filter} feedback.`}
        </p>
      ) : (
        <div className="space-y-4">
          {visibleItems.map((item) => {
            const published = item.status === "published";
            const unpublished = item.status === "unpublished";
            const statusClass = published
              ? "bg-[#e6f7ef] text-[#14734f] dark:bg-[#153c30] dark:text-[#8de1ba]"
              : unpublished
                ? "bg-[#e8f6f7] text-[#176b76] dark:bg-[#12383d] dark:text-[#89dce3]"
                : "bg-[#fff4df] text-[#8a5a00] dark:bg-[#3b3018] dark:text-[#f6d27e]";
            const submittedDate = item.submittedAt?.toDate?.();
            const dateLabel = submittedDate
              ? new Intl.DateTimeFormat("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(submittedDate)
              : "Submission date unavailable";

            return (
              <article
                key={item.id}
                className="rounded-2xl border border-[#dce7e4] bg-white/70 p-5 shadow-sm dark:border-white/10 dark:bg-[#102127]/70"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-[#183037] dark:text-white">
                      {item.name || "Anonymous"}
                    </h3>
                    {item.role && (
                      <p className="mt-0.5 text-sm text-[#68797c] dark:text-white/55">
                        {item.role}
                      </p>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}
                  >
                    {published
                      ? "Published"
                      : unpublished
                        ? "Unpublished"
                        : "Pending review"}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#52676a] dark:text-white/70">
                  {item.message}
                </p>
                <p className="mt-3 text-xs text-[#81908e] dark:text-white/40">
                  {dateLabel}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-[#e5eeea] pt-4 dark:border-white/10">
                  {published ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onUnpublish(item)}
                      className="rounded-lg border border-[#e4b54a] bg-[#fff7e6] px-3 py-2 text-sm font-semibold text-[#8a5a00] transition hover:bg-[#ffefcc] disabled:opacity-50 dark:border-[#8c6925] dark:bg-[#3b2e13] dark:text-[#f6d27e] dark:hover:bg-[#493717]"
                    >
                      Unpublish
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onPublish(item)}
                      className="rounded-lg bg-[#168e78] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0f766e] disabled:opacity-50 dark:bg-[#4ed8b6] dark:text-[#09201e] dark:hover:bg-[#7ce9ce]"
                    >
                      Publish on homepage
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onDelete(item)}
                    className="rounded-lg border border-[#ef9a9a] bg-[#fff0f0] px-3 py-2 text-sm font-semibold text-[#b42318] transition hover:bg-[#ffe0e0] disabled:opacity-50 dark:border-[#78383b] dark:bg-[#3b1e20] dark:text-[#ffaaa8] dark:hover:bg-[#4a2528]"
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AdminNotice({ tone = "info", children, onDismiss }) {
  const styles = {
    success:
      "border-[#9bdcc8] bg-[#eaf8f2] text-[#11654f] dark:border-[#2d705f] dark:bg-[#123a31] dark:text-[#a7eed9]",
    draft:
      "border-[#9fd4de] bg-[#edf8fa] text-[#17687a] dark:border-[#28616d] dark:bg-[#12343b] dark:text-[#9de3ec]",
    unpublished:
      "border-[#e8ca85] bg-[#fff8e8] text-[#805a0c] dark:border-[#80652e] dark:bg-[#3b3018] dark:text-[#f6dc9a]",
    info:
      "border-[#9bdcc8] bg-[#eaf8f2] text-[#11654f] dark:border-[#2d705f] dark:bg-[#123a31] dark:text-[#a7eed9]",
    error:
      "border-[#efb2ad] bg-[#fff2f0] text-[#9f3026] dark:border-[#783c39] dark:bg-[#3a2020] dark:text-[#ffb9b2]",
  };
  const isError = tone === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={`mb-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-sm ${styles[tone] || styles.info}`}
    >
      <span
        aria-hidden="true"
        className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-current"
      />
      <p className="min-w-0 flex-1 font-medium">{children}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="rounded px-1 text-lg leading-4 opacity-70 transition hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"
        >
          &times;
        </button>
      )}
    </div>
  );
}

function ContentStatusBadge({ item }) {
  const status =
    item.status === "draft"
      ? item.published
        ? "draftPublished"
        : "draft"
      : item.published
        ? "published"
        : ["unpublished", "unsaved"].includes(item.status)
          ? item.status
          : "unpublished";
  const statuses = {
    published: {
      label: "Published",
      className:
        "bg-[#e6f7ef] text-[#14734f] dark:bg-[#153c30] dark:text-[#8de1ba]",
    },
    draft: {
      label: "Draft saved",
      className:
        "bg-[#e8f6f7] text-[#176b76] dark:bg-[#12383d] dark:text-[#89dce3]",
    },
    draftPublished: {
      label: "Draft saved · live published",
      className:
        "bg-[#e8f6f7] text-[#176b76] dark:bg-[#12383d] dark:text-[#89dce3]",
    },
    unpublished: {
      label: "Unpublished",
      className:
        "bg-[#fff4df] text-[#8a5a00] dark:bg-[#3b3018] dark:text-[#f6d27e]",
    },
    unsaved: {
      label: "Unsaved draft",
      className:
        "bg-[#eef2f1] text-[#596b67] dark:bg-white/10 dark:text-white/65",
    },
  };
  const currentStatus = statuses[status];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${currentStatus.className}`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {currentStatus.label}
    </span>
  );
}

function TextField({
  label,
  value = "",
  onChange,
  multiline = false,
  type = "text",
  required = false,
  className = "",
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block">{label}</span>
      {multiline ? (
        <textarea
          rows={5}
          required={required}
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-lg border border-[#cbd9d5] bg-white px-3 py-2.5 text-[#122126] outline-none transition focus:border-[#22a98a] focus:ring-2 focus:ring-[#22a98a]/20 dark:border-white/15 dark:bg-[#0b1c22] dark:text-white dark:focus:border-[#5be0bf] dark:focus:ring-[#5be0bf]/20"
        />
      ) : (
        <input
          type={type}
          required={required}
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-lg border border-[#cbd9d5] bg-white px-3 py-2.5 text-[#122126] outline-none transition focus:border-[#22a98a] focus:ring-2 focus:ring-[#22a98a]/20 dark:border-white/15 dark:bg-[#0b1c22] dark:text-white dark:focus:border-[#5be0bf] dark:focus:ring-[#5be0bf]/20"
        />
      )}
    </label>
  );
}

function MediaField({
  label,
  asset,
  accept,
  objectFit = "cover",
  transparent = false,
  isPdf = false,
  busy,
  onUpload,
  onRemove,
}) {
  return (
    <div className="flex h-full flex-col">
      <span className="mb-2 block font-medium">{label}</span>
      <div className="flex min-h-[7rem] flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dce7e4] bg-[#f7fbfa] p-3 dark:border-white/10 dark:bg-[#0b1c22]/70">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {asset?.url && !isPdf && (
            <>
              <PortfolioImage
                url={asset.url}
                alt={label}
                objectFit={objectFit}
                transparent={transparent}
                className={`h-20 w-20 shrink-0 rounded-lg ${transparent ? "" : "ring-1 ring-[#cbd9d5] dark:ring-white/15"}`}
              />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-[#667779] dark:text-white/55">
                  File name
                </p>
                <p
                  title={asset.name || "Profile photo"}
                  className="break-all text-sm font-medium text-[#122126] dark:text-white"
                >
                  {asset.name || "Profile photo"}
                </p>
              </div>
            </>
          )}
          {asset?.url && isPdf && (
            <a
              href={asset.url}
              target="_blank"
              rel="noreferrer"
              title={`Preview ${asset.name || "CV PDF"}`}
              className="flex min-w-0 items-center gap-3 text-sm font-medium text-[#168e78] transition hover:text-[#0f766e] dark:text-[#5be0bf] dark:hover:text-[#a3f3df]"
            >
              <span
                aria-hidden="true"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#e8f7f2] text-xs font-bold tracking-wide text-[#126d5b] dark:bg-[#123a34] dark:text-[#83e6ce]"
              >
                PDF
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-medium uppercase tracking-wide text-[#667779] dark:text-white/55">
                  File name · click to preview
                </span>
                <span className="block break-all underline">
                  {asset.name || "CV PDF"}
                </span>
              </span>
            </a>
          )}
          {!asset?.url && (
            <p className="text-sm text-[#667779] dark:text-white/60">
              No file uploaded yet.
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <label className="inline-flex cursor-pointer items-center rounded-lg border border-[#45b69a] bg-[#e8f7f2] px-4 py-2 font-medium text-[#126d5b] transition hover:bg-[#d7f0e7] focus-within:ring-2 focus-within:ring-[#22a98a]/30 dark:border-[#327d70] dark:bg-[#123a34] dark:text-[#83e6ce] dark:hover:bg-[#18483f] dark:focus-within:ring-[#5be0bf]/30">
            {asset ? "Replace" : "Upload"}
            <input
              type="file"
              accept={accept}
              className="sr-only"
              disabled={busy}
              onChange={onUpload}
            />
          </label>
          {asset && (
            <button
              type="button"
              disabled={busy}
              onClick={onRemove}
              className="inline-flex items-center rounded-lg border border-[#ef9a9a] bg-[#fff0f0] px-3 py-2 text-sm font-medium text-[#b42318] transition hover:bg-[#ffe0e0] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b42318] dark:border-[#78383b] dark:bg-[#3b1e20] dark:text-[#ffaaa8] dark:hover:bg-[#4a2528] dark:focus-visible:outline-[#ffaaa8]"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      <p className="mt-2 min-h-10 text-sm leading-5 text-gray-500 dark:text-gray-400">
        Removing or replacing only updates the portfolio; delete old files
        separately in Cloudinary Media Library.
      </p>
    </div>
  );
}

function AboutPhotoField({
  images,
  maximumImages,
  busy,
  onUpload,
  onRemove,
  onMove,
}) {
  const atLimit = images.length >= maximumImages;

  return (
    <div className="rounded-xl border border-[#dce7e4] p-4 dark:border-white/10 sm:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">About photos</h3>
          <p className="mt-1 text-sm text-[#65777a] dark:text-white/60">
            Add up to {maximumImages} photos of yourself to your About page.
            JPG, PNG, or WEBP; 5 MB max each. Photos appear in this order; use
            Earlier or Later to rearrange them.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center rounded-lg border border-[#45b69a] bg-[#e8f7f2] px-4 py-2 text-sm font-semibold text-[#126d5b] transition hover:bg-[#d7f0e7] focus-within:ring-2 focus-within:ring-[#22a98a]/30 dark:border-[#327d70] dark:bg-[#123a34] dark:text-[#83e6ce] dark:hover:bg-[#18483f]">
          {atLimit ? "Photo limit reached" : "Add photos"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            disabled={busy || atLimit}
            onChange={(event) => onUpload(event, null)}
          />
        </label>
      </div>
      {images.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((image, index) => (
            <div
              key={image.publicId}
              className="rounded-xl border border-[#dce7e4] bg-[#f7fbfa] p-2 dark:border-white/10 dark:bg-[#0b1c22]/70"
            >
              <PortfolioImage
                url={image.url}
                alt={`Graduation photo ${index + 1}`}
                className="h-28 w-full rounded-lg"
              />
              <p
                className="mt-2 truncate text-xs font-medium"
                title={image.name || `Graduation photo ${index + 1}`}
              >
                {image.name || `Graduation photo ${index + 1}`}
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  disabled={busy || index === 0}
                  onClick={() => onMove(index, -1)}
                  aria-label={`Move photo ${index + 1} earlier`}
                  className="text-[#168e78] transition hover:text-[#0f766e] disabled:opacity-40 dark:text-[#5be0bf] dark:hover:text-[#a3f3df]"
                >
                  Earlier
                </button>
                <button
                  type="button"
                  disabled={busy || index === images.length - 1}
                  onClick={() => onMove(index, 1)}
                  aria-label={`Move photo ${index + 1} later`}
                  className="text-[#168e78] transition hover:text-[#0f766e] disabled:opacity-40 dark:text-[#5be0bf] dark:hover:text-[#a3f3df]"
                >
                  Later
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 border-t border-[#dce7e4] pt-2 dark:border-white/10">
                <label className="cursor-pointer text-xs font-medium text-[#168e78] transition hover:text-[#0f766e] dark:text-[#5be0bf] dark:hover:text-[#a3f3df]">
                  Replace
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={busy}
                    onChange={(event) => onUpload(event, index)}
                  />
                </label>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onRemove(image)}
                  className="text-xs font-medium text-red-600 transition hover:text-red-700 disabled:opacity-50 dark:text-[#ffaaa8] dark:hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed border-[#cbd9d5] px-4 py-5 text-center text-sm text-[#65777a] dark:border-white/15 dark:text-white/50">
          No photos added yet. Your About page stays unchanged until you add and
          publish photos.
        </p>
      )}
    </div>
  );
}

function ItemEditor({
  section,
  item,
  busy,
  onChange,
  onUpload,
  onReplaceImage,
  onRemoveImage,
  onRemoveLogo,
  onMoveImage,
  onSave,
  onPublish,
  onUnpublish,
  onDelete,
}) {
  const isProject = section === "projects";
  const isExperience = section === "experience";
  const isMemory = section === "memories";
  const isLesson = section === "lessons";
  const isCurrentExperience = item.isCurrent ?? !item.endDate;
  const images = item.images || [];
  const maximumImages = isMemory ? MAX_MEMORY_IMAGES : 4;
  const itemType = isProject
    ? "project"
    : isExperience
      ? "experience"
      : isMemory
        ? "memory album"
        : isLesson
          ? "lesson"
          : "certificate";

  return (
    <article className="space-y-4 rounded-2xl border border-[#dce7e4] bg-white/70 p-5 shadow-sm dark:border-white/10 dark:bg-[#102127]/70">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">
          {item.title || `New ${itemType}`}
        </h3>
        <ContentStatusBadge item={item} />
      </div>
      <TextField
        label={isExperience ? "Role" : "Title"}
        required
        value={item.title}
        onChange={(value) => onChange("title", value)}
      />
      <RichTextEditor
        label="Description"
        value={item.description}
        onChange={(value) => onChange("description", value)}
      />
      {isProject ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Live project URL"
              type="url"
              value={item.liveUrl}
              onChange={(value) => onChange("liveUrl", value)}
            />
            <TextField
              label="Source code URL"
              type="url"
              value={item.sourceUrl}
              onChange={(value) => onChange("sourceUrl", value)}
            />
          </div>
          <TextField
            label="Technologies (comma separated)"
            value={(item.technologies || []).join(", ")}
            onChange={(value) =>
              onChange(
                "technologies",
                value.split(",").map((technology) => technology.trim()).filter(Boolean),
              )
            }
          />
        </>
      ) : isExperience ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <MonthPicker
            label="Start date"
            required
            value={item.startDate}
            onChange={(value) => {
              onChange("datePrecision", "month");
              onChange("startDate", value);
            }}
          />
          {isCurrentExperience ? (
            <div>
              <span className="mb-1 block">End date</span>
              <p className="rounded-lg border border-[#cbd9d5] bg-[#f2faf7] px-3 py-2.5 font-medium text-[#126d5b] dark:border-white/15 dark:bg-[#0b1c22] dark:text-[#83e6ce]">
                Present
              </p>
            </div>
          ) : (
            <MonthPicker
              label="End date"
              required
              value={item.endDate}
              onChange={(value) => {
                onChange("datePrecision", "month");
                onChange("endDate", value);
              }}
            />
          )}
          <label className="flex items-center gap-2 text-sm text-[#526e6b] dark:text-white/70 sm:col-span-2">
            <input
              type="checkbox"
              checked={isCurrentExperience}
              disabled={busy}
              onChange={(event) => {
                const isCurrent = event.target.checked;
                onChange("isCurrent", isCurrent);
                if (isCurrent) onChange("endDate", "");
              }}
              className="h-4 w-4 accent-[#168e78]"
            />
            I currently work here
          </label>
          <TextField
            label="Organization"
            value={item.organization}
            onChange={(value) => onChange("organization", value)}
            className="sm:col-span-2"
          />
          <p className="text-sm leading-6 text-[#667779] dark:text-white/60 sm:col-span-2">
            Select “I currently work here” to show Present as the end date.
            Multiple experiences can be current at the same time.
          </p>
          {item.date && !item.startDate && (
            <p className="text-sm leading-6 text-[#805a0c] dark:text-[#f6dc9a] sm:col-span-2">
              Existing period: {item.date}. Select a start date to replace it
              with the new date fields.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {!isLesson && (
            <TextField
              label={section === "achievements" ? "Date / year (e.g. May 2025)" : "Date / year"}
              value={item.date}
              onChange={(value) => onChange("date", value)}
            />
          )}
          <TextField
            label={isMemory ? "Company" : "Organization"}
            required={isMemory}
            value={item.organization}
            onChange={(value) => onChange("organization", value)}
          />
        </div>
      )}

      {isExperience && (
        <MediaField
          label="Company logo (JPG, PNG, or WEBP; 5 MB max)"
          asset={item.organizationLogo}
          accept="image/jpeg,image/png,image/webp"
          objectFit="contain"
          transparent
          busy={busy}
          onUpload={(event) => onUpload(event, "organizationLogo", null)}
          onRemove={() =>
            item.organizationLogo && onRemoveLogo(item.organizationLogo)
          }
        />
      )}

      {!isExperience && !isLesson && (
        <div>
          <span className="mb-2 block">
            Images (up to {maximumImages}; JPG, PNG, or WEBP; 5 MB max each)
          </span>
          <label className="inline-flex cursor-pointer rounded-lg border border-[#45b69a] bg-[#e8f7f2] px-4 py-2 font-medium text-[#126d5b] transition hover:bg-[#d7f0e7] dark:border-[#327d70] dark:bg-[#123a34] dark:text-[#83e6ce] dark:hover:bg-[#18483f]">
            {images.length >= maximumImages ? "Image limit reached" : "Add images"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              disabled={busy || images.length >= maximumImages}
              onChange={(event) => onUpload(event, "images", null)}
            />
          </label>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((image, index) => (
              <div key={image.publicId} className="space-y-2 rounded-lg border border-[#dce7e4] p-2 dark:border-white/10">
                <PortfolioImage
                  url={image.url}
                  alt={`${item.title || itemType} image ${index + 1}`}
                  className="h-28 w-full rounded"
                />
                <p className="truncate text-xs">{image.name}</p>
                <div className="flex justify-between gap-2 text-xs">
                  <button
                    type="button"
                    disabled={busy || index === 0}
                    onClick={() => onMoveImage(index, -1)}
                    aria-label={`Move ${image.name || `image ${index + 1}`} earlier`}
                    className="text-[#168e78] transition hover:text-[#0f766e] dark:text-[#5be0bf] dark:hover:text-[#a3f3df]"
                  >
                    Earlier
                  </button>
                  <button
                    type="button"
                    disabled={busy || index === images.length - 1}
                    onClick={() => onMoveImage(index, 1)}
                    aria-label={`Move ${image.name || `image ${index + 1}`} later`}
                    className="text-[#168e78] transition hover:text-[#0f766e] dark:text-[#5be0bf] dark:hover:text-[#a3f3df]"
                  >
                    Later
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onRemoveImage(image)}
                    className="text-red-600"
                  >
                    Remove
                  </button>
                </div>
                <label className="inline-flex cursor-pointer rounded-md border border-[#45b69a] bg-[#e8f7f2] px-2 py-1 text-xs font-medium text-[#126d5b] transition hover:bg-[#d7f0e7] dark:border-[#327d70] dark:bg-[#123a34] dark:text-[#83e6ce] dark:hover:bg-[#18483f]">
                  Replace
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={busy}
                    onChange={(event) => onReplaceImage(event, index)}
                  />
                </label>
              </div>
            ))}
          </div>
          {isMemory && (
            <p className="mt-3 text-sm text-[#667779] dark:text-white/60">
              Removed or replaced files remain in Cloudinary until deleted there.
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-[#dce7e4] pt-4 dark:border-white/10">
        <button
          type="button"
          disabled={busy}
          onClick={onSave}
          className="rounded-lg border border-[#45b69a] bg-[#e8f7f2] px-3 py-2 text-sm font-semibold text-[#126d5b] transition hover:bg-[#d7f0e7] disabled:opacity-50 dark:border-[#327d70] dark:bg-[#123a34] dark:text-[#83e6ce] dark:hover:bg-[#18483f]"
        >
          Save draft
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onPublish}
          className="rounded-lg bg-[#168e78] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0f766e] disabled:opacity-50 dark:bg-[#4ed8b6] dark:text-[#09201e] dark:hover:bg-[#7ce9ce]"
        >
          Publish
        </button>
        {item.published && (
          <button
            type="button"
            disabled={busy}
            onClick={onUnpublish}
            className="rounded-lg border border-[#e4b54a] bg-[#fff7e6] px-3 py-2 text-sm font-semibold text-[#8a5a00] transition hover:bg-[#ffefcc] disabled:opacity-50 dark:border-[#8c6925] dark:bg-[#3b2e13] dark:text-[#f6d27e] dark:hover:bg-[#493717]"
          >
            Unpublish
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className="ml-auto rounded-lg border border-[#ef9a9a] bg-[#fff0f0] px-3 py-2 text-sm font-semibold text-[#b42318] transition hover:bg-[#ffe0e0] disabled:opacity-50 dark:border-[#78383b] dark:bg-[#3b1e20] dark:text-[#ffaaa8] dark:hover:bg-[#4a2528]"
        >
          Delete
        </button>
      </div>
    </article>
  );
}
