// src/features/task/task.controller.js

import {
  getTasksService,
  createTaskService,
  updateTaskService,
  deleteTaskService,
  toggleTaskService,
  addTagsToTaskService,
  removeTagFromTaskService,
} from './task.service.js';

export const getTasks = async (req, res, next) => {
  try {
    const result = await getTasksService(req.user.id, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const task = await createTaskService(req.user.id, req.body);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const task = await updateTaskService(req.user.id, req.params.id, req.body);
    res.json(task);
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    await deleteTaskService(req.user.id, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const toggleTask = async (req, res, next) => {
  try {
    const task = await toggleTaskService(req.user.id, req.params.id);
    res.json(task);
  } catch (error) {
    next(error);
  }
};

export const addTagsToTask = async (req, res, next) => {
  try {
    const task = await addTagsToTaskService(req.user.id, req.params.id, req.body.tagNames);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

export const removeTagFromTask = async (req, res, next) => {
  try {
    await removeTagFromTaskService(req.user.id, req.params.id, req.params.tagId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};