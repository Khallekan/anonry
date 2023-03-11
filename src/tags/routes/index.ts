import { Router } from 'express';

import { createTag, getAllTags } from '../controllers';
import verifyToken from '../../utils/verifyToken';

const router = Router();

router.route('/').post(verifyToken, createTag).get(verifyToken, getAllTags);

export default router;
