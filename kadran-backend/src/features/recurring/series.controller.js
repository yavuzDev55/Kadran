// src/features/recurring/series.controller.js

import {
  getSeriesService,
  updateSeriesService,
  deleteSeriesService,
  addTagToSeriesService,
} from './series.service.js';

export const getSeries = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: await getSeriesService(req.user.id, req.params.id) });
  } catch (error) {
    next(error);
  }
};

export const updateSeries = async (req, res, next) => {
  try {
    const series = await updateSeriesService(req.user.id, req.params.id, req.body);
    res.status(200).json({ success: true, data: series });
  } catch (error) {
    next(error);
  }
};

export const deleteSeries = async (req, res, next) => {
  try {
    await deleteSeriesService(req.user.id, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const addTag = async (req, res, next) => {
  try {
    const series = await addTagToSeriesService(req.user.id, req.params.id, req.body.name);
    res.status(200).json({ success: true, data: series });
  } catch (error) {
    next(error);
  }
};
