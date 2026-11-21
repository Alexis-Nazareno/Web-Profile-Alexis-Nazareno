import { strict as assert } from "node:assert";
import { test } from "node:test";
import { groupMemoryAlbums } from "./workMemories.mjs";

test("groups company albums without losing their order or photos", () => {
  const first = { id: "1", organization: " Pragmanila ", images: [{ url: "one" }] };
  const second = { id: "2", organization: "Accenture", images: [] };
  const third = { id: "3", organization: "pragmanila", images: [{ url: "two" }] };
  const groups = groupMemoryAlbums([first, second, third]);

  assert.deepEqual(groups, [
    ["pragmanila", { name: "Pragmanila", albums: [first, third] }],
    ["accenture", { name: "Accenture", albums: [second] }],
  ]);
});

test("handles missing company names and an empty collection", () => {
  const album = { id: "1", organization: " " };
  assert.deepEqual(groupMemoryAlbums([]), []);
  assert.deepEqual(groupMemoryAlbums([album]), [
    ["other memories", { name: "Other memories", albums: [album] }],
  ]);
});
