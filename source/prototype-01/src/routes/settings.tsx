import { createFileRoute } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — SE SitRep" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { isAdmin, users } = useApp();
  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Personal preferences and team configuration.</p>
      </div>

      <Section title="Team settings">
        <Field label="Team name"><Input defaultValue="Atlas Squad" /></Field>
        <Field label="Time zone"><Input defaultValue="America/New_York" /></Field>
      </Section>

      <Section title="Sprint settings">
        <Field label="Sprint length"><Input defaultValue="1 week" /></Field>
        <Field label="Standup time"><Input type="time" defaultValue="10:00" /></Field>
      </Section>

      <Section title="Notification settings">
        <Toggle label="Standup reminders" defaultOn />
        <Toggle label="New blockers" defaultOn />
        <Toggle label="AI agent updates" />
      </Section>

      <Section title="Role settings">
        <Toggle label="Allow members to convert issues to tasks" defaultOn />
        <Toggle label="Allow members to edit meeting times" />
      </Section>

      <Section title="AI settings">
        <Toggle label="Auto-generate daily summary" defaultOn />
        <Toggle label="Suggest meeting times" defaultOn />
        <Toggle label="Suggest sprint tasks" defaultOn />
      </Section>

      {isAdmin && (
        <Section title="Admin">
          <div className="space-y-3">
            <Field label="Manage team members">
              <div className="rounded-lg border border-border bg-card divide-y divide-border">
                {users.filter((u) => !u.isAgent).map((u) => (
                  <div key={u.id} className="flex items-center justify-between px-3 py-2">
                    <div><div className="text-sm">{u.name}</div><div className="text-xs text-muted-foreground">{u.role}</div></div>
                    <Button size="sm" variant="ghost">Edit</Button>
                  </div>
                ))}
              </div>
            </Field>
            <Toggle label="Enable AI features" defaultOn />
            <Field label="Reminder schedule"><Input defaultValue="Daily at 09:00" /></Field>
            <Field label="Sprint dates"><Input defaultValue="May 12 – May 19" /></Field>
          </div>
        </Section>
      )}

      <div className="flex justify-end">
        <Button className="text-primary-foreground" style={{ background: "var(--gradient-brand)" }}>Save changes</Button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="px-5 py-4 border-b border-border"><h2 className="font-semibold">{title}</h2></div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center"><Label className="text-sm text-muted-foreground">{label}</Label><div className="sm:col-span-2">{children}</div></div>;
}
function Toggle({ label, defaultOn }: { label: string; defaultOn?: boolean }) {
  return <div className="flex items-center justify-between"><span className="text-sm">{label}</span><Switch defaultChecked={defaultOn} /></div>;
}
