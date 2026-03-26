import express from "express";
import statsController from "../controller/stats.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/globales", requireAuth, statsController.getGlobalStats);
router.get("/joueur/:id", requireAuth, statsController.getJoueurStats);

export default router;
