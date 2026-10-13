// src/features/tag/tag.controller.js

import { getTagsService, deleteTagService } from './tag.service.js';

export const getTags = async (req, res, next) => {
  try {
    const { filter } = req.query;
    // ?limit= keeps typeahead responses small (max 50)
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 0, 0), 50) || null;
    const tags = await getTagsService(
      req.user.id,
      typeof filter === 'string' && filter.trim() ? filter : null,
      limit
    );
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