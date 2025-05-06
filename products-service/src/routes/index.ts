import { Router } from "express";
import categoryRoutes from "./category.routes";
import productRoutes from "./product.routes";
import statsRoutes from "./stats.routes";

const router = Router();

// Mount routes
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/stats", statsRoutes);

export default router;
