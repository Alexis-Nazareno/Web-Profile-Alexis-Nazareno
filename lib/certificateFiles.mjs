export const certificateFileAccept = ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const fileTypes = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export function isCertificateFile(file) {
  const extension = typeof file?.name === "string" && file.name.includes(".")
    ? file.name.split(".").pop().toLowerCase() : "";
  return Boolean(fileTypes[extension]) &&
    (!file.type || file.type === fileTypes[extension]);
}
