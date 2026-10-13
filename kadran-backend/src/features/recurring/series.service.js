// src/features/recurring/series.service.js
// Operations on a whole series (all occurrences at once). Single occurrences are handled by
// the task service.

import { findSeriesById, deleteSeries, addTagToSeries } from './recurring.db.js';
import { updateSeriesTasks } from '../task/task.db.js';
import { findOrCreateTag } from '../tag/tag.db.js';
import { serializeTask } from '../task/task.service.js';
import { AuthorizationError, NotFoundError } from '../../shared/utils/customErrors.js';
import { toDateStr } from '../../shared/utils/dateUtils.js';

// Fields shared by every occurrence. Type and time model are fixed once a series exists.
const SERIES_EDITABLE = ['title', 'description', 'priority', 'color', 'isCompletable', 'isPinned'];

const assertSeriesOwnership = async (userId, seriesId) => {
  const series = await findSeriesById(seriesId);
  if (!series) throw new NotFoundError('Series', seriesId);
  if (series.userId !== userId) throw new AuthorizationError('You do not have access to this series');
  return series;
};

const serializeSeries = (series) => ({
  id: series.id,
  pattern: series.pattern,
  startDate: toDateStr(series.startDate),
  endDate: toDateStr(series.endDate),
  weekDays: series.weekDays ? series.weekDays.split(',') : [],
  monthDay: series.monthDay,
  tasks: series.tasks.map(serializeTask),
});

export const getSeriesService = async (userId, seriesId) =>
  serializeSeries(await assertSeriesOwnership(userId, seriesId));

export const updateSeriesService = async (userId, seriesId, body) => {
  await assertSeriesOwnership(userId, seriesId);

  const data = {};
  SERIES_EDITABLE.forEach((key) => {
    if (body[key] !== undefined) data[key] = body[key];
  });
  if (typeof data.title === 'string') data.title = data.title.trim();
  if (data.description === '') data.description = null;

  await updateSeriesTasks(seriesId, data);
  return serializeSeries(await findSeriesById(seriesId));
};

export const deleteSeriesService = async (userId, seriesId) => {
  await assertSeriesOwnership(userId, seriesId);
  await deleteSeries(seriesId); // occurrences and their tag links cascade
};

export const addTagToSeriesService = async (userId, seriesId, tagName) => {
  await assertSeriesOwnership(userId, seriesId);
  const tag = await findOrCreateTag(userId, tagName);
  await addTagToSeries(seriesId, tag.id);
  return serializeSeries(await findSeriesById(seriesId));
};
