import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/app-store";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/StatusBadge";
import { Search, Sparkles, Bell, Wand2, Calendar, AlertCircle } from "lucide-react";
import type { AILog } from "@/lib/types";

export const Route = createFileRoute("/ai-log")({
  head: () => ({ meta: [{ title: "AI Log — SE SitRep" }] }),
  component: AILogPage,
});

const ICONS: Record<AILog["type"], any> = {
  "AI Summary Generated": Sparkles, "AI Reminder Sent": Bell,
  "AI Sprint Tasks Suggested": Wand2, "AI Meeting Time Suggested": Calendar,
  "AI Issue Follow-up Suggested": AlertCircle,
};

function AILogPage() {
  const { aiLogs } = useApp();
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("All");
  const [approval, setApproval] = useState<string>("All");
  const [sel, setSel] = useState<AILog | null>(aiLogs[0] || null);

  const filtered = useMemo(() => {
    return aiLogs.filter((l) => {
      if (q && !l.outputSummary.toLowerCase().includes(q.toLowerCase()) && !l.type.toLowerCase().includes(q.toLowerCase())) return false;
      if (type !== "All" && l.type !== type) return false;
      if (approval !== "All" && l.approval !== approval) return false;
      return true;
    });
  }, [aiLogs, q, type, approval]);

  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h1 className="text-2xl font-semibold">AI Log</h1>
        <p className="text-muted-foreground text-sm mt-1">Transparent record of every AI action.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-9 bg-secondary/50 border-transparent" />
          </div>
          <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-md border border-border bg-card px-3 py-2 text-sm">
            <option>All</option>{Object.keys(ICONS).map((k) => <option key={k}>{k}</option>)}
          </select>
          <select value={approval} onChange={(e) => setApproval(e.target.value)} className="rounded-md border border-border bg-card px-3 py-2 text-sm">
            <option>All</option><option>Pending Review</option><option>Approved</option><option>Rejected</option><option>Applied</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-3">
          {filtered.map((l) => {
            const Icon = ICONS[l.type];
            const active = sel?.id === l.id;
            return (
              <button key={l.id} onClick={() => setSel(l)} className={`w-full text-left rounded-xl border p-4 transition-colors ${active ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"}`} style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-start gap-3">
                  <div className="size-9 rounded-lg flex items-center justify-center" style={{ background: "var(--purple-soft)", color: "var(--purple)" }}><Icon className="size-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{l.type}</span>
                      <Badge tag={l.approval} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{l.outputSummary}</p>
                    <div className="text-[11px] font-mono text-muted-foreground mt-1.5">{l.timestamp}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 h-fit sticky top-32" style={{ boxShadow: "var(--shadow-card)" }}>
          {sel ? (
            <>
              <h3 className="font-semibold">{sel.type}</h3>
              <Badge tag={sel.approval} className="mt-2" />
              <div className="mt-4 space-y-3 text-sm">
                <Field label="Timestamp"><span className="font-mono text-xs">{sel.timestamp}</span></Field>
                <Field label="Input source">{sel.inputSource}</Field>
                <Field label="Output">{sel.outputSummary}</Field>
                <Field label="Reviewer">{sel.reviewer || "—"}</Field>
                <Field label="Linked tasks">{sel.linkedTaskIds.join(", ") || "—"}</Field>
                <Field label="Linked events">{sel.linkedEventIds.join(", ") || "—"}</Field>
              </div>
            </>
          ) : <p className="text-sm text-muted-foreground">Select an AI log entry.</p>}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-0.5">{children}</div></div>;
}
