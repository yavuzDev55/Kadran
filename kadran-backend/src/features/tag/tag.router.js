// src/features/tag/tag.router.js

import { Router } from 'express';
import { validateTagId } from './tag.validator.js';
import { getTags, deleteTag } from './tag.controller.js';

const router = Router();

// GET /tags
router.get('/', getTags);

// DELETE /tags/:id
router.delete('/:id', validateTagId, deleteTag);

export default router;