import { Router } from 'express';

import { getTimeline } from '../controller';
import verifyToken from '../../utils/verifyToken';
const router = Router();

router.get('/', verifyToken, getTimeline);

export default router;
