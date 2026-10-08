export interface SubStep {
  id: string;
  title: string;
  completed: boolean;
  imageUrl?: string; // Base64 DataURI or fallback placeholder ID
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number; // For the visual timer
  imageUrl?: string; // Base64 DataURI or fallback illustration name
  iconName?: string; // Fallback lucide icon
  steps: SubStep[];
  scheduleType?: "fixed" | "custom"; // fixed = all days, custom = specific days
  daysOfWeek?: number[]; // [0..6] (0 = Sunday, 1 = Monday, etc.)
}

export interface ChoicePair {
  id: string;
  label: string; // e.g., "Rotina da Manhã", "Após a Escola"
  taskAId: string; // ID of Task A
  taskBId: string; // ID of Task B
  active: boolean; // Is this currently the pair presented to the child?
}

export interface Alarm {
  id: string;
  taskTitle: string;
  taskId: string;
  time: string; // "HH:MM"
  earlyWarningMinutes: number; // e.g., 15 (warn 15 mins before)
  active: boolean;
  repeatDays: number[]; // 0 = Sunday, 1 = Monday, etc.
}

export interface RoutineLog {
  id: string;
  timestamp: string; // Date string
  taskTitle: string;
  durationSeconds: number; // Actual time spent on the task
  status: "completed" | "paused" | "skipped";
  stepsProgress: string; // e.g. "3/3 steps"
}

export interface SystemState {
  tasks: Task[];
  choicePairs: ChoicePair[];
  alarms: Alarm[];
  logs: RoutineLog[];
  currentMode: "child" | "family";
}
