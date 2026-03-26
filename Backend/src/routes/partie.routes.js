import express from "express";
import partieController from "../controller/partie.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", requireAuth, partieController.getAll);
router.post("/", requireAuth, partieController.create);
router.get("/joueur/:idJoueur", requireAuth, partieController.getByJoueur);
router.get("/:id", requireAuth, partieController.getById);

export default router;
