import { TYPE_COLORS } from "./taskRules";

const STORAGE_KEY = "kadran_task_display_settings";
const DEFAULT_AVATAR_COLOR = "#2463a6";
const HEX_COLOR_PATTERN = /^#[\da-f]{6}$/i;

// Same palette as the task form and the backend (GET /meta/colors): the Design Tools reference.
export const DISPLAY_COLOR_PALETTE = [
  "#2463a6",
  "#c23b3b",
  "#27864b",
  "#8a4fb0",
  "#007c78",
  "#d46a1f",
  "#b12f72",
  "#5d6675",
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
  getTaskDisplaySettings().taskColors[type] || TYPE_COLORS[type] || "#8a4fb0";

export const getTaskDisplayColor = (task) => {
  if (task.color) return task.color;
  if (task.effectiveColor && task.effectiveColor !== TYPE_COLORS[task.type]) {
    return task.effectiveColor;
  }
  return getTaskTypeDisplayColor(task.type);
};

export { DEFAULT_AVATAR_COLOR };
