// src/features/tag/tag.service.js

import {
  findTagsByUser,
  findTagById,
  findOrCreateTag,
  addTagToTask,
  removeTagFromTask,
  deleteTag,
} from './tag.db.js';
import { AuthorizationError, NotFoundError } from '../../shared/utils/customErrors.js';

export const getTagsService = (userId) => {
  return findTagsByUser(userId);
};

export const addTagsToTaskService = async (userId, taskId, tagNames) => {
  for (const name of tagNames) {
    const tag = await findOrCreateTag(userId, name.trim().toLowerCase());
    await addTagToTask(taskId, tag.id);
  }
};

export const removeTagFromTaskService = (taskId, tagId) => {
  return removeTagFromTask(taskId, tagId);
};

export const deleteTagService = async (userId, tagId) => {
  const tag = await findTagById(tagId);

  if (!tag) throw new NotFoundError('Tag', tagId);
  if (tag.userId !== userId) throw new AuthorizationError();

  return deleteTag(tagId);
};