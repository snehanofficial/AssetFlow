import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Dashboard metrics overview endpoint placeholder' });
});

export default router;
