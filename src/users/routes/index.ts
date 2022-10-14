import { Router } from "express";
import authRouter from "../../auth/routes";
import profileRouter from "../../profile/routes/index";
import verifyToken from "../../utils/verifyToken";
import { deleteUser, editUser } from "../controllers";

const router = Router();

router.patch("/", verifyToken, editUser);

router.use("/auth", authRouter);

router.use("/profile", profileRouter);

router.delete("/:id", verifyToken, deleteUser);

export default router;
