import { Router } from "express";
import verifyToken from "../../utils/verifyToken";
import { getLikesPerUser, handleLikes } from "../controllers";

const router = Router();

router
  .route("/")
  .post(verifyToken, handleLikes)
  .get(verifyToken, getLikesPerUser);

router.route("/:user_id").get(verifyToken, getLikesPerUser);

export default router;
