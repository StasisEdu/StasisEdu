import { Router, type IRouter } from "express";
import healthRouter from "./health";
import edubotRouter from "./edubot";

const router: IRouter = Router();

router.use(healthRouter);
router.use(edubotRouter);

export default router;
