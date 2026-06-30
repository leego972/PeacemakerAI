import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import admissionsRouter from "./admissions";
import casesRouter from "./cases";
import judgeRouter from "./judge";
import relationshipsRouter from "./relationships";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(admissionsRouter);
router.use(casesRouter);
router.use(judgeRouter);
router.use(relationshipsRouter);
router.use(notificationsRouter);

export default router;
