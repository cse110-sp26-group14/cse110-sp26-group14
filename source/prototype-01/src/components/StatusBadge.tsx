import type { Status, Mood, Priority, TaskStatus } from "@/lib/types";

type AnyTag = Status | Mood | Priority | TaskStatus | string;

const map: Record<string, { bg: string; fg: string }> = {
  // status
  "Checked In":         { bg: "var(--success-soft)",  fg: "var(--success)" },
  "Missing Check-In":   { bg: "var(--warning-soft)",  fg: "var(--warning)" },
  "Blocked":            { bg: "var(--danger-soft)",   fg: "var(--danger)" },
  "Needs Help":         { bg: "var(--warning-soft)",  fg: "var(--warning)" },
  "Available":          { bg: "var(--success-soft)",  fg: "var(--success)" },
  "Unavailable":        { bg: "var(--muted)",         fg: "var(--muted-foreground)" },
  "Tentative":          { bg: "var(--info-soft)",     fg: "var(--info)" },
  "Needs Coverage":     { bg: "var(--warning-soft)",  fg: "var(--warning)" },
  "Preferred":          { bg: "var(--purple-soft)",   fg: "var(--purple)" },
  "AI Review Needed":   { bg: "var(--purple-soft)",   fg: "var(--purple)" },
  "Resolved":           { bg: "var(--success-soft)",  fg: "var(--success)" },
  "High Priority":      { bg: "var(--warning-soft)",  fg: "var(--warning)" },
  "Critical":           { bg: "var(--danger-soft)",   fg: "var(--danger)" },
  "Due Soon":           { bg: "var(--warning-soft)",  fg: "var(--warning)" },
  // priority
  "Low":                { bg: "var(--muted)",         fg: "var(--muted-foreground)" },
  "Medium":             { bg: "var(--info-soft)",     fg: "var(--info)" },
  "High":               { bg: "var(--warning-soft)",  fg: "var(--warning)" },
  // task status
  "Backlog":            { bg: "var(--muted)",         fg: "var(--muted-foreground)" },
  "Ready":              { bg: "var(--info-soft)",     fg: "var(--info)" },
  "In Sprint":          { bg: "var(--purple-soft)",   fg: "var(--purple)" },
  "In Progress":        { bg: "var(--info-soft)",     fg: "var(--info)" },
  "Done":               { bg: "var(--success-soft)",  fg: "var(--success)" },
  "Open":               { bg: "var(--info-soft)",     fg: "var(--info)" },
  // mood
  "Great":              { bg: "var(--success-soft)",  fg: "var(--success)" },
  "Good":               { bg: "var(--info-soft)",     fg: "var(--info)" },
  "Okay":               { bg: "var(--muted)",         fg: "var(--muted-foreground)" },
  "Stressed":           { bg: "var(--warning-soft)",  fg: "var(--warning)" },
  "Burned Out":         { bg: "var(--danger-soft)",   fg: "var(--danger)" },
  // approval
  "Pending Review":     { bg: "var(--warning-soft)",  fg: "var(--warning)" },
  "Approved":           { bg: "var(--success-soft)",  fg: "var(--success)" },
  "Rejected":           { bg: "var(--danger-soft)",   fg: "var(--danger)" },
  "Applied":            { bg: "var(--purple-soft)",   fg: "var(--purple)" },
};

export function Badge({ tag, className = "" }: { tag: AnyTag; className?: string }) {
  const c = map[tag] ?? { bg: "var(--muted)", fg: "var(--muted-foreground)" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
      style={{ background: c.bg, color: c.fg }}
    >
      <span className="size-1.5 rounded-full" style={{ background: c.fg }} />
      {tag}
    </span>
  );
}
