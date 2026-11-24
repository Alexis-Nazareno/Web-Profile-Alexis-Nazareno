import test from "node:test";
import assert from "node:assert/strict";
import { isCertificateFile } from "./certificateFiles.mjs";

test("accepts PDF and Word files with matching or unavailable MIME types", () => {
  assert.equal(isCertificateFile({ name: "certificate.PDF", type: "application/pdf" }), true);
  assert.equal(isCertificateFile({ name: "award.doc", type: "application/msword" }), true);
  assert.equal(isCertificateFile({ name: "award.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }), true);
  assert.equal(isCertificateFile({ name: "award.docx", type: "" }), true);
});

test("rejects unsupported extensions and mismatched MIME types", () => {
  assert.equal(isCertificateFile({ name: "award.pdf.exe", type: "" }), false);
  assert.equal(isCertificateFile({ name: "award.docx", type: "image/png" }), false);
  assert.equal(isCertificateFile({ name: "pdf", type: "application/pdf" }), false);
  assert.equal(isCertificateFile(null), false);
});
