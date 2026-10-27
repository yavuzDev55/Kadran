import { TYPE_COLORS } from "./taskRules";

const STORAGE_KEY = "kadran_task_display_settings";
const DEFAULT_AVATAR_COLOR = "#3f6e7c";
const HEX_COLOR_PATTERN = /^#[\da-f]{6}$/i;

export const DISPLAY_COLOR_PALETTE = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#94a3b8",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#64748b",
  "#06b6d4",
  "#a3e635",
];

export const getTaskDisplaySettings = () => {
  const defaults = {
    avatarColor: DEFAULT_AVATAR_COLOR,
    taskColors: { ...TYPE_COLORS },
  };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved || typeof saved !== "object") return defaults;
    return {
      avatarColor: HEX_COLOR_PATTERN.test(saved.avatarColor || "")
        ? saved.avatarColor
        : defaults.avatarColor,
      taskColors: Object.fromEntries(
        Object.entries(TYPE_COLORS).map(([type, defaultColor]) => [
          type,
          HEX_COLOR_PATTERN.test(saved.taskColors?.[type] || "")
            ? saved.taskColors[type]
            : defaultColor,
        ]),
      ),
    };
  } catch {
    return defaults;
  }
};

export const saveTaskDisplaySettings = (settings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

export const getTaskTypeDisplayColor = (type) =>
  getTaskDisplaySettings().taskColors[type] || TYPE_COLORS[type] || "#94a3b8";

export const getTaskDisplayColor = (task) => {
  if (task.color) return task.color;
  if (task.effectiveColor && task.effectiveColor !== TYPE_COLORS[task.type]) {
    return task.effectiveColor;
  }
  return getTaskTypeDisplayColor(task.type);
};

export { DEFAULT_AVATAR_COLOR };
