import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/app-store";
import { Badge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CalendarDays, ClipboardCheck, CalendarClock, Sparkles, Bell,
  AlertTriangle, ChevronRight, Video, MapPin, Clock,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — SE SitRep" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { sprint, todaysCheckIn, todaysAvailability, openModal, checkIns, users, issues, meetings, isAdmin } = useApp();
  const today = "2026-05-13";
  const todays = checkIns.filter((c) => c.date === today);
  const humans = users.filter((u) => !u.isAgent);
  const submittedIds = new Set(todays.map((c) => c.userId));
  const missing = humans.filter((u) => !submittedIds.has(u.id));
  const blockerIssues = issues.filter((i) => i.blocking || i.type === "Blocker");
  const urgent = issues.filter((i) => i.priority === "Critical" || i.priority === "High").filter((i) => i.status !== "Resolved").slice(0, 4);
  const nextMeeting = meetings[0];

  const riskTone: string = sprint.risk === "Medium" ? "var(--warning)" : "var(--success)";

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Sprint header */}
      <div className="rounded-2xl border border-border bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Current sprint</div>
            <h1 className="text-2xl font-semibold mt-1">{sprint.name} · {sprint.start} – {sprint.end}</h1>
            <p className="text-muted-foreground text-sm mt-1">{sprint.daysLeft} days left · keep momentum going.</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border border-border" style={{ background: `color-mix(in oklab, ${riskTone} 12%, white)`, color: riskTone }}>
              <span className="size-1.5 rounded-full" style={{ background: riskTone }} />
              Risk: {sprint.risk}
            </span>
            <span className="text-xs font-mono text-muted-foreground">Progress {sprint.progress}%</span>
          </div>
        </div>
        <Progress value={sprint.progress} className="h-2 mt-4" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar preview */}
        <Card className="lg:col-span-2" title="This week" icon={CalendarDays} action={<Link to="/sprint-calendar" className="text-xs text-primary inline-flex items-center gap-0.5 hover:underline">Open calendar <ChevronRight className="size-3" /></Link>}>
          <WeekStrip />
        </Card>

        {/* Daily check-in */}
        <Card title="Daily check-in" icon={ClipboardCheck}>
          {todaysCheckIn ? (
            <>
              <Badge tag="Checked In" />
              <p className="text-sm text-muted-foreground mt-3">Submitted today. Mood: <span className="text-foreground font-medium">{todaysCheckIn.mood}</span></p>
              <p className="text-xs text-muted-foreground mt-1">Working on: {todaysCheckIn.next}</p>
              <Button onClick={() => openModal("checkin")} variant="outline" className="w-full mt-4">Edit Check-In</Button>
            </>
          ) : (
            <>
              <Badge tag="Missing Check-In" />
              <p className="text-sm text-muted-foreground mt-3">Due by 10:00 AM</p>
              <Button onClick={() => openModal("checkin")} className="w-full mt-4 text-primary-foreground" style={{ background: "var(--gradient-brand)" }}>Submit Check-In</Button>
            </>
          )}
        </Card>

        {/* Availability */}
        <Card title="Availability" icon={CalendarClock}>
          {todaysAvailability ? (
            <>
              <Badge tag={todaysAvailability.available ? "Available" : "Unavailable"} />
              <p className="text-sm text-muted-foreground mt-3">Preferred format: <span className="text-foreground">{todaysAvailability.preferredFormat}</span></p>
              <Button onClick={() => openModal("availability")} variant="outline" className="w-full mt-4">Update</Button>
            </>
          ) : (
            <>
              <Badge tag="Missing Check-In" />
              <p className="text-sm text-muted-foreground mt-3">Survey not yet submitted today.</p>
              <Button onClick={() => openModal("availability")} className="w-full mt-4 text-primary-foreground" style={{ background: "var(--gradient-brand)" }}>Complete Availability</Button>
            </>
          )}
        </Card>

        {/* AI Async Summary */}
        <Card title="AI async summary" icon={Sparkles} accent>
          <p className="text-sm text-muted-foreground">Team mostly on track. {blockerIssues.length} blocker(s) and {missing.length} missing check-in(s).</p>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <Mini label="Submitted" value={todays.length} tone="var(--success)" />
            <Mini label="Missing" value={missing.length} tone="var(--warning)" />
            <Mini label="Blockers" value={blockerIssues.length} tone="var(--danger)" />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={() => openModal("aiSummary")} variant="outline" className="flex-1">View Updates</Button>
            {isAdmin && <Button onClick={() => openModal("aiSummary")} className="text-primary-foreground" style={{ background: "var(--gradient-brand)" }}>Send Reminder</Button>}
          </div>
        </Card>

        {/* Upcoming meeting */}
        <Card title="Upcoming meeting" icon={Clock}>
          <div className="font-medium">{nextMeeting.title}</div>
          <div className="text-xs text-muted-foreground mt-1 font-mono">{nextMeeting.date} · {nextMeeting.time}</div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {nextMeeting.format === "online" ? <Video className="size-3.5 text-muted-foreground" /> : <MapPin className="size-3.5 text-muted-foreground" />}
            <span className="text-muted-foreground capitalize">{nextMeeting.format}</span>
          </div>
          <p className="text-sm mt-3">{nextMeeting.goal}</p>
          <Button variant="outline" className="w-full mt-4">View Details</Button>
        </Card>

        {/* Reminders */}
        <Card title="Daily reminders" icon={Bell} className="lg:col-span-2">
          <ul className="divide-y divide-border -mx-1">
            {[
              { label: "Submit daily check-in", status: todaysCheckIn ? "Resolved" : "Due Soon" as const, action: () => openModal("checkin") },
              { label: "Complete availability survey", status: todaysAvailability ? "Resolved" : "Due Soon" as const, action: () => openModal("availability") },
              { label: "Sprint meeting at 2:00 PM", status: "Due Soon" as const },
              { label: "Review AI suggested tasks", status: "AI Review Needed" as const },
              { label: "Resolve high-priority blocker (staging)", status: "Critical" as const },
            ].map((r) => (
              <li key={r.label} className="px-1 py-2.5 flex items-center gap-3">
                <Badge tag={r.status} />
                <span className="text-sm flex-1 truncate">{r.label}</span>
                {r.action && <Button size="sm" variant="ghost" onClick={r.action} className="text-xs">Open</Button>}
              </li>
            ))}
          </ul>
        </Card>

        {/* Urgent issues preview */}
        <Card title="Urgent issues" icon={AlertTriangle} action={<Link to="/issues" className="text-xs text-primary inline-flex items-center gap-0.5 hover:underline">View all <ChevronRight className="size-3" /></Link>}>
          <ul className="space-y-2.5">
            {urgent.map((i) => (
              <li key={i.id} className="flex items-start gap-2">
                <Badge tag={i.priority} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{i.title}</div>
                  <div className="text-[11px] text-muted-foreground">{i.type}</div>
                </div>
              </li>
            ))}
            {urgent.length === 0 && <li className="text-sm text-muted-foreground">No urgent items 🎉</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, children, action, className = "", accent = false }: { title: string; icon: any; children: React.ReactNode; action?: React.ReactNode; className?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 ${className}`} style={{ boxShadow: "var(--shadow-card)", background: accent ? "linear-gradient(180deg, var(--purple-soft), var(--card) 60%)" : undefined }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2"><Icon className="size-4 text-muted-foreground" /> {title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-2 text-center">
      <div className="text-lg font-semibold" style={{ color: tone }}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function WeekStrip() {
  const { meetings } = useApp();
  const days = [
    { d: "Mon", n: 12, label: "May 12" },
    { d: "Tue", n: 13, label: "May 13", today: true },
    { d: "Wed", n: 14, label: "May 14" },
    { d: "Thu", n: 15, label: "May 15" },
    { d: "Fri", n: 16, label: "May 16" },
    { d: "Sat", n: 17, label: "May 17" },
    { d: "Sun", n: 18, label: "May 18" },
  ];
  const eventsFor = (n: number) => meetings.filter((m) => m.date === `2026-05-${String(n).padStart(2, "0")}`);
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((d) => {
        const evs = eventsFor(d.n);
        return (
          <div key={d.n} className={`rounded-lg border p-2 min-h-24 ${d.today ? "border-primary bg-primary/5" : "border-border bg-secondary/40"}`}>
            <div className="text-[10px] uppercase text-muted-foreground tracking-wide">{d.d}</div>
            <div className={`text-lg font-semibold ${d.today ? "text-primary" : ""}`}>{d.n}</div>
            <div className="space-y-1 mt-1">
              {evs.map((e) => (
                <div key={e.id} className="text-[10px] truncate rounded px-1.5 py-0.5" style={{ background: "var(--info-soft)", color: "var(--info)" }} title={e.title}>{e.time} {e.title}</div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
