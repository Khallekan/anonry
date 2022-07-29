import { Router } from "express";
import authRouter from "../auth/routes";
import profileRouter from "../profile/routes/index";

const router = Router();

router.use("/auth", authRouter);

router.use("/profile", profileRouter);

export default router;
