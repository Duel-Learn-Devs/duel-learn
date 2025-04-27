import BattleInvitationCenter from './BattleInvitationCenter';
import NotificationCard from './NotificationCard';
import ActionButtons from './ActionButtons';

// Main notification component
export { BattleInvitationCenter };

// For backward compatibility
export { BattleInvitationCenter as BattleNotification };

// Individual subcomponents
export { NotificationCard as BattleNotificationCard };
export { ActionButtons as BattleActionButtons };

// Legacy support - for the old invitation system
export { NotificationCard as LobbyNotification };

// Default export
export default BattleInvitationCenter; 