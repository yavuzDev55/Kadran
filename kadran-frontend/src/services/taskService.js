// src/services/taskService.js
// Small task-related API calls shared by several pages.

import api from "./api";

/** Pin or unpin a task. PATCH accepts partial bodies, so only isPinned is sent. */
export const setTaskPinned = (taskId, isPinned) =>
  api.patch(`/tasks/${taskId}`, { isPinned });
