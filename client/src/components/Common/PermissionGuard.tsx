import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, IconButton } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../utils/permissions';
import { theme, spacing, typography } from '../../theme';

interface PermissionGuardProps {
  resource: string;
  action: string;
  children: ReactNode;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
  fallbackMessage?: string;
}

interface PermissionGuardMultipleProps {
  permissions: Array<{
    resource: string;
    action: string;
  }>;
  children: ReactNode;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
  fallbackMessage?: string;
  requireAll?: boolean; // true = all permissions required, false = any permission
}

interface RoleGuardProps {
  roles: string[];
  children: ReactNode;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
  fallbackMessage?: string;
}

/**
 * PermissionGuard - Renders content only if user has specific permission
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  resource,
  action,
  children,
  fallback,
  showAccessDenied = false,
  fallbackMessage = 'You do not have permission to view this content',
}) => {
  const { user } = useAuth();
  const permissions = usePermissions(user);

  const hasPermission = permissions.canPerformAction(resource, action);

  if (hasPermission) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showAccessDenied) {
    return (
      <Card style={styles.accessDeniedCard}>
        <Card.Content style={styles.accessDeniedContent}>
          <IconButton
            icon="lock"
            size={32}
            iconColor={theme.colors.error}
            style={styles.accessDeniedIcon}
          />
          <Text style={styles.accessDeniedTitle}>Access Denied</Text>
          <Text style={styles.accessDeniedMessage}>{fallbackMessage}</Text>
          <Text style={styles.accessDeniedSubtext}>
            Required permission: {action} {resource}
          </Text>
        </Card.Content>
      </Card>
    );
  }

  return null;
};

/**
 * PermissionGuardMultiple - Renders content based on multiple permissions
 */
export const PermissionGuardMultiple: React.FC<PermissionGuardMultipleProps> = ({
  permissions: requiredPermissions,
  children,
  fallback,
  showAccessDenied = false,
  fallbackMessage = 'You do not have the required permissions to view this content',
  requireAll = false,
}) => {
  const { user } = useAuth();
  const permissions = usePermissions(user);

  let hasPermission: boolean;

  if (requireAll) {
    // All permissions required
    hasPermission = requiredPermissions.every(({ resource, action }) =>
      permissions.canPerformAction(resource, action)
    );
  } else {
    // Any permission required
    hasPermission = requiredPermissions.some(({ resource, action }) =>
      permissions.canPerformAction(resource, action)
    );
  }

  if (hasPermission) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showAccessDenied) {
    const permissionText = requireAll ? 'all' : 'any';
    const permissionsList = requiredPermissions
      .map(({ resource, action }) => `${action} ${resource}`)
      .join(requireAll ? ' AND ' : ' OR ');

    return (
      <Card style={styles.accessDeniedCard}>
        <Card.Content style={styles.accessDeniedContent}>
          <IconButton
            icon="lock"
            size={32}
            iconColor={theme.colors.error}
            style={styles.accessDeniedIcon}
          />
          <Text style={styles.accessDeniedTitle}>Access Denied</Text>
          <Text style={styles.accessDeniedMessage}>{fallbackMessage}</Text>
          <Text style={styles.accessDeniedSubtext}>
            Required: {permissionText} of {permissionsList}
          </Text>
        </Card.Content>
      </Card>
    );
  }

  return null;
};

/**
 * RoleGuard - Renders content only if user has specific role(s)
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  roles,
  children,
  fallback,
  showAccessDenied = false,
  fallbackMessage = 'You do not have the required role to view this content',
}) => {
  const { user } = useAuth();
  const permissions = usePermissions(user);

  const hasRole = user && roles.includes(user.role);

  if (hasRole) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showAccessDenied) {
    return (
      <Card style={styles.accessDeniedCard}>
        <Card.Content style={styles.accessDeniedContent}>
          <IconButton
            icon="account-lock"
            size={32}
            iconColor={theme.colors.error}
            style={styles.accessDeniedIcon}
          />
          <Text style={styles.accessDeniedTitle}>Access Denied</Text>
          <Text style={styles.accessDeniedMessage}>{fallbackMessage}</Text>
          <Text style={styles.accessDeniedSubtext}>
            Required role: {roles.join(' OR ')}
          </Text>
        </Card.Content>
      </Card>
    );
  }

  return null;
};

/**
 * AdminOnly - Renders content only for admin users
 */
export const AdminOnly: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}> = ({ children, fallback, showAccessDenied }) => {
  return (
    <RoleGuard
      roles={['admin']}
      fallback={fallback}
      showAccessDenied={showAccessDenied}
      fallbackMessage="This feature is only available to administrators"
    >
      {children}
    </RoleGuard>
  );
};

