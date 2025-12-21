import {
  AuthorizationService,
  AuthorizationContext,
  Permission,
  Role,
} from '@domain/character/ports/AuthorizationService';

/**
 * Authorization Service Implementation
 * 
 * Implements a simple public-access authorization model.
 * Structured to support future RBAC expansion.
 * 
 * Current implementation:
 * - All users have PUBLIC role
 * - All permissions are granted
 * - No authentication required
 * 
 * Future expansion could add:
 * - User authentication
 * - Role-based permissions
 * - Resource-level access control
 * 
 * @example
 * ```typescript
 * const service = new AuthorizationServiceImpl();
 * const context = await service.getCurrentContext();
 * const canView = await service.hasPermission(context, Permission.VIEW_CHARACTERS);
 * ```
 */
export class AuthorizationServiceImpl implements AuthorizationService {
  /**
   * Check if context has a specific permission
   * Currently grants all permissions for PUBLIC role
   */
  async hasPermission(
    context: AuthorizationContext,
    permission: Permission
  ): Promise<boolean> {
    // In current implementation, all permissions are granted
    // Future: Check context.permissions array
    return context.permissions.includes(permission);
  }

  /**
   * Check if context has a specific role
   */
  async hasRole(context: AuthorizationContext, role: Role): Promise<boolean> {
    return context.role === role;
  }

  /**
   * Get current authorization context
   * Returns public context with all permissions
   */
  async getCurrentContext(): Promise<AuthorizationContext> {
    return {
      role: Role.PUBLIC,
      permissions: [
        Permission.VIEW_CHARACTERS,
        Permission.MANAGE_FAVORITES,
        Permission.VIEW_DETAILS,
      ],
    };
  }

  /**
   * Check if user can perform an action on a resource
   * 
   * @param context - Authorization context
   * @param action - Action to perform (e.g., 'read', 'write')
   * @param resource - Resource type (e.g., 'character', 'favorites')
   * @returns true if action is allowed
   */
  async canPerform(
    _context: AuthorizationContext,
    action: string,
    resource: string
  ): Promise<boolean> {
    // Simple implementation: allow all actions for public users
    // Future: Implement resource-action-role matrix
    // Context parameter reserved for future role-based access control
    
    const allowedActions: Record<string, string[]> = {
      character: ['read', 'view'],
      favorites: ['read', 'write', 'delete'],
      comics: ['read', 'view'],
    };

    const resourceActions = allowedActions[resource];
    if (!resourceActions) {
      return false;
    }

    return resourceActions.includes(action);
  }
}
