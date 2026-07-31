export const APP_NAME = "UIT - SPAM";
export const APP_FULL_NAME =
  "United Institute Of Technology — Student Project Assessment And Mentorship";
export const APP_TAGLINE = "Monitoring and assessment of final-year projects — simple, campus-ready.";
export const APP_SHORT_TAGLINE = "Student Project Assessment And Mentorship";
export const APP_LOGO = "/brand/united-logo.png";
export const APP_ORG = "United Group of Institutions";

export const ROLES = ["admin", "faculty", "student"] as const;
export type Role = (typeof ROLES)[number];

export const MAX_GROUP_SIZE = 5;

/** Loose AKTU-style roll check: 10–20 digits */
export function isAktuRoll(value: string) {
  return /^\d{10,20}$/.test(value.trim());
}

export function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}
