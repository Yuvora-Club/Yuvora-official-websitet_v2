// YUVORA — member directory.
//
// SINGLE SOURCE OF TRUTH for the dedicated Members page (route: /members).
// Edit ONLY this file to add, remove, or update members. The page layout and
// component code never need to change.
//
// HOW TO UPDATE A PROFILE:
//   1. Replace `name` with the member's full name.
//   2. Replace `role` with their club role (e.g. "Sports Captain").
//      Leave it as "" and the role line hides itself.
//   3. Replace `bio` with a 1–2 line bio. Leave it as "" to hide it.
//   4. Photos: drop the image into `public/members/` and set
//      `photo: "/members/<file-name>.jpg"` (jpg/png/webp all fine).
//      Leave it as "" and a clean initials avatar is shown instead.
//   5. `socials`: keep ONLY platforms the member actually has. Each entry is
//      { platform, url } where platform is one of:
//      "instagram" | "linkedin" | "github" | "x" | "youtube"
//      and url is the full https:// profile link. Entries with an empty or
//      invalid url are never rendered — no fake icons, no dead links.
//
// Do NOT invent names, roles, bios, photos, or profile URLs. Anything not yet
// confirmed should stay a clearly-marked placeholder (see below) or "".

// Platforms the Members page knows how to render (icon + accessible label).
export const SOCIAL_LABELS = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  github: "GitHub",
  x: "X",
  youtube: "YouTube",
};

// All six current club members. No confirmed details are available yet, so
// every slot is an explicit placeholder — safe to publish, easy to replace.
export const MEMBERS = [
  { id: "member-1", name: "Member 1", role: "Role — to be announced", bio: "", photo: "", socials: [] },
  { id: "member-2", name: "Member 2", role: "Role — to be announced", bio: "", photo: "", socials: [] },
  { id: "member-3", name: "Member 3", role: "Role — to be announced", bio: "", photo: "", socials: [] },
  { id: "member-4", name: "Member 4", role: "Role — to be announced", bio: "", photo: "", socials: [] },
  { id: "member-5", name: "Member 5", role: "Role — to be announced", bio: "", photo: "", socials: [] },
  { id: "member-6", name: "Member 6", role: "Role — to be announced", bio: "", photo: "", socials: [] },
];

// EXAMPLE — a filled-in entry (for reference only, do not uncomment until
// the details are confirmed with the member):
//
// {
//   id: "aarav-sharma",
//   name: "Aarav Sharma",
//   role: "Sports Captain",
//   bio: "Runs the golden-hour leagues and keeps the lime lines straight.",
//   photo: "/members/aarav-sharma.jpg",
//   socials: [
//     { platform: "instagram", url: "https://instagram.com/..." },
//     { platform: "linkedin", url: "https://linkedin.com/in/..." },
//   ],
// },
