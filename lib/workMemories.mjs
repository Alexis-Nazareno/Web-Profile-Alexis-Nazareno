export const MAX_MEMORY_IMAGES = 20;

export function groupMemoryAlbums(albums) {
  const companies = new Map();
  for (const album of albums) {
    const company = album.organization?.trim() || "Other memories";
    const key = company.toLocaleLowerCase();
    if (!companies.has(key)) companies.set(key, { name: company, albums: [] });
    companies.get(key).albums.push(album);
  }
  return Array.from(companies.entries());
}
