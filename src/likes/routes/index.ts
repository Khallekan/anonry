import { Router } from 'express';

import { getLikesPerUser, handleLikes } from '../controllers';
import verifyToken from '../../utils/verifyToken';

const router = Router();

router
  .route('/')
  .post(verifyToken, handleLikes)
  .get(verifyToken, getLikesPerUser);

router.route('/:user_id').get(verifyToken, getLikesPerUser);

export default router;
