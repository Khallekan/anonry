import { Router } from "express";
import verifyToken from "../../../utils/verifyToken";
import { getUserProfile } from "../controllers";

const router = Router();

router.route("/").get(verifyToken, getUserProfile);

export default router;
