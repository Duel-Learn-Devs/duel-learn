import express from 'express';
import SearchController from '../controller/SearchController.js';


const router = express.Router();


router.get('/global/:query', SearchController.globalSearch);
router.get('/users/:query', SearchController.searchUsers);
router.get('/materials/:query', SearchController.searchStudyMaterials);
router.get('/material-of-user/:username', SearchController.getUserWithMaterials);
router.get('/friendship-status/:currentUserId/:targetUserId', SearchController.checkFriendshipStatus);
router.get("/get-user/:userId", SearchController.getUserById);


export default router;