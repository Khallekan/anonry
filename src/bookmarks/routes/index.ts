import { Router } from 'express';

import { createBookmark, getBookmarks, removeBookmark } from '../controllers';
import verifyToken from '../../utils/verifyToken';
const router = Router();

router
  .route('/')
  .get(verifyToken, getBookmarks)
  .post(verifyToken, createBookmark);

router.route('/:id').delete(verifyToken, removeBookmark);

export default router;
