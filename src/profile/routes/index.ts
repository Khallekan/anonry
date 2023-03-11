import { Router } from 'express';

import { getUserProfile } from '../controllers';
import verifyToken from '../../utils/verifyToken';

const router = Router();

router.route('/').get(verifyToken, getUserProfile);

export default router;
