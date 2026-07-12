import type { Category } from "./data";

export function formatCount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return (k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)) + "K";
  }
  return String(n);
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    open: "Open",
    progress: "In Progress",
    resolved: "Resolved",
  };
  return map[status] || "Open";
}

export function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

export function catLabel(categoryId: string, categories: Category[]): string {
  const cat = categories.find((c) => c.id === categoryId);
  return cat ? cat.name : "Other";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
