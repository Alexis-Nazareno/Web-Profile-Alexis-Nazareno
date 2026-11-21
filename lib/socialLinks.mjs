export const socialPlatforms = [
  { field: "facebookUrl", label: "Facebook" },
  { field: "instagramUrl", label: "Instagram" },
  { field: "tiktokUrl", label: "TikTok" },
  { field: "linkedinUrl", label: "LinkedIn" },
  { field: "githubUrl", label: "GitHub" },
  { field: "youtubeUrl", label: "YouTube" },
  { field: "twitterUrl", label: "X (Twitter)" },
  { field: "threadsUrl", label: "Threads" },
  { field: "pinterestUrl", label: "Pinterest" },
  { field: "discordUrl", label: "Discord" },
  { field: "redditUrl", label: "Reddit" },
  { field: "blueskyUrl", label: "Bluesky" },
  { field: "mastodonUrl", label: "Mastodon" },
  { field: "snapchatUrl", label: "Snapchat" },
  { field: "telegramUrl", label: "Telegram" },
  { field: "whatsappUrl", label: "WhatsApp" },
  { field: "twitchUrl", label: "Twitch" },
  { field: "spotifyUrl", label: "Spotify" },
  { field: "behanceUrl", label: "Behance" },
  { field: "dribbbleUrl", label: "Dribbble" },
];

export function getSocialLinks(contact) {
  const links = [];
  const invalid = [];

  for (const platform of socialPlatforms) {
    const value = contact[platform.field];
    if (value == null || (typeof value === "string" && !value.trim())) continue;
    if (typeof value !== "string") {
      invalid.push(platform.label);
      continue;
    }

    try {
      const url = new URL(value.trim());
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        invalid.push(platform.label);
        continue;
      }
      links.push({ ...platform, url: value.trim() });
    } catch {
      invalid.push(platform.label);
    }
  }

  return { links, invalid };
}
