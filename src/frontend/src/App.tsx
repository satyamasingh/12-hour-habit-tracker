import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import {
  CheckCircle2,
  Flame,
  History,
  LayoutDashboard,
  ListTodo,
  MoreVertical,
  Plus,
  Settings,
  Timer,
  User,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────
type Habit = {
  id: string;
  name: string;
  targetMinutes: number;
  category: string;
  createdAt: string;
};

type LogEntry = {
  habitId: string;
  date: string; // YYYY-MM-DD
  minutes: number;
};

type NavPage = "dashboard" | "habits" | "history" | "settings";

// ── Constants ──────────────────────────────────────────────────────────────
const GOAL_MINUTES = 720; // 12 hours
const HABITS_KEY = "habitflow_habits";
const LOGS_KEY = "habitflow_logs";

const CATEGORY_COLORS: Record<string, string> = {
  Work: "bg-blue-100 text-blue-700",
  Study: "bg-purple-100 text-purple-700",
  Health: "bg-green-100 text-green-700",
  Personal: "bg-orange-100 text-orange-700",
  Tech: "bg-cyan-100 text-cyan-700",
};

const CATEGORIES = ["Work", "Study", "Health", "Personal", "Tech"];

// ── Seed data ──────────────────────────────────────────────────────────────
const SEED_HABITS: Habit[] = [
  {
    id: "h1",
    name: "Morning Deep Work",
    targetMinutes: 180,
    category: "Work",
    createdAt: "2026-03-20",
  },
  {
    id: "h2",
    name: "Read & Study",
    targetMinutes: 120,
    category: "Study",
    createdAt: "2026-03-20",
  },
  {
    id: "h3",
    name: "Exercise",
    targetMinutes: 60,
    category: "Health",
    createdAt: "2026-03-20",
  },
  {
    id: "h4",
    name: "Code Practice",
    targetMinutes: 120,
    category: "Tech",
    createdAt: "2026-03-20",
  },
];

function generateSeedLogs(): LogEntry[] {
  const logs: LogEntry[] = [];
  const today = new Date();
  // Past 7 days including today
  for (let d = 6; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(today.getDate() - d);
    const dateStr = date.toISOString().split("T")[0];
    // Vary minutes somewhat
    const variance = d === 0 ? 0.6 : 0.75 + Math.random() * 0.35;
    logs.push({
      habitId: "h1",
      date: dateStr,
      minutes: Math.round(180 * variance),
    });
    logs.push({
      habitId: "h2",
      date: dateStr,
      minutes: Math.round(120 * variance),
    });
    logs.push({
      habitId: "h3",
      date: dateStr,
      minutes: Math.round(60 * (0.8 + Math.random() * 0.4)),
    });
    logs.push({
      habitId: "h4",
      date: dateStr,
      minutes: Math.round(120 * variance),
    });
  }
  return logs;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
}

function getStreak(habit: Habit, logs: LogEntry[]): number {
  let streak = 0;
  const today = new Date();
  for (let d = 1; d <= 365; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() - d);
    const ds = date.toISOString().split("T")[0];
    const dayLogs = logs.filter((l) => l.habitId === habit.id && l.date === ds);
    const total = dayLogs.reduce((s, l) => s + l.minutes, 0);
    if (total >= habit.targetMinutes) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function getTodayMinutes(habitId: string, logs: LogEntry[]): number {
  return logs
    .filter((l) => l.habitId === habitId && l.date === todayStr())
    .reduce((s, l) => s + l.minutes, 0);
}

function getTotalTodayMinutes(logs: LogEntry[]): number {
  return logs
    .filter((l) => l.date === todayStr())
    .reduce((s, l) => s + l.minutes, 0);
}

function getDayTotal(date: string, logs: LogEntry[]): number {
  return logs.filter((l) => l.date === date).reduce((s, l) => s + l.minutes, 0);
}

// ── Donut chart ─────────────────────────────────────────────────────────────
function DonutChart({ value, max }: { value: number; max: number }) {
  const r = 72;
  const cx = 90;
  const cy = 90;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const dash = pct * circ;

  return (
    <svg
      width="180"
      height="180"
      viewBox="0 0 180 180"
      role="img"
      aria-label="Today's habit progress donut chart"
    >
      {/* Track */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth="16"
      />
      {/* Progress */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#0F766E"
        strokeWidth="16"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={0}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      {/* Center text */}
      <text
        x={cx}
        y={cy - 10}
        textAnchor="middle"
        fontSize="22"
        fontWeight="700"
        fill="#111827"
      >
        {formatMinutes(value)}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="12" fill="#6B7280">
        / 12h goal
      </text>
    </svg>
  );
}

// ── Weekly bar chart ─────────────────────────────────────────────────────────
function WeeklyChart({ logs }: { logs: LogEntry[] }) {
  const days = getLast7Days();
  const totals = days.map((d) => getDayTotal(d, logs));
  const maxVal = Math.max(...totals, GOAL_MINUTES);
  const W = 340;
  const H = 140;
  const PAD_L = 36;
  const PAD_B = 28;
  const PAD_T = 10;
  const chartW = W - PAD_L - 8;
  const chartH = H - PAD_B - PAD_T;
  const barW = Math.floor((chartW / 7) * 0.6);
  const goalY = PAD_T + chartH * (1 - GOAL_MINUTES / maxVal);
  const labels = ["M", "T", "W", "T", "F", "S", "S"];
  const dayNames = days.map((d) => {
    const day = new Date(`${d}T12:00:00`).getDay(); // 0=Sun
    return ["S", "M", "T", "W", "T", "F", "S"][day];
  });
  void labels;

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Weekly progress bar chart"
    >
      {/* Y-axis ticks */}
      {[0, 4, 8, 12, 16].map((h) => {
        const y = PAD_T + chartH * (1 - (h * 60) / maxVal);
        return (
          <g key={h}>
            <line
              x1={PAD_L - 4}
              y1={y}
              x2={W - 8}
              y2={y}
              stroke="#E5E7EB"
              strokeWidth="1"
            />
            <text
              x={PAD_L - 8}
              y={y + 4}
              textAnchor="end"
              fontSize="10"
              fill="#9CA3AF"
            >
              {h}h
            </text>
          </g>
        );
      })}
      {/* Dashed goal line */}
      <line
        x1={PAD_L}
        y1={goalY}
        x2={W - 8}
        y2={goalY}
        stroke="#0F766E"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <text
        x={W - 6}
        y={goalY - 4}
        textAnchor="end"
        fontSize="9"
        fill="#0F766E"
        fontWeight="600"
      >
        12h goal
      </text>
      {/* Bars */}
      {totals.map((total, i) => {
        const slotW = chartW / 7;
        const x = PAD_L + slotW * i + (slotW - barW) / 2;
        const barH = Math.max(2, (total / maxVal) * chartH);
        const y = PAD_T + chartH - barH;
        return (
          <g key={days[i]}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx="3"
              fill="#0F766E"
              opacity="0.85"
            />
            <text
              x={x + barW / 2}
              y={H - 8}
              textAnchor="middle"
              fontSize="10"
              fill="#6B7280"
            >
              {dayNames[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const stored = localStorage.getItem(HABITS_KEY);
      return stored ? JSON.parse(stored) : SEED_HABITS;
    } catch {
      return SEED_HABITS;
    }
  });

  const [logs, setLogs] = useState<LogEntry[]>(() => {
    try {
      const stored = localStorage.getItem(LOGS_KEY);
      return stored ? JSON.parse(stored) : generateSeedLogs();
    } catch {
      return generateSeedLogs();
    }
  });

  const [page, setPage] = useState<NavPage>("dashboard");

  // Add/Edit habit modal
  const [habitModal, setHabitModal] = useState<{
    open: boolean;
    habit: Partial<Habit> | null;
  }>({ open: false, habit: null });

  // Quick log modal
  const [logModal, setLogModal] = useState<{
    open: boolean;
    habit: Habit | null;
  }>({ open: false, habit: null });
  const [logMinutes, setLogMinutes] = useState("");

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  }, [logs]);

  // ── Habit CRUD ──────────────────────────────────────────────────────────
  function openAddHabit() {
    setHabitModal({ open: true, habit: { category: "Work" } });
  }

  function openEditHabit(habit: Habit) {
    setHabitModal({ open: true, habit: { ...habit } });
  }

  function saveHabit() {
    const h = habitModal.habit;
    if (!h || !h.name?.trim()) {
      toast.error("Please enter a habit name.");
      return;
    }
    if (!h.targetMinutes || h.targetMinutes < 30 || h.targetMinutes > 720) {
      toast.error("Target must be between 0.5h and 12h.");
      return;
    }
    if (h.id) {
      setHabits((prev) => prev.map((x) => (x.id === h.id ? (h as Habit) : x)));
      toast.success("Habit updated!");
    } else {
      const newHabit: Habit = {
        id: crypto.randomUUID(),
        name: h.name.trim(),
        targetMinutes: h.targetMinutes,
        category: h.category || "Work",
        createdAt: todayStr(),
      };
      setHabits((prev) => [...prev, newHabit]);
      toast.success("Habit added!");
    }
    setHabitModal({ open: false, habit: null });
  }

  function deleteHabit(id: string) {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setLogs((prev) => prev.filter((l) => l.habitId !== id));
    setDeleteId(null);
    toast.success("Habit deleted.");
  }

  // ── Quick Log ──────────────────────────────────────────────────────────
  function openQuickLog(habit: Habit) {
    setLogModal({ open: true, habit });
    setLogMinutes("");
  }

  function saveLog() {
    const mins = Number.parseInt(logMinutes, 10);
    if (!logModal.habit || Number.isNaN(mins) || mins <= 0) {
      toast.error("Enter a valid number of minutes.");
      return;
    }
    const today = todayStr();
    setLogs((prev) => {
      const existing = prev.find(
        (l) => l.habitId === logModal.habit!.id && l.date === today,
      );
      if (existing) {
        return prev.map((l) =>
          l.habitId === logModal.habit!.id && l.date === today
            ? { ...l, minutes: l.minutes + mins }
            : l,
        );
      }
      return [
        ...prev,
        { habitId: logModal.habit!.id, date: today, minutes: mins },
      ];
    });
    toast.success(`Logged ${formatMinutes(mins)} for ${logModal.habit.name}!`);
    setLogModal({ open: false, habit: null });
  }

  // ── Computed ──────────────────────────────────────────────────────────
  const todayTotal = getTotalTodayMinutes(logs);
  const last7 = getLast7Days();

  // ── Nav items ──────────────────────────────────────────────────────────
  const navItems: { id: NavPage; label: string; Icon: React.ElementType }[] = [
    { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { id: "habits", label: "My Habits", Icon: ListTodo },
    { id: "history", label: "History", Icon: History },
    { id: "settings", label: "Settings", Icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster richColors position="top-right" />

      {/* Top App Bar */}
      <header className="fixed top-0 left-0 right-0 z-30 h-16 bg-white border-b border-border flex items-center px-6 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center">
            <Timer className="w-4 h-4 text-white" />
          </div>
          <span className="text-[18px] font-bold text-navy tracking-tight">
            HabitFlow
          </span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:block">
            Daily Goal: 12h
          </span>
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-16">
        {/* Left Sidebar */}
        <aside className="fixed left-0 top-16 bottom-0 w-56 bg-white border-r border-border z-20 flex flex-col py-4">
          <nav className="flex flex-col gap-1 px-3">
            {navItems.map(({ id, label, Icon }) => (
              <button
                key={id}
                data-ocid={`nav.${id}.link`}
                type="button"
                onClick={() => setPage(id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${
                  page === id
                    ? "bg-navy text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </nav>
          <div className="mt-auto px-3 pb-2">
            <div className="rounded-lg bg-teal-light px-3 py-3">
              <p className="text-xs font-semibold text-teal-dark">
                Today's Progress
              </p>
              <p className="text-lg font-bold text-teal mt-0.5">
                {formatMinutes(todayTotal)}
              </p>
              <p className="text-xs text-teal-dark opacity-70">of 12h goal</p>
              <div className="mt-2 h-1.5 rounded-full bg-white/60">
                <div
                  className="h-1.5 rounded-full bg-teal transition-all"
                  style={{
                    width: `${Math.min((todayTotal / GOAL_MINUTES) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="ml-56 flex-1 min-h-[calc(100vh-4rem)] flex flex-col">
          <div className="flex-1 p-6 max-w-5xl w-full mx-auto">
            {/* ── Dashboard ── */}
            {page === "dashboard" && (
              <div className="animate-fade-in">
                {/* Page header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-xl font-bold text-foreground">
                      Daily Focused Habits
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Goal: 12 Hours per day
                    </p>
                  </div>
                  <Button
                    data-ocid="dashboard.add_habit.primary_button"
                    onClick={openAddHabit}
                    className="bg-navy hover:bg-navy/90 text-white gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Habit
                  </Button>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Donut progress */}
                  <div className="bg-card rounded-xl border border-border shadow-card p-5 flex flex-col items-center">
                    <h2 className="text-sm font-semibold text-muted-foreground mb-3 self-start">
                      Today's Progress
                    </h2>
                    <DonutChart value={todayTotal} max={GOAL_MINUTES} />
                    <p className="text-sm text-muted-foreground mt-2">
                      {todayTotal >= GOAL_MINUTES
                        ? "🎉 Goal reached! Amazing work!"
                        : `${formatMinutes(GOAL_MINUTES - todayTotal)} remaining`}
                    </p>
                  </div>

                  {/* Weekly bar chart */}
                  <div className="bg-card rounded-xl border border-border shadow-card p-5">
                    <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                      Weekly Progress
                    </h2>
                    <div className="overflow-x-auto">
                      <WeeklyChart logs={logs} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Last 7 days · Dashed line = 12h goal
                    </p>
                  </div>
                </div>

                {/* Habit cards */}
                {habits.length === 0 ? (
                  <div
                    data-ocid="habits.empty_state"
                    className="text-center py-16 text-muted-foreground"
                  >
                    <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No habits yet</p>
                    <p className="text-sm mt-1">
                      Add your first habit to get started!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {habits.map((habit, idx) => {
                      const todayMins = getTodayMinutes(habit.id, logs);
                      const streak = getStreak(habit, logs);
                      const pct = Math.min(
                        (todayMins / habit.targetMinutes) * 100,
                        100,
                      );
                      return (
                        <div
                          key={habit.id}
                          data-ocid={`habit.item.${idx + 1}`}
                          className="bg-card rounded-xl border border-border shadow-card p-4 flex flex-col gap-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex flex-col gap-1.5">
                              <h3 className="font-semibold text-foreground text-[15px]">
                                {habit.name}
                              </h3>
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={`text-xs px-2 py-0.5 border-0 ${
                                    CATEGORY_COLORS[habit.category] ||
                                    "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {habit.category}
                                </Badge>
                                {streak > 0 && (
                                  <span className="flex items-center gap-1 text-xs text-orange-500 font-medium">
                                    <Flame className="w-3.5 h-3.5" />
                                    {streak} day streak
                                  </span>
                                )}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  data-ocid={`habit.dropdown_menu.${idx + 1}`}
                                  type="button"
                                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => openEditHabit(habit)}
                                >
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeleteId(habit.id)}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Progress bar */}
                          <div>
                            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                              <span>{formatMinutes(todayMins)}</span>
                              <span>
                                {formatMinutes(habit.targetMinutes)} target
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-2 rounded-full bg-teal transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-2">
                            <Button
                              data-ocid={`habit.quick_log.${idx + 1}`}
                              size="sm"
                              className="bg-teal hover:bg-teal-dark text-white flex-1 text-xs"
                              onClick={() => openQuickLog(habit)}
                            >
                              <Timer className="w-3.5 h-3.5 mr-1" />
                              Quick Log
                            </Button>
                            <Button
                              data-ocid={`habit.edit_button.${idx + 1}`}
                              size="sm"
                              variant="outline"
                              className="flex-1 text-xs"
                              onClick={() => openEditHabit(habit)}
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── My Habits ── */}
            {page === "habits" && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-xl font-bold text-foreground">
                    My Habits
                  </h1>
                  <Button
                    data-ocid="habits.add_habit.primary_button"
                    onClick={openAddHabit}
                    className="bg-navy hover:bg-navy/90 text-white gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Habit
                  </Button>
                </div>

                {habits.length === 0 ? (
                  <div
                    data-ocid="habits.empty_state"
                    className="text-center py-16 text-muted-foreground"
                  >
                    <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No habits yet</p>
                    <p className="text-sm mt-1">
                      Click "Add Habit" to create your first habit.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {habits.map((habit, idx) => {
                      const streak = getStreak(habit, logs);
                      const todayMins = getTodayMinutes(habit.id, logs);
                      return (
                        <div
                          key={habit.id}
                          data-ocid={`habits.item.${idx + 1}`}
                          className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-foreground">
                                {habit.name}
                              </span>
                              <Badge
                                className={`text-xs border-0 ${CATEGORY_COLORS[habit.category] || "bg-gray-100 text-gray-700"}`}
                              >
                                {habit.category}
                              </Badge>
                              {streak > 0 && (
                                <span className="flex items-center gap-1 text-xs text-orange-500 font-medium">
                                  <Flame className="w-3.5 h-3.5" />
                                  {streak}d
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Target: {formatMinutes(habit.targetMinutes)}/day ·
                              Today: {formatMinutes(todayMins)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              data-ocid={`habits.edit_button.${idx + 1}`}
                              size="sm"
                              variant="outline"
                              onClick={() => openEditHabit(habit)}
                            >
                              Edit
                            </Button>
                            <Button
                              data-ocid={`habits.delete_button.${idx + 1}`}
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(habit.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── History ── */}
            {page === "history" && (
              <div className="animate-fade-in">
                <h1 className="text-xl font-bold text-foreground mb-6">
                  History
                </h1>
                <div className="flex flex-col gap-4">
                  {last7
                    .slice()
                    .reverse()
                    .map((date, idx) => {
                      const dayTotal = getDayTotal(date, logs);
                      const d = new Date(`${date}T12:00:00`);
                      const label = d.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      });
                      const isGoalMet = dayTotal >= GOAL_MINUTES;
                      return (
                        <div
                          key={date}
                          data-ocid={`history.item.${idx + 1}`}
                          className="bg-card border border-border rounded-xl p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {isGoalMet ? (
                                <CheckCircle2 className="w-5 h-5 text-teal flex-shrink-0" />
                              ) : (
                                <XCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                              )}
                              <div>
                                <p className="font-semibold text-foreground text-sm">
                                  {label}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatMinutes(dayTotal)} / 12h
                                  {isGoalMet && " · Goal reached! 🎉"}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`text-sm font-bold ${
                                isGoalMet
                                  ? "text-teal"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {Math.round((dayTotal / GOAL_MINUTES) * 100)}%
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {habits.map((habit) => {
                              const mins = logs
                                .filter(
                                  (l) =>
                                    l.habitId === habit.id && l.date === date,
                                )
                                .reduce((s, l) => s + l.minutes, 0);
                              const met = mins >= habit.targetMinutes;
                              return (
                                <div
                                  key={habit.id}
                                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                                    met
                                      ? "bg-teal-light text-teal-dark"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {met ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-teal flex-shrink-0" />
                                  ) : (
                                    <XCircle className="w-3.5 h-3.5 opacity-40 flex-shrink-0" />
                                  )}
                                  <span className="truncate font-medium">
                                    {habit.name}
                                  </span>
                                  <span className="ml-auto flex-shrink-0">
                                    {formatMinutes(mins)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* ── Settings ── */}
            {page === "settings" && (
              <div className="animate-fade-in">
                <h1 className="text-xl font-bold text-foreground mb-6">
                  Settings
                </h1>
                <div className="bg-card border border-border rounded-xl p-6 max-w-md">
                  <h2 className="font-semibold text-foreground mb-1">
                    Daily Goal
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your daily focused work goal is set to{" "}
                    <strong>12 hours</strong>.
                  </p>
                  <div className="h-px bg-border my-4" />
                  <h2 className="font-semibold text-foreground mb-1">
                    Reset Data
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Clear all habits and log history. This cannot be undone.
                  </p>
                  <Button
                    data-ocid="settings.reset.delete_button"
                    variant="outline"
                    className="text-destructive hover:text-destructive border-destructive/30"
                    onClick={() => {
                      if (
                        confirm(
                          "Are you sure? This will delete all habits and logs.",
                        )
                      ) {
                        setHabits([]);
                        setLogs([]);
                        toast.success("All data cleared.");
                      }
                    }}
                  >
                    Reset All Data
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="text-center py-4 text-xs text-muted-foreground border-t border-border mt-auto">
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              caffeine.ai
            </a>
          </footer>
        </main>
      </div>

      {/* ── Add/Edit Habit Modal ── */}
      <Dialog
        open={habitModal.open}
        onOpenChange={(o) => !o && setHabitModal({ open: false, habit: null })}
      >
        <DialogContent data-ocid="habit.modal" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {habitModal.habit?.id ? "Edit Habit" : "Add New Habit"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="habit-name">Habit Name</Label>
              <Input
                id="habit-name"
                data-ocid="habit.name.input"
                placeholder="e.g. Morning Deep Work"
                value={habitModal.habit?.name || ""}
                onChange={(e) =>
                  setHabitModal((prev) => ({
                    ...prev,
                    habit: { ...prev.habit, name: e.target.value },
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="habit-target">Daily Target (minutes)</Label>
              <Input
                id="habit-target"
                data-ocid="habit.target.input"
                type="number"
                min={30}
                max={720}
                placeholder="e.g. 120"
                value={habitModal.habit?.targetMinutes || ""}
                onChange={(e) =>
                  setHabitModal((prev) => ({
                    ...prev,
                    habit: {
                      ...prev.habit,
                      targetMinutes: Number.parseInt(e.target.value, 10),
                    },
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Range: 30–720 minutes (0.5h–12h)
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <Select
                value={habitModal.habit?.category || "Work"}
                onValueChange={(val) =>
                  setHabitModal((prev) => ({
                    ...prev,
                    habit: { ...prev.habit, category: val },
                  }))
                }
              >
                <SelectTrigger data-ocid="habit.category.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="habit.modal.cancel_button"
              variant="outline"
              onClick={() => setHabitModal({ open: false, habit: null })}
            >
              Cancel
            </Button>
            <Button
              data-ocid="habit.modal.submit_button"
              className="bg-navy hover:bg-navy/90 text-white"
              onClick={saveHabit}
            >
              {habitModal.habit?.id ? "Save Changes" : "Add Habit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Quick Log Modal ── */}
      <Dialog
        open={logModal.open}
        onOpenChange={(o) => !o && setLogModal({ open: false, habit: null })}
      >
        <DialogContent data-ocid="quicklog.modal" className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Quick Log</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <p className="text-sm text-muted-foreground">
              Logging time for:{" "}
              <strong className="text-foreground">
                {logModal.habit?.name}
              </strong>
            </p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="log-minutes">Minutes spent</Label>
              <Input
                id="log-minutes"
                data-ocid="quicklog.minutes.input"
                type="number"
                min={1}
                placeholder="e.g. 45"
                value={logMinutes}
                onChange={(e) => setLogMinutes(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveLog()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="quicklog.modal.cancel_button"
              variant="outline"
              onClick={() => setLogModal({ open: false, habit: null })}
            >
              Cancel
            </Button>
            <Button
              data-ocid="quicklog.modal.submit_button"
              className="bg-teal hover:bg-teal-dark text-white"
              onClick={saveLog}
            >
              Log Time
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Modal ── */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent data-ocid="delete.dialog" className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Habit</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure? This will permanently delete the habit and all its log
            history.
          </p>
          <DialogFooter>
            <Button
              data-ocid="delete.dialog.cancel_button"
              variant="outline"
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="delete.dialog.confirm_button"
              variant="destructive"
              onClick={() => deleteId && deleteHabit(deleteId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
