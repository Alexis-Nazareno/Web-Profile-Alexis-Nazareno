import { strict as assert } from "node:assert";
import { test } from "node:test";
import { getSocialLinks } from "./socialLinks.mjs";

test("returns only populated, valid social links in display order", () => {
  const result = getSocialLinks({
    facebookUrl: " https://example.com/facebook ",
    instagramUrl: " ",
    githubUrl: "https://example.com/github",
  });

  assert.deepEqual(result, {
    links: [
      { field: "facebookUrl", label: "Facebook", url: "https://example.com/facebook" },
      { field: "githubUrl", label: "GitHub", url: "https://example.com/github" },
    ],
    invalid: [],
  });
});

test("reports invalid or unsafe links rather than exposing them", () => {
  const result = getSocialLinks({
    facebookUrl: "javascript:alert(1)",
    instagramUrl: "instagram.com/example",
    linkedinUrl: 123,
    tiktokUrl: "http://example.com/tiktok",
  });

  assert.deepEqual(result.invalid, ["Facebook", "Instagram", "LinkedIn"]);
  assert.deepEqual(result.links, [
    { field: "tiktokUrl", label: "TikTok", url: "http://example.com/tiktok" },
  ]);
});

test("accepts new platform links and rejects invalid ones", () => {
  const result = getSocialLinks({
    youtubeUrl: "https://example.com/channel",
    twitterUrl: " https://example.com/profile ",
    discordUrl: "javascript:alert(1)",
    blueskyUrl: "https://example.com/social",
  });

  assert.deepEqual(result.links, [
    { field: "youtubeUrl", label: "YouTube", url: "https://example.com/channel" },
    { field: "twitterUrl", label: "X (Twitter)", url: "https://example.com/profile" },
    { field: "blueskyUrl", label: "Bluesky", url: "https://example.com/social" },
  ]);
  assert.deepEqual(result.invalid, ["Discord"]);
});
