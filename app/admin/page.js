"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import PortfolioImage from "../components/PortfolioImage";
import {
  deleteContent,
  publishCvStarterContent,
  publishDraft,
  saveDraft,
  unpublishDraft,
} from "../../lib/contentAdmin";
import { uploadCloudinaryFiles } from "../../lib/cloudinaryClient";
import { adminUid, auth, db, isFirebaseConfigured } from "../../lib/firebase";
import {
  defaultAbout,
  defaultContact,
  defaultHome,
} from "../../lib/portfolio";

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
];

const itemLabels = {
  projects: "Project",
  experience: "Experience",
  achievements: "Training / Certificate",
};

const newItem = (section, order) => ({
  id: crypto.randomUUID(),
  title: "",
  description: "",
  ...(section === "projects"
    ? { liveUrl: "", sourceUrl: "", technologies: [] }
    : { date: "", organization: "" }),
  images: [],
  published: false,
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
  });
  const [activeTab, setActiveTab] = useState("home");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
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
        setItems((current) => ({
          ...current,
          projects: snapshot.docs
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
            })
            .sort((left, right) => (left.order || 0) - (right.order || 0)),
        }));
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
            .map((item) => ({ id: item.id, ...item.data() }))
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
        setItems((current) => ({
          ...current,
          achievements: snapshot.docs
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
            })
            .sort((left, right) => (left.order || 0) - (right.order || 0)),
        }));
      },
      (snapshotError) => {
        console.error("Could not load achievement drafts:", snapshotError);
        setError(snapshotError.message);
      },
    );

    return () => {
      unsubscribeSections();
      unsubscribeProjects();
      unsubscribeExperience();
      unsubscribeAchievements();
    };
  }, [user]);

  const runAction = async (action, successMessage) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      setMessage(successMessage);
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
    const item = isHomeMedia
      ? null
      : items[section].find((candidate) => candidate.id === itemId);
    const currentImages = item?.images || [];
    if ((isHomeMedia || Number.isInteger(targetImageIndex)) && files.length !== 1) {
      setError("Select exactly one file to replace.");
      return;
    }
    if (
      !isHomeMedia &&
      !Number.isInteger(targetImageIndex) &&
      currentImages.length + files.length > 4
    ) {
      setError("Projects and certificates can have up to 4 images.");
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");
    try {
      const uploadedAssets = await uploadCloudinaryFiles(files);
      if (isHomeMedia) {
        updateSection("home", field, uploadedAssets[0]);
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
    } catch (uploadError) {
      if (uploadError.uploadedAssets?.length && field === "images") {
        updateItem(section, itemId, "images", [
          ...currentImages,
          ...uploadError.uploadedAssets,
        ]);
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
        "Remove this file from the portfolio? The Cloudinary asset remains in your account because unsigned uploads cannot delete remote files.",
      )
    ) {
      return;
    }

    setError("");
    setMessage("");
    if (section === "home") {
      updateSection("home", field, null);
    } else {
      updateItem(
        section,
        item.id,
        "images",
        item.images.filter((currentAsset) => currentAsset.publicId !== asset.publicId),
      );
    }
    setMessage("File removed from the draft. Save or publish to update the site.");
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

  const saveSection = (section) => {
    const content = { id: section, ...sections[section] };
    if (section === "home" && !content.name.trim()) {
      setError("Please enter a name before saving.");
      return;
    }
    void runAction(
      () => saveDraft(section, content),
      `${tabs.find(([id]) => id === section)?.[1]} draft saved.`,
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
    );
  };

  const unpublishSection = (section) => {
    const content = { id: section, ...sections[section] };
    void runAction(
      () => unpublishDraft(section, content),
      `${tabs.find(([id]) => id === section)?.[1]} section unpublished.`,
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
    const nextItem = newItem(section, items[section].length);
    setItems((current) => ({
      ...current,
      [section]: [...current[section], nextItem],
    }));
  };

  const saveItem = (section, item) => {
    if (!item.title.trim()) {
      setError("Please enter a title before saving.");
      return;
    }
    void runAction(
      () => saveDraft(section, item),
      `${itemLabels[section]} draft saved.`,
    );
  };

  const publishItem = (section, item) => {
    if (!item.title.trim()) {
      setError("Please enter a title before publishing.");
      return;
    }
    void runAction(
      () => publishDraft(section, item),
      `${itemLabels[section]} published.`,
    );
  };

  const unpublishItem = (section, item) =>
    void runAction(
      () => unpublishDraft(section, item),
      `${itemLabels[section]} unpublished.`,
    );

  const removeItem = (section, item) => {
    if (
      !window.confirm(
        `Delete "${item.title}" from the portfolio? Its Cloudinary assets will remain in your account.`,
      )
    ) {
      return;
    }

    void runAction(
      () => deleteContent(section, item),
      `${itemLabels[section]} deleted.`,
    );
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
        {error && <p role="alert" className="mb-4 text-red-600">{error}</p>}
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
            className="w-full rounded bg-purple-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
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
          className="rounded bg-purple-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          Import and publish CV
        </button>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={busy}
          className="rounded border border-current px-4 py-2"
        >
          Sign out
        </button>
      </div>

      {message && <p role="status" className="mb-4 text-green-700">{message}</p>}
      {error && <p role="alert" className="mb-4 text-red-600">{error}</p>}
      {uploading && (
        <p role="status" className="mb-4 text-gray-600 dark:text-gray-300">
          Uploading media to Cloudinary...
        </p>
      )}
      {busy && (
        <p role="status" className="mb-4 text-gray-600 dark:text-gray-300">
          Saving changes...
        </p>
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
            className={`border-b-2 px-4 py-3 font-medium ${
              activeTab === id
                ? "border-purple-600 text-purple-600"
                : "border-transparent"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {sectionData ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold">
              {tabs.find(([id]) => id === section)?.[1]} section
            </h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">
              {sectionData.published ? "Published" : "Draft / unpublished"}
            </span>
          </div>

          <div className="grid gap-4 rounded-xl border border-gray-200 p-5 dark:border-gray-700 sm:grid-cols-2">
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
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy || uploading}
              onClick={() => saveSection(section)}
              className="rounded border border-current px-4 py-2 disabled:opacity-50"
            >
              Save draft
            </button>
            <button
              type="button"
              disabled={busy || uploading}
              onClick={() => publishSection(section)}
              className="rounded bg-purple-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Working..." : "Publish changes"}
            </button>
            {sectionData.published && (
              <button
                type="button"
                disabled={busy || uploading}
                onClick={() => unpublishSection(section)}
                className="rounded border border-red-500 px-4 py-2 text-red-600 disabled:opacity-50"
              >
                Unpublish
              </button>
            )}
            <button
              type="button"
              disabled={busy || uploading}
              onClick={() => removeSection(section)}
              className="rounded border border-red-500 px-4 py-2 text-red-600 disabled:opacity-50"
            >
              Delete section
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold">
              {section === "projects"
                ? "Projects"
                : section === "experience"
                  ? "Professional Experience"
                  : "Training & Certificates"}
            </h2>
            <button
              type="button"
              onClick={() => addItem(section)}
              className="rounded bg-purple-600 px-4 py-2 font-semibold text-white"
            >
              Add{" "}
              {section === "projects"
                ? "project"
                : section === "experience"
                  ? "experience"
                  : "certificate"}
            </button>
          </div>
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
          className="w-full rounded border border-gray-300 bg-transparent p-3"
        />
      ) : (
        <input
          type={type}
          required={required}
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded border border-gray-300 bg-transparent p-3"
        />
      )}
    </label>
  );
}

function MediaField({
  label,
  asset,
  accept,
  isPdf = false,
  busy,
  onUpload,
  onRemove,
}) {
  return (
    <div>
      <span className="mb-1 block">{label}</span>
      <div className="flex flex-wrap items-center gap-3">
        {asset?.url && !isPdf && (
          <PortfolioImage
            url={asset.url}
            alt={label}
            className="h-20 w-20 rounded"
          />
        )}
        {asset?.url && isPdf && (
          <a
            href={asset.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-purple-600 underline"
          >
            Preview {asset.name || "CV PDF"}
          </a>
        )}
        <label className="inline-flex cursor-pointer rounded border border-current px-4 py-2">
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
            className="text-sm text-red-600"
          >
            Remove
          </button>
        )}
      </div>
      <p className="mt-2 text-sm text-gray-500">
        Removing or replacing only updates the portfolio; delete old files
        separately in Cloudinary Media Library.
      </p>
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
  onMoveImage,
  onSave,
  onPublish,
  onUnpublish,
  onDelete,
}) {
  const isProject = section === "projects";
  const isExperience = section === "experience";
  const images = item.images || [];
  const itemType = isProject ? "project" : isExperience ? "experience" : "certificate";

  return (
    <article className="space-y-4 rounded-xl border border-gray-200 p-5 dark:border-gray-700">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">
          {item.title || `New ${itemType}`}
        </h3>
        <span className="text-sm text-gray-500">
          {item.published ? "Published" : "Draft / unpublished"}
        </span>
      </div>
      <TextField
        label={isExperience ? "Role" : "Title"}
        required
        value={item.title}
        onChange={(value) => onChange("title", value)}
      />
      <TextField
        label="Description"
        multiline
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
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Date / year"
            value={item.date}
            onChange={(value) => onChange("date", value)}
          />
          <TextField
            label="Organization"
            value={item.organization}
            onChange={(value) => onChange("organization", value)}
          />
        </div>
      )}

      {!isExperience && (
        <div>
          <span className="mb-2 block">
            Images (up to 4; JPG, PNG, or WEBP; 5 MB max each)
          </span>
          <label className="inline-flex cursor-pointer rounded border border-current px-4 py-2">
            {images.length >= 4 ? "Image limit reached" : "Add images"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              disabled={busy || images.length >= 4}
              onChange={(event) => onUpload(event, "images", null)}
            />
          </label>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((image, index) => (
              <div key={image.publicId} className="space-y-2 rounded border border-gray-200 p-2 dark:border-gray-700">
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
                  >
                    Earlier
                  </button>
                  <button
                    type="button"
                    disabled={busy || index === images.length - 1}
                    onClick={() => onMoveImage(index, 1)}
                    aria-label={`Move ${image.name || `image ${index + 1}`} later`}
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
                <label className="inline-flex cursor-pointer rounded border border-current px-2 py-1 text-xs">
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
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
        <button
          type="button"
          disabled={busy}
          onClick={onSave}
          className="rounded border border-current px-3 py-2 text-sm disabled:opacity-50"
        >
          Save draft
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onPublish}
          className="rounded bg-purple-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Publish
        </button>
        {item.published && (
          <button
            type="button"
            disabled={busy}
            onClick={onUnpublish}
            className="rounded border border-red-500 px-3 py-2 text-sm text-red-600 disabled:opacity-50"
          >
            Unpublish
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className="ml-auto rounded border border-red-500 px-3 py-2 text-sm text-red-600 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </article>
  );
}
