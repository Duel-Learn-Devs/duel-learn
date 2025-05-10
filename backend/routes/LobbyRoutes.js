import express from 'express';
import * as LobbyController from '../controller/LobbyController.js';

const router = express.Router();

// Create a new lobby
router.post('/create', LobbyController.createLobby);

router.get('/invite-friends/:firebase_uid', LobbyController.getFriendsList);

// Validate a lobby code
router.get('/validate/:lobbyCode', LobbyController.validateLobby);

// Join a lobby
router.post('/join', LobbyController.joinLobby);

// Update lobby settings
router.put('/settings', LobbyController.updateSettings);

// Update lobby status
router.put('/status', LobbyController.updateStatus);

// Set player ready status
router.put('/ready', LobbyController.setReady);

// Get lobby details
router.get('/:lobbyCode', LobbyController.getLobbyDetails);

router.post('/battle/invitations-lobby/update-or-create', LobbyController.updateOrCreateBattleInvitation);

// Add to lobby.routes.js
router.post('/leave', LobbyController.leaveLobby);

export default router;