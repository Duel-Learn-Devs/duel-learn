import express from 'express';
import {
    endBattle,
    initializeBattleSession,
    updateBattleSession,
    getBattleSessionState,
    getBattleEndStatus,
    getBattleEndStatusById,
    getBattleEndStatusByLobby,
    getBattleSessionWithMaterial,
    initializeBattleRounds,
    updateBattleRound,
    getBattleRound,
    initializeBattleScores,
    getBattleScores,
    updateBattleScores,
    getActiveCardEffects,
    consumeCardEffect,
    savePvpSessionReport,
    getWinStreak,
    updateWinStreak,
    checkUserBanStatus,
    checkCardBlockingEffects,
    checkMindControlEffects,
    applyPoisonEffects,
    generateBattleQuestions,
    claimBattleRewards,
    updateEnemyAnsweringQuestion,
    getEnemyAnsweringQuestion,
    deductLeaverXP
} from '../controller/GameplayController.js';

const router = express.Router();

// New routes for battle_sessions
router.post('/battle/initialize-session', initializeBattleSession);
router.put('/battle/update-session', updateBattleSession);
router.get('/battle/session-state/:lobby_code', getBattleSessionState);
router.get('/battle/session-with-material/:lobby_code', getBattleSessionWithMaterial);

// Question generation
router.post('/battle/generate-questions', generateBattleQuestions);

// Battle rounds
router.post('/battle/initialize-rounds', initializeBattleRounds);
router.put('/battle/update-round', updateBattleRound);
router.get('/battle/round/:session_uuid', getBattleRound);

// Card effects
router.get('/battle/card-effects/:session_uuid/:player_type', getActiveCardEffects);
router.post('/battle/consume-card-effect', consumeCardEffect);
router.get('/battle/card-blocking-effects/:session_uuid/:player_type', checkCardBlockingEffects);
router.get('/battle/mind-control-effects/:session_uuid/:player_type', checkMindControlEffects);
router.post('/battle/apply-poison-effects', applyPoisonEffects);


// Battle scores
router.post('/battle/initialize-scores', initializeBattleScores);
router.get('/battle/scores/:session_uuid', getBattleScores);
router.put('/battle/update-scores', updateBattleScores);

// Win streak routes
router.get('/battle/win-streak/:firebase_uid', getWinStreak);
router.put('/battle/win-streak', updateWinStreak);

// XP penalty route for early leavers
router.put('/battle/deduct-leaver-xp', deductLeaverXP);

// User ban status route
router.get('/user/ban-status/:firebase_uid', checkUserBanStatus);

// End the battle
router.post('/battle/end', endBattle);

// Check battle end status - several ways to query
router.get('/battle/end-status/:session_uuid', getBattleEndStatus);
router.get('/battle/end-status-by-id/:session_id', getBattleEndStatusById);
router.get('/battle/end-status-by-lobby/:lobby_code', getBattleEndStatusByLobby);

// Save PvP session report
router.post('/battle/save-session-report', savePvpSessionReport);

// Claim rewards from PvP battle
router.post('/battle/claim-rewards', claimBattleRewards);

// Add new routes for enemy answering question
router.put('/battle/update-enemy-question', updateEnemyAnsweringQuestion);
router.get('/battle/enemy-question/:session_uuid/:player_type', getEnemyAnsweringQuestion);


export default router; 