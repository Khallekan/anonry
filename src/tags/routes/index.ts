import { Router } from "express";
import verifyToken from "../../utils/verifyToken";
import { createTag, getAllTags } from "../controllers";

const router = Router();

router.route("/").post(verifyToken, createTag).get(verifyToken, getAllTags);

export default router;
