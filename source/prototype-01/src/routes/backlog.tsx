import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/app-store";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/StatusBadge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, Plus, Sparkles, StickyNote } from "lucide-react";
import type { Task } from "@/lib/types";

export const Route = createFileRoute("/backlog")({
  head: () => ({ meta: [{ title: "Backlog — SE SitRep" }] }),
  component: Backlog,
});

const FILTERS = ["All", "High Priority", "Unassigned", "This Sprint", "Future Sprint", "AI Suggested", "Blocked", "Completed"] as const;

function Backlog() {
  const { tasks, users, sprint, openModal, addTask, setTasks } = useApp();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<typeof FILTERS[number]>("All");
  const [sort, setSort] = useState("priority");
  const [open, setOpen] = useState<Task | null>(null);

  const filtered = useMemo(() => {
    let r = tasks.filter((t) => t.title.toLowerCase().includes(q.toLowerCase()) || t.description.toLowerCase().includes(q.toLowerCase()));
    switch (filter) {
      case "High Priority": r = r.filter((t) => t.priority === "High" || t.priority === "Critical"); break;
      case "Unassigned": r = r.filter((t) => !t.ownerId); break;
      case "This Sprint": r = r.filter((t) => t.sprint === sprint.name); break;
      case "Future Sprint": r = r.filter((t) => t.sprint && t.sprint !== sprint.name && t.sprint !== "Sprint 1"); break;
      case "AI Suggested": r = r.filter((t) => t.aiSuggested); break;
      case "Blocked": r = r.filter((t) => t.status === "Blocked"); break;
      case "Completed": r = r.filter((t) => t.status === "Done"); break;
    }
    if (sort === "priority") {
      const order: any = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      r = [...r].sort((a, b) => order[a.priority] - order[b.priority]);
    } else if (sort === "due") {
      r = [...r].sort((a, b) => (a.dueDate || "z").localeCompare(b.dueDate || "z"));
    }
    return r;
  }, [tasks, q, filter, sort, sprint.name]);

  const updateTask = (id: string, patch: Partial<Task>) => setTasks((prev) => prev.map((t) => t.id === id ? { ...t, ...patch } : t));

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Backlog</h1>
          <p className="text-muted-foreground text-sm mt-1">All tasks across past, current, and upcoming sprints.</p>
        </div>
        <Button onClick={() => addTask({ title: "New task" })} className="text-primary-foreground" style={{ background: "var(--gradient-brand)" }}>
          <Plus className="size-4 mr-1" /> Add Task
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks…" className="pl-9 bg-secondary/50 border-transparent" />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-md border border-border bg-card px-3 py-2 text-sm">
            <option value="priority">Sort: Priority</option>
            <option value="due">Sort: Due date</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1 text-xs ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">Task</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Owner</th>
              <th className="text-left px-4 py-3 hidden lg:table-cell">Sprint</th>
              <th className="text-left px-4 py-3">Priority</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((t) => {
              const u = users.find((x) => x.id === t.ownerId);
              return (
                <tr key={t.id} onClick={() => setOpen(t)} className="cursor-pointer hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {t.aiSuggested && <Sparkles className="size-3.5 text-primary shrink-0" />}
                      <span className="font-medium truncate">{t.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{u?.name || "—"}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{t.sprint}</td>
                  <td className="px-4 py-3"><Badge tag={t.priority} /></td>
                  <td className="px-4 py-3"><Badge tag={t.status} /></td>
                  <td className="px-4 py-3 hidden sm:table-cell font-mono text-xs text-muted-foreground">{t.dueDate || "—"}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-sm">No tasks match.</td></tr>}
          </tbody>
        </table>
      </div>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {open && (
            <>
              <SheetHeader><SheetTitle>{open.title}</SheetTitle></SheetHeader>
              <div className="space-y-4 mt-4 text-sm">
                <p className="text-muted-foreground">{open.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Status"><Badge tag={open.status} /></Field>
                  <Field label="Priority"><Badge tag={open.priority} /></Field>
                  <Field label="Owner">{users.find((u) => u.id === open.ownerId)?.name || "Unassigned"}</Field>
                  <Field label="Sprint">{open.sprint}</Field>
                  <Field label="Due">{open.dueDate || "—"}</Field>
                  <Field label="AI suggested">{open.aiSuggested ? "Yes" : "No"}</Field>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Notes</div>
                  {open.notes.length === 0 ? <div className="text-xs text-muted-foreground italic">No notes yet</div> : open.notes.map((n, i) => <div key={i} className="rounded-md bg-secondary/50 p-2 text-sm mb-1.5">{n}</div>)}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Activity</div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li>· Created · 2 days ago</li>
                    <li>· Status set to {open.status}</li>
                  </ul>
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  <Button size="sm" variant="outline" onClick={() => openModal("addNote", { attachType: "Task", attachId: open.id })}><StickyNote className="size-3.5 mr-1" /> Add Note</Button>
                  <Button size="sm" variant="outline" onClick={() => { updateTask(open.id, { status: "Blocked" }); setOpen({ ...open, status: "Blocked" }); }}>Mark Blocked</Button>
                  <Button size="sm" onClick={() => { updateTask(open.id, { status: "Done" }); setOpen({ ...open, status: "Done" }); }} className="text-primary-foreground" style={{ background: "var(--gradient-brand)" }}>Mark Done</Button>
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
