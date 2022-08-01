import { Router } from "express";
import userRoutes from "../users/routes";
import entriesRoutes from "../entries/routes";
import tagsRoutes from "../tags/routes";

const router = Router();

router.use("/users", userRoutes);

router.use("/entries", entriesRoutes);

router.use("/tags", tagsRoutes);

export default router;
