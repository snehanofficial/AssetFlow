import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Allocation list endpoint placeholder' });
});

export default router;
