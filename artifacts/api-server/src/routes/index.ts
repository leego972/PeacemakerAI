import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import casesRouter from "./cases";
import judgeRouter from "./judge";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(casesRouter);
router.use(judgeRouter);

export default router;
