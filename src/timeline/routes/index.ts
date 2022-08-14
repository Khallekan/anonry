import { Router } from "express";
import verifyToken from "../../utils/verifyToken";
import { getTimeline } from "../controller";
const router = Router();

router.get("/", verifyToken, getTimeline);

export default router;
