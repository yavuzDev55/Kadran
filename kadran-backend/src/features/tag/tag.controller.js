// src/features/tag/tag.controller.js

import {
  getTagsService,
  addTagsToTaskService,
  removeTagFromTaskService,
  deleteTagService,
} from './tag.service.js';

export const getTags = async (req, res, next) => {
  try {
    const tags = await getTagsService(req.user.id);
    res.json({ tags });
  } catch (error) {
    next(error);
  }
};

export const deleteTag = async (req, res, next) => {
  try {
    await deleteTagService(req.user.id, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};