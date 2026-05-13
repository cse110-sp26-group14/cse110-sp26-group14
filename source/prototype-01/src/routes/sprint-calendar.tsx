import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/app-store";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CalendarDays, MapPin, Video, Target } from "lucide-react";

export const Route = createFileRoute("/sprint-calendar")({
  head: () => ({ meta: [{ title: "Sprint Calendar — SE SitRep" }] }),
  component: SprintCalendar,
});

const DAYS = Array.from({ length: 14 }, (_, i) => 12 + i);
const TODAY = 13;
const SPRINT_DAYS = new Set([12, 13, 14, 15, 16, 17, 18, 19]);

function SprintCalendar() {
  const { meetings, tasks, isAdmin } = useApp();
  const [view, setView] = useState<"Month" | "Week" | "Sprint">("Sprint");
  const [selected, setSelected] = useState(13);
  const [meetingOpen, setMeetingOpen] = useState<typeof meetings[0] | null>(null);

  const dateOf = (n: number) => `2026-05-${String(n).padStart(2, "0")}`;
  const eventsFor = (n: number) => meetings.filter((m) => m.date === dateOf(n));
  const dueFor = (n: number) => tasks.filter((t) => t.dueDate === dateOf(n));

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Sprint Calendar</h1>
          <p className="text-muted-foreground text-sm mt-1">Sprint 2 · May 12 – May 19</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Button variant="outline" size="sm">May 2026</Button>
          <Button variant="outline" size="sm">Sprint 2</Button>
          <Button variant="outline" size="sm" onClick={() => setSelected(TODAY)}>Today</Button>
          <div className="flex rounded-md border border-border overflow-hidden">
            {(["Month", "Week", "Sprint"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 text-xs ${view === v ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-secondary"}`}>{v}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="grid grid-cols-7 gap-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="text-[10px] uppercase tracking-wide text-muted-foreground text-center pb-1">{d}</div>)}
            {DAYS.map((n) => {
              const isToday = n === TODAY;
              const inSprint = SPRINT_DAYS.has(n);
              const isSel = n === selected;
              const evs = eventsFor(n);
              const dues = dueFor(n);
              return (
                <button key={n} onClick={() => setSelected(n)}
                  className={`rounded-lg border p-2 min-h-28 text-left transition-colors ${
                    isSel ? "border-primary ring-2 ring-primary/20" : "border-border"
                  } ${inSprint ? "bg-purple-soft/30" : "bg-secondary/30"}`}
                  style={{ background: inSprint ? "color-mix(in oklab, var(--purple-soft) 60%, white)" : undefined }}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-semibold ${isToday ? "text-primary" : ""}`}>{n}</span>
                    {isToday && <span className="size-1.5 rounded-full bg-primary" />}
                  </div>
                  <div className="mt-1.5 space-y-1">
                    {evs.slice(0, 2).map((e) => (
                      <div key={e.id} className="text-[10px] truncate rounded px-1 py-0.5" style={{ background: "var(--info-soft)", color: "var(--info)" }}>{e.time} {e.title}</div>
                    ))}
                    {dues.slice(0, 1).map((t) => (
                      <div key={t.id} className="text-[10px] truncate rounded px-1 py-0.5" style={{ background: "var(--warning-soft)", color: "var(--warning)" }}>Due: {t.title}</div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-4 text-xs text-muted-foreground">
            <Legend label="Sprint range" color="var(--purple)" />
            <Legend label="Meetings" color="var(--info)" />
            <Legend label="Tasks due" color="var(--warning)" />
            <Legend label="Today" color="var(--primary)" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="size-4 text-muted-foreground" />
            <h3 className="font-semibold">May {selected}</h3>
          </div>
          <Section title="Meetings">
            {eventsFor(selected).length === 0 && <Empty />}
            {eventsFor(selected).map((m) => (
              <button key={m.id} onClick={() => setMeetingOpen(m)} className="w-full text-left rounded-lg border border-border p-3 hover:border-primary/40 transition-colors mb-2">
                <div className="text-sm font-medium">{m.title}</div>
                <div className="text-xs text-muted-foreground font-mono mt-0.5">{m.time} · {m.format}</div>
              </button>
            ))}
          </Section>
          <Section title="Tasks due">
            {dueFor(selected).length === 0 && <Empty />}
            {dueFor(selected).map((t) => (
              <div key={t.id} className="rounded-lg border border-border p-3 mb-2">
                <div className="flex items-center gap-2"><span className="text-sm font-medium flex-1">{t.title}</span><Badge tag={t.priority} /></div>
              </div>
            ))}
          </Section>
          <Section title="Notes"><Empty msg="No notes attached" /></Section>
        </div>
      </div>

      {/* Meeting detail */}
      <Dialog open={!!meetingOpen} onOpenChange={(o) => !o && setMeetingOpen(null)}>
        <DialogContent className="max-w-lg">
          {meetingOpen && (
            <>
              <DialogHeader><DialogTitle>{meetingOpen.title}</DialogTitle></DialogHeader>
              <div className="space-y-3 py-2 text-sm">
                <Row label="Date & time"><span className="font-mono">{meetingOpen.date} · {meetingOpen.time}</span></Row>
                <Row label="Format"><span className="capitalize inline-flex items-center gap-1.5">{meetingOpen.format === "online" ? <Video className="size-3.5" /> : <MapPin className="size-3.5" />}{meetingOpen.format}</span></Row>
                <Row label="Location">{meetingOpen.location}</Row>
                <Row label="Goal"><span className="inline-flex items-center gap-1.5"><Target className="size-3.5 text-muted-foreground" />{meetingOpen.goal}</span></Row>
                <Row label="Attendees">{meetingOpen.attendees.length} people</Row>
                <Row label="Sprint">{meetingOpen.sprint}</Row>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setMeetingOpen(null)}>Close</Button>
                {isAdmin && <Button className="text-primary-foreground" style={{ background: "var(--gradient-brand)" }}>Edit Meeting</Button>}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (<div className="mb-4"><div className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">{title}</div>{children}</div>);
}
function Empty({ msg = "Nothing scheduled" }: { msg?: string }) {
  return <div className="text-xs text-muted-foreground italic">{msg}</div>;
}
function Legend({ label, color }: { label: string; color: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: color }} />{label}</span>;
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid grid-cols-3 gap-2"><span className="text-muted-foreground text-xs">{label}</span><span className="col-span-2">{children}</span></div>;
}
