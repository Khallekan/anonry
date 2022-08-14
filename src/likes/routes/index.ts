import { Router } from "express";
import verifyToken from "../../utils/verifyToken";
import { handleLikes } from "../controllers";

const router = Router();

router.route("/").post(verifyToken, handleLikes)

export default router;