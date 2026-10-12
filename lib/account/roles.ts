// The roles people pick at sign-up. Safe to import from the browser.

export const ROLES = ["owner", "business", "architect", "builder"] as const;
export type Role = (typeof ROLES)[number];
export type Plan = "free" | "owner" | "pro" | "build";

export const ROLE_LABEL: Record<Role, string> = {
  owner: "Homeowner",
  business: "Business owner",
  architect: "Architect or interior designer",
  builder: "Builder or contractor",
};
