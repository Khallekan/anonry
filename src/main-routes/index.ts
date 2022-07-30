import { Router } from "express";
import userRoutes from "../users/routes";
import entriesRoutes from "../entries/routes";

const router = Router();

router.use("/users", userRoutes);

router.use("/entries", entriesRoutes);

export default router;
