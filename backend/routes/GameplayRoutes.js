// Add new route for fetching stored questions
router.get('/battle/stored-questions/:studyMaterialId', GameplayController.getStoredBattleQuestions); 