// src/features/tag/tag.service.js

import { findTagsByUser, findTagById, deleteTag } from './tag.db.js';
import { AuthorizationError, NotFoundError } from '../../shared/utils/customErrors.js';

export const getTagsService = (userId, filter = null, limit = null) => {
  return findTagsByUser(userId, filter, limit);
};

export const deleteTagService = async (userId, tagId) => {
  const tag = await findTagById(tagId);

  if (!tag) throw new NotFoundError('Tag', tagId);
  if (tag.userId !== userId) throw new AuthorizationError();

  return deleteTag(tagId);
};
