import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/app-store";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/StatusBadge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, Plus, StickyNote } from "lucide-react";
import type { Issue } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/issues")({
  head: () => ({ meta: [{ title: "Issues & Reports — SE SitRep" }] }),
  component: Issues,
});

const FILTERS = ["All", "Open", "In Progress", "Blocked", "High Priority", "Assigned to Me", "Created by Me", "Resolved"] as const;

function Issues() {
  const { issues, users, currentUserId, openModal, tasks } = useApp();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<typeof FILTERS[number]>("All");
  const [open, setOpen] = useState<Issue | null>(null);

  const filtered = useMemo(() => {
    let r = issues.filter((i) => i.title.toLowerCase().includes(q.toLowerCase()));
    switch (filter) {
      case "Open": r = r.filter((i) => i.status === "Open"); break;
      case "In Progress": r = r.filter((i) => i.status === "In Progress"); break;
      case "Blocked": r = r.filter((i) => i.status === "Blocked" || i.type === "Blocker"); break;
      case "High Priority": r = r.filter((i) => i.priority === "High" || i.priority === "Critical"); break;
      case "Assigned to Me": r = r.filter((i) => i.assigneeId === currentUserId); break;
      case "Created by Me": r = r.filter((i) => i.reporterId === currentUserId); break;
      case "Resolved": r = r.filter((i) => i.status === "Resolved"); break;
    }
    return r;
  }, [issues, q, filter, currentUserId]);

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Issues & Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Bugs, blockers, and process issues.</p>
        </div>
        <Button onClick={() => openModal("createIssue")} className="text-primary-foreground" style={{ background: "var(--gradient-brand)" }}><Plus className="size-4 mr-1" /> Create Issue / Report</Button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search issues…" className="pl-9 bg-secondary/50 border-transparent" />
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1 text-xs ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        {filtered.map((i) => {
          const reporter = users.find((u) => u.id === i.reporterId);
          const assignee = users.find((u) => u.id === i.assigneeId);
          return (
            <button key={i.id} onClick={() => setOpen(i)} className="w-full text-left rounded-xl border border-border bg-card p-4 flex gap-4 hover:border-primary/40 transition-colors" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{i.title}</span>
                  <Badge tag={i.priority} />
                  <Badge tag={i.status} />
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{i.type}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1.5 line-clamp-1">{i.description}</p>
                <div className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-3">
                  <span>By {reporter?.name}</span>
                  {assignee && <span>· Assignee {assignee.name}</span>}
                  <span>· {i.sprint}</span>
                  <span>· created {i.createdAt}</span>
                </div>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && <div className="text-center text-muted-foreground py-12 text-sm">No issues match your filters.</div>}
      </div>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {open && (
            <>
              <SheetHeader><SheetTitle>{open.title}</SheetTitle></SheetHeader>
              <div className="space-y-4 mt-4 text-sm">
                <p className="text-muted-foreground">{open.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Type">{open.type}</Field>
                  <Field label="Priority"><Badge tag={open.priority} /></Field>
                  <Field label="Status"><Badge tag={open.status} /></Field>
                  <Field label="Sprint">{open.sprint}</Field>
                  <Field label="Reporter">{users.find((u) => u.id === open.reporterId)?.name}</Field>
                  <Field label="Assignee">{users.find((u) => u.id === open.assigneeId)?.name || "Unassigned"}</Field>
                  <Field label="Related task">{tasks.find((t) => t.id === open.relatedTaskId)?.title || "—"}</Field>
                  <Field label="Due">{open.dueDate || "—"}</Field>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Notes</div>
                  {open.notes.length === 0 ? <div className="text-xs text-muted-foreground italic">No notes yet</div> : open.notes.map((n, i) => <div key={i} className="rounded-md bg-secondary/50 p-2 text-sm mb-1.5">{n}</div>)}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Activity</div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground"><li>· Created on {open.createdAt}</li><li>· Status: {open.status}</li></ul>
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  <Button size="sm" variant="outline" onClick={() => openModal("addNote", { attachType: "Issue", attachId: open.id })}><StickyNote className="size-3.5 mr-1" /> Add Note</Button>
                  <Button size="sm" variant="outline" onClick={() => toast("Reassigned")}>Assign</Button>
                  <Button size="sm" variant="outline" onClick={() => toast.success("Converted to task")}>Convert to Task</Button>
                  <Button size="sm" onClick={() => toast.success("Marked resolved")} className="text-primary-foreground" style={{ background: "var(--gradient-brand)" }}>Mark Resolved</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-1">{children}</div></div>;
}
