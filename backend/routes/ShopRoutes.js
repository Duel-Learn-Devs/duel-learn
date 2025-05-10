import express from "express";
import ShopController from "../controller/ShopController.js";

const router = express.Router();

router.get("/items", ShopController.getShopItems);
router.get("/user-item/:firebase_uid", ShopController.getUserItem);

router.post("/buy-item", ShopController.buyShopItem);
router.post("/use-item", ShopController.useItem);
router.post('/use-tech-pass/:firebase_uid/:techPassCount', ShopController.useUserTechPass);
router.get('/user-active-items/:firebase_uid/:item_code', ShopController.getUserActiveItems);
router.put('/use-fortune-coin', ShopController.useFortuneCoins);
router.post('/deduct-tech-pass', ShopController.deductTechPassForCrossReference);

export default router;