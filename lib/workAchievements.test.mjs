import test from "node:test";
import assert from "node:assert/strict";
import { isWorkAchievement, splitTrainingAndWorkAchievements } from "./workAchievements.mjs";

test("separates training from new and previously uploaded work documents", () => {
  const training = { id: "training", document: null };
  const legacyDocument = { id: "legacy", document: { url: "https://example.com/file.pdf" } };
  const workDraft = { id: "new", contentType: "workAchievement", document: null };
  assert.deepEqual(splitTrainingAndWorkAchievements([training, legacyDocument, workDraft]), {
    training: [training],
    workAchievements: [legacyDocument, workDraft],
  });
  assert.equal(isWorkAchievement({ id: "old-training" }), false);
});
