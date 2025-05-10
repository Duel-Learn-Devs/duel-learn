import express from 'express';
import ManaController from '../controller/ManaController.js';

const router = express.Router();

router.post('/reduce', ManaController.userManaReduction);
router.post('/replenish', ManaController.replenishMana);

router.get('/details/:firebase_uid', ManaController.getManaDetails);
router.get('/:firebase_uid', ManaController.getUserMana);

export default router;