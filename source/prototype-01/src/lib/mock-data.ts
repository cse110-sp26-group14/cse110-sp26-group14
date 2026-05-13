import type { User, CheckIn, AvailabilityResponse, Task, Issue, Meeting, AILog, Note } from "./types";

export const PROJECT = "Atlas Platform";
export const SPRINT = { name: "Sprint 2", start: "May 12", end: "May 19", daysLeft: 4, progress: 45, risk: "Medium" as const };

export const USERS: User[] = [
  { id: "maya", name: "Maya Patel", role: "Project Manager", initials: "MP" },
  { id: "alex", name: "Alex Chen", role: "Frontend", initials: "AC" },
  { id: "jordan", name: "Jordan Lee", role: "Backend", initials: "JL" },
  { id: "priya", name: "Priya Shah", role: "QA / Testing", initials: "PS" },
  { id: "sam", name: "Sam Rivera", role: "Documentation", initials: "SR" },
  { id: "testbot", name: "TestBot", role: "AI · Test generation", isAgent: true, initials: "TB" },
  { id: "reviewbot", name: "ReviewBot", role: "AI · Code review", isAgent: true, initials: "RB" },
  { id: "plannerbot", name: "PlannerBot", role: "AI · Sprint planning", isAgent: true, initials: "PB" },
];

const today = "2026-05-13";

export const initialCheckIns: CheckIn[] = [
  { id: "c1", userId: "maya", date: today, worked: "Drafted sprint retro", next: "Lead standup", blocked: false, needsHelp: false, mood: "Good", available: true, needsCoverage: false },
  { id: "c2", userId: "alex", date: today, worked: "Settings UI polish", next: "Wire integrations", blocked: false, needsHelp: false, mood: "Great", available: true, needsCoverage: false },
  { id: "c3", userId: "priya", date: today, worked: "Regression suite", next: "File 3 bugs", blocked: true, blocker: "Staging env down", needsHelp: true, mood: "Stressed", available: true, needsCoverage: false },
];

export const initialAvailability: AvailabilityResponse[] = [
  { id: "a1", userId: "maya", date: today, available: true, blocks: [], preferredFormat: "online", canCover: true, needsCoverage: false },
  { id: "a2", userId: "alex", date: today, available: true, blocks: [], preferredFormat: "hybrid", canCover: false, needsCoverage: false },
];

export const initialTasks: Task[] = [
  { id: "t1", title: "Implement OAuth redirect handler", description: "Finish Google + GitHub providers", priority: "High", status: "In Progress", ownerId: "alex", sprint: "Sprint 2", dueDate: "2026-05-16", aiSuggested: false, notes: [] },
  { id: "t2", title: "Migrate billing schema to v3", description: "Plan window with DBA", priority: "Critical", status: "Blocked", ownerId: "jordan", sprint: "Sprint 2", dueDate: "2026-05-15", aiSuggested: false, notes: [] },
  { id: "t3", title: "Author onboarding docs", description: "Cover first-run flow", priority: "Medium", status: "In Sprint", ownerId: "sam", sprint: "Sprint 2", dueDate: "2026-05-19", aiSuggested: false, notes: [] },
  { id: "t4", title: "Add E2E tests for checkout", description: "Playwright coverage", priority: "Medium", status: "Ready", ownerId: "priya", sprint: "Sprint 2", aiSuggested: true, notes: [] },
  { id: "t5", title: "Refactor toast provider", description: "Move to global context", priority: "Low", status: "Backlog", sprint: "Sprint 3", aiSuggested: false, notes: [] },
  { id: "t6", title: "Investigate flaky payment test", description: "Intermittent failures in CI", priority: "High", status: "Backlog", ownerId: "priya", sprint: "Sprint 3", aiSuggested: false, notes: [] },
  { id: "t7", title: "Generate API reference", description: "Auto-build from OpenAPI", priority: "Low", status: "Done", ownerId: "sam", sprint: "Sprint 1", aiSuggested: false, notes: [] },
];

export const initialIssues: Issue[] = [
  { id: "i1", title: "Staging environment is down", description: "All endpoints 502 since 09:00", type: "Blocker", priority: "Critical", status: "Open", reporterId: "priya", assigneeId: "jordan", sprint: "Sprint 2", createdAt: "2026-05-13", dueDate: "2026-05-13", notes: [], blocking: true },
  { id: "i2", title: "Settings flow design review", description: "Empty states need approval", type: "Process Issue", priority: "Medium", status: "In Progress", reporterId: "alex", assigneeId: "maya", sprint: "Sprint 2", createdAt: "2026-05-12", notes: [] },
  { id: "i3", title: "Apple Connect cert expired", description: "Cannot push test builds", type: "Bug", priority: "High", status: "Open", reporterId: "sam", sprint: "Sprint 2", createdAt: "2026-05-11", notes: [] },
  { id: "i4", title: "Standup notes missing template", description: "Add new template", type: "Report", priority: "Low", status: "Resolved", reporterId: "maya", sprint: "Sprint 1", createdAt: "2026-05-08", notes: [] },
];

export const initialMeetings: Meeting[] = [
  { id: "m1", title: "Sprint Standup", date: "2026-05-13", time: "10:00", format: "online", location: "https://meet.example/sitrep", goal: "Daily sync, surface blockers", attendees: ["maya", "alex", "jordan", "priya", "sam"], sprint: "Sprint 2", relatedTaskIds: ["t1", "t2"] },
  { id: "m2", title: "Sprint Review", date: "2026-05-19", time: "14:00", format: "hybrid", location: "Room 4B / meet.example/review", goal: "Demo shipped work", attendees: ["maya", "alex", "jordan", "priya", "sam"], sprint: "Sprint 2", relatedTaskIds: [] },
  { id: "m3", title: "Backend pairing", date: "2026-05-15", time: "13:00", format: "online", location: "https://meet.example/pair", goal: "Pair on schema migration", attendees: ["jordan", "priya"], sprint: "Sprint 2", relatedTaskIds: ["t2"] },
];

export const initialAILogs: AILog[] = [
  { id: "ai1", type: "AI Summary Generated", timestamp: "2026-05-13T09:30", inputSource: "3 check-ins", outputSummary: "Team mostly on track; 1 blocker on staging env.", approval: "Approved", reviewer: "Maya Patel", linkedTaskIds: [], linkedEventIds: [] },
  { id: "ai2", type: "AI Sprint Tasks Suggested", timestamp: "2026-05-12T17:10", inputSource: "Goal: ship onboarding v2", outputSummary: "5 tasks generated, 3 added to backlog.", approval: "Applied", reviewer: "Maya Patel", linkedTaskIds: ["t4"], linkedEventIds: [] },
  { id: "ai3", type: "AI Meeting Time Suggested", timestamp: "2026-05-12T11:00", inputSource: "Availability grid", outputSummary: "Best slot: Wed 2 PM (4/5 available).", approval: "Pending Review", linkedTaskIds: [], linkedEventIds: ["m2"] },
  { id: "ai4", type: "AI Reminder Sent", timestamp: "2026-05-13T08:45", inputSource: "Missing check-ins", outputSummary: "Pinged Jordan, Sam to submit check-in.", approval: "Approved", reviewer: "Maya Patel", linkedTaskIds: [], linkedEventIds: [] },
];

export const initialNotes: Note[] = [];
