import express from 'express';
import {
  createBattleInvitation,
  updateBattleInvitationStatus,
  getHostInfo,
  updateInvitationStatusByLobbyCode,
  getInvitationDetails,
  updateLobbySettings,
  updatePlayerReadyState,
  getReadyState,
  getLobbySettings,
  updateBattleStatus,
  getBattleStatus,
  updateDifficulty,
  getDifficulty,
  getPendingInvitations,
  createInvitation,
  updateInvitationStatus
} from '../controller/BattleInvitationController.js';

const router = express.Router();

// Battle Invitation Routes - centralized from both files
// -------------------------------------------------------

// Create a new battle invitation (two endpoints for compatibility)
router.post('/invitations-lobby', createBattleInvitation);
router.post('/invitations', createInvitation); // Legacy support

// Update battle invitation status (two endpoints for compatibility)
router.put('/invitations-lobby/:id/status', updateBattleInvitationStatus);
router.put('/invitations/status', updateInvitationStatus); // Legacy support
router.put('/invitations-lobby/status/update', updateInvitationStatusByLobbyCode);

// Get host information
router.get('/invitations-lobby/host/:sender_id', getHostInfo);

// Get invitation details
router.get('/invitations-lobby/details/:lobby_code/:sender_id/:receiver_id', getInvitationDetails);

// Get pending invitations
router.get('/invitations-lobby/pending/:userId', getPendingInvitations);

// Lobby settings and game state routes
// -------------------------------------------------------

// Update lobby settings
router.put('/invitations-lobby/settings', updateLobbySettings);
router.get('/invitations-lobby/settings/:lobby_code', getLobbySettings);

// Player ready state
router.put('/invitations-lobby/ready-state', updatePlayerReadyState);
router.get('/invitations-lobby/ready-state/:lobby_code', getReadyState);

// Battle status
router.put('/invitations-lobby/battle-status', updateBattleStatus);
router.get('/invitations-lobby/battle-status/:lobby_code', getBattleStatus);

// Difficulty settings
router.put('/invitations-lobby/difficulty', updateDifficulty);
router.get('/invitations-lobby/difficulty/:lobby_code', getDifficulty);

export default router;