/**
 * PharmacistOrAdmin - Renders content for pharmacists and admins
 */
export const PharmacistOrAdmin: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}> = ({ children, fallback, showAccessDenied }) => {
  return (
    <RoleGuard
      roles={['pharmacist', 'admin']}
      fallback={fallback}
      showAccessDenied={showAccessDenied}
      fallbackMessage="This feature requires pharmacist or administrator access"
    >
      {children}
    </RoleGuard>
  );
};

/**
 * CashierOrHigher - Renders content for cashiers, pharmacists, and admins
 */
export const CashierOrHigher: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}> = ({ children, fallback, showAccessDenied }) => {
  return (
    <RoleGuard
      roles={['cashier', 'pharmacist', 'admin']}
      fallback={fallback}
      showAccessDenied={showAccessDenied}
      fallbackMessage="This feature requires cashier or higher access"
    >
      {children}
    </RoleGuard>
  );
};

/**
 * CanCreate - Renders content if user can create the specified resource
 */
export const CanCreate: React.FC<{
  resource: string;
  children: ReactNode;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}> = ({ resource, children, fallback, showAccessDenied }) => {
  return (
    <PermissionGuard
      resource={resource}
      action="create"
      fallback={fallback}
      showAccessDenied={showAccessDenied}
      fallbackMessage={`You do not have permission to create ${resource}`}
    >
      {children}
    </PermissionGuard>
  );
};

/**
 * CanRead - Renders content if user can read the specified resource
 */
export const CanRead: React.FC<{
  resource: string;
  children: ReactNode;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}> = ({ resource, children, fallback, showAccessDenied }) => {
  return (
    <PermissionGuard
      resource={resource}
      action="read"
      fallback={fallback}
      showAccessDenied={showAccessDenied}
      fallbackMessage={`You do not have permission to view ${resource}`}
    >
      {children}
    </PermissionGuard>
  );
};

/**
 * CanUpdate - Renders content if user can update the specified resource
 */
export const CanUpdate: React.FC<{
  resource: string;
  children: ReactNode;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}> = ({ resource, children, fallback, showAccessDenied }) => {
  return (
    <PermissionGuard
      resource={resource}
      action="update"
      fallback={fallback}
      showAccessDenied={showAccessDenied}
      fallbackMessage={`You do not have permission to update ${resource}`}
    >
      {children}
    </PermissionGuard>
  );
};

/**
 * CanDelete - Renders content if user can delete the specified resource
 */
export const CanDelete: React.FC<{
  resource: string;
  children: ReactNode;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}> = ({ resource, children, fallback, showAccessDenied }) => {
  return (
    <PermissionGuard
      resource={resource}
      action="delete"
      fallback={fallback}
      showAccessDenied={showAccessDenied}
      fallbackMessage={`You do not have permission to delete ${resource}`}
    >
      {children}
    </PermissionGuard>
  );
};

/**
 * CanGenerateReports - Renders content if user can generate reports
 */
export const CanGenerateReports: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}> = ({ children, fallback, showAccessDenied }) => {
  return (
    <PermissionGuard
      resource="reports"
      action="generate"
      fallback={fallback}
      showAccessDenied={showAccessDenied}
      fallbackMessage="You do not have permission to generate reports"
    >
      {children}
    </PermissionGuard>
  );
};

/**
 * CanVoidSales - Renders content if user can void sales
 */
export const CanVoidSales: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}> = ({ children, fallback, showAccessDenied }) => {
  return (
    <PermissionGuard
      resource="sales"
      action="void"
      fallback={fallback}
      showAccessDenied={showAccessDenied}
      fallbackMessage="You do not have permission to void sales"
    >
      {children}
    </PermissionGuard>
  );
};

const styles = StyleSheet.create({
  accessDeniedCard: {
    margin: spacing.md,
    backgroundColor: theme.colors.errorContainer,
  },
  accessDeniedContent: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  accessDeniedIcon: {
    marginBottom: spacing.sm,
  },
  accessDeniedTitle: {
    fontSize: typography.h6.fontSize,
    fontWeight: 'bold',
    color: theme.colors.onErrorContainer,
    marginBottom: spacing.sm,
  },
  accessDeniedMessage: {
    fontSize: typography.body1.fontSize,
    color: theme.colors.onErrorContainer,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  accessDeniedSubtext: {
    fontSize: typography.caption.fontSize,
    color: theme.colors.onErrorContainer,
    opacity: 0.8,
    textAlign: 'center',
  },
});

export default PermissionGuard;
