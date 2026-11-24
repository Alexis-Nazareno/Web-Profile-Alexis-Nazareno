import { isCertificateFile } from "./certificateFiles.mjs";

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const maximumFileSize = 5 * 1024 * 1024;

function validateFile(file) {
  const isImage = allowedImageTypes.has(file.type);
  const isPdf = file.type === "application/pdf";
  const isDocument = isCertificateFile(file);
  if (!isImage && !isPdf && !isDocument) {
    throw new Error(`${file.name}: choose a JPG, PNG, WEBP, GIF, PDF, DOC, or DOCX file.`);
  }
  if (file.size > maximumFileSize) {
    throw new Error(`${file.name}: file must be 5 MB or smaller.`);
  }
  return isPdf || isDocument ? "raw" : "image";
}

async function uploadCloudinaryFile(file) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();
  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET before uploading.",
    );
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(cloudName)) {
    throw new Error("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is invalid.");
  }

  const resourceType = validateFile(file);
  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: "POST", body },
  );
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("Cloudinary returned an unreadable upload response.");
  }

  if (!response.ok) {
    throw new Error(
      result.error?.message || `Cloudinary upload failed (${response.status}).`,
    );
  }
  if (!result.secure_url || !result.public_id) {
    throw new Error("Cloudinary did not return a file URL and public ID.");
  }

  return {
    id: result.public_id,
    name: file.name,
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type || resourceType,
    format: result.format || "",
    contentType: file.type,
    sizeBytes: result.bytes || file.size,
  };
}

export async function uploadCloudinaryFiles(files) {
  const uploadedAssets = [];
  for (const file of files) {
    try {
      uploadedAssets.push(await uploadCloudinaryFile(file));
    } catch (uploadError) {
      if (uploadedAssets.length) {
        uploadError.uploadedAssets = uploadedAssets;
        uploadError.message = `${uploadError.message} ${uploadedAssets.length} earlier file(s) uploaded successfully; save them from the dashboard or remove their references.`;
      }
      throw uploadError;
    }
  }
  return uploadedAssets;
}
