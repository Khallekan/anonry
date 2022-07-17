import { Router } from "express";
import { createUser, verifyEmail } from "../controllers";

const router = Router();

router.route("/").post(createUser).patch(verifyEmail);

export default router;
