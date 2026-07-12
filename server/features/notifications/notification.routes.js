import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Unread notification count endpoint placeholder' });
});

export default router;
