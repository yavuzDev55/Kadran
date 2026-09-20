// src/features/task/task.router.js

import { Router } from 'express';
import {
  validateCreateTask,
  validateUpdateTask,
  validateTaskId,
  validateTaskTagParams,
} from './task.validator.js';
import { validateTagNames } from '../tag/tag.validator.js';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleTask,
  addTagsToTask,
  removeTagFromTask,
} from './task.controller.js';

const router = Router();

// GET /tasks
router.get('/', getTasks);

// POST /tasks
router.post('/', validateCreateTask, createTask);

// PATCH /tasks/:id
router.patch('/:id', validateTaskId, validateUpdateTask, updateTask);

// DELETE /tasks/:id
router.delete('/:id', validateTaskId, deleteTask);

// PATCH /tasks/:id/toggle
router.patch('/:id/toggle', validateTaskId, toggleTask);

// POST /tasks/:id/tags
router.post('/:id/tags', validateTaskId, validateTagNames, addTagsToTask);

// DELETE /tasks/:id/tags/:tagId
router.delete('/:id/tags/:tagId', validateTaskTagParams, removeTagFromTask);

export default router;