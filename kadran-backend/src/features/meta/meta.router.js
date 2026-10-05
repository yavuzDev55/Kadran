// src/routes/meta.router.js
// Public endpoint — no auth required.

import { Router } from 'express';
import { TYPE_DEFAULT_COLORS, COLOR_PALETTE } from '../../config/colors.js';

const router = Router();

router.get('/colors', (req, res) => {
  res.json({
    success: true,
    data: {
      palette: COLOR_PALETTE,
      typeDefaults: TYPE_DEFAULT_COLORS,
    },
  });
});

export default router;