import { Router } from "express";
import verifyToken from "../../utils/verifyToken";
import { createBookmark, getBookmarks, removeBookmark } from "../controllers";
const router = Router();

router
  .route("/")
  .get(verifyToken, getBookmarks)
  .post(verifyToken, createBookmark);

router.route("/:id").delete(verifyToken, removeBookmark);

export default router;
