import { Router } from "express";
import verifyToken from "../../utils/verifyToken";
import {
  deleteAll,
  deleteTrash,
  getTrash,
  restoreAll,
  restoreTrash,
} from "../controllers";

const router = Router();

router
  .route("/")
  .get(verifyToken, getTrash)
  .patch(verifyToken, restoreTrash)
  .delete(verifyToken, deleteTrash);

router
  .route("/empty")
  .patch(verifyToken, restoreAll)
  .delete(verifyToken, deleteAll);
export default router;
