const BRANCH_KEY = "x-branch-id";

export function setCurrentBranch(id: string) {
  if (typeof window !== "undefined") localStorage.setItem(BRANCH_KEY, id);
}

export function getCurrentBranch(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem(BRANCH_KEY) || process.env.NEXT_PUBLIC_DEFAULT_BRANCH_ID;
}

export function getTenantId(): string {
  return process.env.NEXT_PUBLIC_TENANT_ID as string;
}
