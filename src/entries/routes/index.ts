import { Router } from "express";
import verifyToken from "../../utils/verifyToken";

import {
  createEntry,
  deleteEntry,
  editEntry,
  getMyEntries,
  getSingleEntry,
  publishEntry,
} from "../controllers";

const router = Router();

router
  .route("/")
  .get(verifyToken, getMyEntries)
  .post(verifyToken, createEntry)
  .patch(verifyToken, editEntry);

router
  .route("/:id")
  .get(verifyToken, getSingleEntry)
  .delete(verifyToken, deleteEntry)
  .patch(verifyToken, publishEntry);

export default router;
