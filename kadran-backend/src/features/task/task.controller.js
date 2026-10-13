// src/features/task/task.controller.js

import * as taskService from './task.service.js';

export const getTask = async (req, res, next) => {
  try {
    const task = await taskService.getTask(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const { task, warnings, series } = await taskService.createTask(
      req.user.id,
      req.body,
      req.taskWarnings || []
    );
    // For a recurring task `data` is its first occurrence and `meta.series` describes the series
    res.status(201).json({ success: true, data: task, meta: { series }, warnings });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { task, warnings } = await taskService.updateTask(req.user.id, req.params.id, req.body);
    res.status(200).json({ success: true, data: task, warnings });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    await taskService.deleteTask(req.user.id, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const toggleTask = async (req, res, next) => {
  try {
    const result = await taskService.toggleTask(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: result.task, meta: { completed: result.completed } });
  } catch (error) {
    next(error);
  }
};

export const listTasks = async (req, res, next) => {
  try {
    const { tasks, total, hasMore } = await taskService.listTasks(req.user.id, req.taskFilters);
    res.status(200).json({ success: true, data: tasks, meta: { total, hasMore } });
  } catch (error) {
    next(error);
  }
};

export const addTag = async (req, res, next) => {
  try {
    const task = await taskService.addTagToTask(req.user.id, req.params.id, req.body.name);
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

export const removeTag = async (req, res, next) => {
  try {
    const task = await taskService.removeTagFromTask(req.user.id, req.params.id, req.params.tagId);
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};
