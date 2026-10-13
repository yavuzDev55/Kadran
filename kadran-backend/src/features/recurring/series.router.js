// src/features/recurring/series.router.js
// Mounted at /series (authMiddleware is applied in server.js).

import { Router } from 'express';
import { addTag, updateSeries, validateIdParam } from '../task/task.validator.js';
import { getSeries, updateSeries as updateSeriesController, deleteSeries, addTag as addSeriesTag } from './series.controller.js';

const router = Router();

router.param('id', validateIdParam);

router.get('/:id', getSeries);
router.patch('/:id', updateSeries, updateSeriesController);
router.delete('/:id', deleteSeries);
router.post('/:id/tags', addTag, addSeriesTag);

export default router;
