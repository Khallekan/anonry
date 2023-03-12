import { Router } from 'express';

import {
  deleteAll,
  deleteTrash,
  getTrash,
  restoreAll,
  restoreTrash,
} from '../controllers';
import verifyToken from '../../utils/verifyToken';

const router = Router();

router
  .route('/')
  .get(verifyToken, getTrash)
  .patch(verifyToken, restoreTrash)
  .delete(verifyToken, deleteTrash);

router
  .route('/empty')
  .patch(verifyToken, restoreAll)
  .delete(verifyToken, deleteAll);
export default router;
