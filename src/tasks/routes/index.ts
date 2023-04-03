import { Router } from 'express';

import {
  createTask,
  deleteSingleTask,
  deleteTasks,
  getAllTasks,
  getSingleTask,
  updateSingleTask,
} from '../controllers';
import verifyToken from '../../utils/verifyToken';

const router = Router();

router
  .route('/')
  .post(verifyToken, createTask)
  .get(verifyToken, getAllTasks)
  .delete(verifyToken, deleteTasks);

router
  .route('/:id')
  .patch(verifyToken, updateSingleTask)
  .get(verifyToken, getSingleTask)
  .delete(verifyToken, deleteSingleTask);

export default router;
