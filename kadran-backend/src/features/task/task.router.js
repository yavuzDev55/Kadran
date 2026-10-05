// src/features/task/task.router.js

import { Router } from 'express';
import * as taskValidator from './task.validator.js';
import * as taskController from './task.controller.js';

const router = Router();
// NOT: authMiddleware server.js'te /tasks prefix'ine zaten uygulandı.
// Burada tekrar uygulamıyoruz (çift uygulama düzeltmesi).

router.get('/', taskController.listTasks);

router.get('/:id', taskController.getTask);           // ← YENİ


router.post('/', taskValidator.createTask, taskController.createTask);


router.patch('/:id', taskValidator.updateTask, taskController.updateTask);

router.delete('/:id', taskController.deleteTask);

router.patch('/:id/toggle', taskController.toggleTask);


router.post('/:id/tags', taskController.addTag);

router.delete('/:id/tags/:tagId', taskController.removeTag);

export default router;