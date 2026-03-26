import express from "express";
import actionController from "../controller/action.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", requireAuth, actionController.create);
router.get("/partie/:idPartie", requireAuth, actionController.getByPartie);

export default router;
