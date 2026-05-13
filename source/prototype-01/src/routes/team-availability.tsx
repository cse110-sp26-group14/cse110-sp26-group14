import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/app-store";
import { Badge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";

export const Route = createFileRoute("/team-availability")({
  head: () => ({ meta: [{ title: "Team Availability — SE SitRep" }] }),
  component: TeamAvailability,
});

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];

function TeamAvailability() {
  const { users, isAdmin } = useApp();
  const humans = users.filter((u) => !u.isAgent);

  const cellState = (uid: string, h: number) => {
    const seed = (uid.charCodeAt(0) + h) % 10;
    if (seed < 5) return "Available";
    if (seed < 7) return "Tentative";
    if (seed < 8) return "Needs Coverage";
    if (seed < 9) return "Preferred";
    return "Unavailable";
  };
  const tone: Record<string, string> = {
    Available: "var(--success)", Tentative: "var(--info)",
    "Needs Coverage": "var(--warning)", Preferred: "var(--purple)", Unavailable: "var(--muted-foreground)",
  };

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Team Availability</h1>
          <p className="text-muted-foreground text-sm mt-1">When the team is reachable today.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm">May 13, 2026</Button>
          <Button variant="outline" size="sm">Sprint 2</Button>
          <select className="rounded-md border border-border bg-card px-3 py-1.5 text-sm">
            <option>All formats</option><option>In person</option><option>Online</option><option>Hybrid</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="grid" style={{ gridTemplateColumns: `140px repeat(${HOURS.length}, 1fr)` }}>
            <div className="p-3 text-xs text-muted-foreground border-b border-border">Today</div>
            {HOURS.map((h) => <div key={h} className="p-3 text-xs text-muted-foreground border-b border-l border-border font-mono text-center">{h}:00</div>)}
            {humans.map((u) => (
              <div key={u.id} className="contents">
                <div className="p-3 border-b border-border">
                  <div className="text-sm font-medium truncate">{u.name}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{u.role}</div>
                </div>
                {HOURS.map((h) => {
                  const s = cellState(u.id, h);
                  return (
                    <div key={h} className="border-b border-l border-border p-1.5">
                      <div className="h-9 rounded-md flex items-center justify-center text-[9px] font-medium"
                        style={{ background: `color-mix(in oklab, ${tone[s]} 22%, white)`, color: tone[s] }}>{s}</div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="font-semibold flex items-center gap-2"><CalendarPlus className="size-4 text-primary" /> Best meeting time</h3>
            <div className="mt-3 rounded-lg border border-primary/40 bg-primary/5 p-3">
              <div className="text-sm font-semibold">Wed · 2:00 PM</div>
              <div className="text-xs text-muted-foreground mt-0.5">4 of 5 available · 1 tentative</div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">Alternatives</div>
            <ul className="mt-1 space-y-1 text-sm">
              <li className="flex justify-between"><span>Thu · 10:00 AM</span><span className="text-muted-foreground">3/5</span></li>
              <li className="flex justify-between"><span>Fri · 11:00 AM</span><span className="text-muted-foreground">3/5</span></li>
            </ul>
            {isAdmin && <Button className="w-full mt-4 text-primary-foreground" style={{ background: "var(--gradient-brand)" }}>Add Meeting to Calendar</Button>}
          </div>
          <div className="rounded-2xl border border-border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="font-semibold">Coverage requests</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center justify-between"><span>Priya · QA on-call</span><Badge tag="Needs Coverage" /></li>
              <li className="flex items-center justify-between"><span>Sam · Docs review</span><Badge tag="Tentative" /></li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="font-semibold">Conflicts</h3>
            <p className="text-sm text-muted-foreground mt-2">2 conflicts during sprint review window.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
