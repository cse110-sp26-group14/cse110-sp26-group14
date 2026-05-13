import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  USERS, PROJECT, SPRINT,
  initialCheckIns, initialAvailability, initialTasks,
  initialIssues, initialMeetings, initialAILogs, initialNotes,
} from "./mock-data";
import type { CheckIn, AvailabilityResponse, Task, Issue, Meeting, AILog, Note, Role } from "./types";

export type ModalKind =
  | "checkin" | "availability" | "createIssue" | "addNote"
  | "aiSummary" | "aiSuggest" | null;

interface ModalState { kind: ModalKind; payload?: any; }

interface AppCtx {
  project: string;
  sprint: typeof SPRINT;
  users: typeof USERS;
  currentUserId: string;
  setCurrentUserId: (id: string) => void;
  role: Role;
  setRole: (r: Role) => void;
  isAdmin: boolean;

  checkIns: CheckIn[];
  addCheckIn: (c: Omit<CheckIn, "id" | "date" | "userId">) => void;
  todaysCheckIn: CheckIn | undefined;

  availability: AvailabilityResponse[];
  addAvailability: (a: Omit<AvailabilityResponse, "id" | "date" | "userId">) => void;
  todaysAvailability: AvailabilityResponse | undefined;

  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  addTask: (t: Partial<Task>) => void;

  issues: Issue[];
  addIssue: (i: Partial<Issue>) => void;

  meetings: Meeting[];
  aiLogs: AILog[];
  addAILog: (l: Partial<AILog>) => void;

  notes: Note[];
  addNote: (n: Omit<Note, "id" | "createdAt">) => void;

  modal: ModalState;
  openModal: (kind: ModalKind, payload?: any) => void;
  closeModal: () => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUserId, setCurrentUserId] = useState("maya");
  const [role, setRole] = useState<Role>("Admin");
  const [checkIns, setCheckIns] = useState<CheckIn[]>(initialCheckIns);
  const [availability, setAvailability] = useState<AvailabilityResponse[]>(initialAvailability);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [meetings] = useState<Meeting[]>(initialMeetings);
  const [aiLogs, setAILogs] = useState<AILog[]>(initialAILogs);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [modal, setModal] = useState<ModalState>({ kind: null });

  const today = "2026-05-13";

  const value = useMemo<AppCtx>(() => ({
    project: PROJECT,
    sprint: SPRINT,
    users: USERS,
    currentUserId, setCurrentUserId,
    role, setRole,
    isAdmin: role === "Admin",

    checkIns,
    addCheckIn: (c) => setCheckIns((prev) => [
      ...prev.filter((x) => !(x.userId === currentUserId && x.date === today)),
      { ...c, id: crypto.randomUUID(), userId: currentUserId, date: today },
    ]),
    todaysCheckIn: checkIns.find((c) => c.userId === currentUserId && c.date === today),

    availability,
    addAvailability: (a) => setAvailability((prev) => [
      ...prev.filter((x) => !(x.userId === currentUserId && x.date === today)),
      { ...a, id: crypto.randomUUID(), userId: currentUserId, date: today },
    ]),
    todaysAvailability: availability.find((a) => a.userId === currentUserId && a.date === today),

    tasks, setTasks,
    addTask: (t) => setTasks((prev) => [
      { id: crypto.randomUUID(), title: "Untitled task", description: "", priority: "Medium", status: "Backlog", sprint: SPRINT.name, aiSuggested: false, notes: [], ...t } as Task,
      ...prev,
    ]),

    issues,
    addIssue: (i) => setIssues((prev) => [
      { id: crypto.randomUUID(), title: "Untitled issue", description: "", type: "Bug", priority: "Medium", status: "Open", reporterId: currentUserId, sprint: SPRINT.name, createdAt: today, notes: [], ...i } as Issue,
      ...prev,
    ]),

    meetings,
    aiLogs,
    addAILog: (l) => setAILogs((prev) => [
      { id: crypto.randomUUID(), type: "AI Summary Generated", timestamp: new Date().toISOString(), inputSource: "", outputSummary: "", approval: "Pending Review", linkedTaskIds: [], linkedEventIds: [], ...l } as AILog,
      ...prev,
    ]),

    notes,
    addNote: (n) => setNotes((prev) => [
      { ...n, id: crypto.randomUUID(), createdAt: today },
      ...prev,
    ]),

    modal,
    openModal: (kind, payload) => setModal({ kind, payload }),
    closeModal: () => setModal({ kind: null }),
  }), [currentUserId, role, checkIns, availability, tasks, issues, meetings, aiLogs, notes, modal]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
