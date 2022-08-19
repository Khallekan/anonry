import { Router } from "express";
import verifyToken from "../../utils/verifyToken";
import { deleteTrash, getTrash, restoreTrash } from "../controllers";

const router = Router();

router
  .route("/")
  .get(verifyToken, getTrash)
  .patch(verifyToken, restoreTrash)
  .put(verifyToken, deleteTrash);


router.route("/empty")
export default router;
