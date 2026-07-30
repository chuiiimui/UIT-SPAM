export const APP_NAME = "UIT - SPAM";
export const APP_FULL_NAME =
  "United Institute Of Technology - Student Project Assessment And Mentorship";
export const APP_TAGLINE = APP_FULL_NAME;
export const APP_SHORT_TAGLINE = "Student Project Assessment And Mentorship";
export const APP_LOGO = "/brand/united-logo.png";
export const APP_ORG = "United Group of Institutions";

export const MILESTONES: Record<string, string> = {
  proposal: "Project Proposal",
  srs: "Requirements / SRS",
  design: "Design & Architecture",
  prototype: "Working Prototype",
  testing: "Testing & Validation",
  final: "Final Submission",
};

export const ROLES = ["admin", "faculty", "student"] as const;
export type Role = (typeof ROLES)[number];

export function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}
