import { Router } from "express";
import verifyToken from "../../utils/verifyToken";
import { createTag } from "../controllers";

const router = Router();

router.route("/").post(verifyToken, createTag);

export default router;
