// Who may do what on a project. Every project route asks `can` before it acts, so this table is the one place
// permissions are decided. Safe to import from the browser (no server code).

export const MEMBER_ROLES = ["architect", "client", "builder", "viewer"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];
export type ProjectRole = "owner" | MemberRole;

export type Action =
  | "view" // see the design, budget, shopping list, export
  | "comment"
  | "edit" // change the design: choose a plan, make changes, re-run, tick greenery
  | "invite" // add people and see the team
  | "approve"
  | "site" // run the building site
  | "message" // post in the project thread
  | "review"; // send the design for the client's review

const RULES: Record<ProjectRole, readonly Action[]> = {
  owner: ["view", "comment", "edit", "invite", "approve", "site", "message", "review"],
  architect: ["view", "comment", "edit", "invite", "message", "review"],
  client: ["view", "comment", "approve", "message"],
  builder: ["view", "comment", "site", "message"],
  viewer: ["view"],
};

export const can = (role: ProjectRole | null | undefined, action: Action) => !!role && RULES[role].includes(action);

/** Which roles a person may invite: the owner anyone, an architect only the client, builder or a viewer. */
export function invitable(role: ProjectRole | null | undefined): MemberRole[] {
  if (role === "owner") return [...MEMBER_ROLES];
  if (role === "architect") return ["client", "builder", "viewer"];
  return [];
}

export const ROLE_NAME: Record<ProjectRole, string> = {
  owner: "Owner",
  architect: "Architect",
  client: "Client",
  builder: "Builder",
  viewer: "Viewer",
};

export const ROLE_CAN: Record<MemberRole, string> = {
  architect: "Designs and changes the plan, invites the client and builder",
  client: "Sees the design, comments and approves it",
  builder: "Sees the approved design and runs the site",
  viewer: "Can look, nothing else",
};

/** The pros on a project: only they see the team-only channel, and only when there are two or more of them. */
export const isPro = (role: ProjectRole | null | undefined) => role === "architect" || role === "builder";
