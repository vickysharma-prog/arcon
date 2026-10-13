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

/** The short name of a role, shown next to a person's name ("Vicky · Architect"). */
export const ROLE_SHORT: Record<Role, string> = { owner: "Homeowner", business: "Business owner", architect: "Architect", builder: "Builder" };
