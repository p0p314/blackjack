import express from "express";
import joueurController from "../controller/joueur.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", requireAuth, joueurController.getAll);
router.get("/classement", requireAuth, joueurController.getClassement);
router.get("/:id", requireAuth, joueurController.getById);
router.get("/:id/parties", requireAuth, joueurController.getPartiesByJoueur);

export default router;
