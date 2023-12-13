import { Router } from "express";
import { prompt } from "../controllers/promptController";

const router: Router = Router();

router.get("/", prompt);
router.post("/", prompt);

export default router;