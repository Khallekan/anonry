import { Router } from "express";
import verifyToken from "../../utils/verifyToken";
import {
  createEntry,
  deleteEntry,
  editEntry,
  getMyEntries,
} from "../controllers";

const router = Router();

router
  .route("/")
  .get(verifyToken, getMyEntries)
  .post(verifyToken, createEntry)
  .patch(verifyToken, editEntry)
  .delete(verifyToken, deleteEntry);

export default router;
