import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Badge, IconButton } from 'react-native-paper';
import { useNotifications } from '../../contexts/NotificationContext';
import { theme, spacing } from '../../theme';

interface NotificationBadgeProps {
  onPress?: () => void;
  size?: number;
  showCount?: boolean;
  style?: any;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  onPress,
  size = 24,
  showCount = true,
  style
}) => {
  const { unreadCount } = useNotifications();

  return (
    <View style={[styles.container, style]}>
      <IconButton
        icon="bell"
        size={size}
        onPress={onPress}
        iconColor={theme.colors.text}
        style={styles.iconButton}
      />
      {showCount && unreadCount > 0 && (
        <Badge 
          size={16} 
          style={styles.badge}
          contentStyle={styles.badgeContent}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  iconButton: {
    margin: 0,
  },
  badge: {
    position: 'absolute',
    top: spacing.small,
    right: spacing.small,
    backgroundColor: theme.colors.error,
  },
  badgeContent: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default NotificationBadge;
