/**
 * Permission types for authorization
 */
export enum Permission {
  VIEW_CHARACTERS = 'view_characters',
  MANAGE_FAVORITES = 'manage_favorites',
  VIEW_DETAILS = 'view_details',
}

/**
 * Role types for RBAC (future expansion)
 */
export enum Role {
  PUBLIC = 'public',
  USER = 'user',
  ADMIN = 'admin',
}

/**
 * Authorization context for permission checks
 */
export interface AuthorizationContext {
  userId?: string;
  role: Role;
  permissions: Permission[];
}

/**
 * Authorization Service Port
 * 
 * Defines the contract for authorization logic.
 * Currently implements a simple public access model,
 * but structured for future RBAC expansion.
 * 
 * @example
 * ```typescript
 * const authService: AuthorizationService = new AuthorizationServiceImpl();
 * const canView = await authService.hasPermission(
 *   context,
 *   Permission.VIEW_CHARACTERS
 * );
 * ```
 */
export interface AuthorizationService {
  /**
   * Check if the current context has a specific permission
   * 
   * @param context - Authorization context
   * @param permission - Required permission
   * @returns true if permission is granted, false otherwise
   */
  hasPermission(context: AuthorizationContext, permission: Permission): Promise<boolean>;

  /**
   * Check if the current context has a specific role
   * 
   * @param context - Authorization context
   * @param role - Required role
   * @returns true if role matches, false otherwise
   */
  hasRole(context: AuthorizationContext, role: Role): Promise<boolean>;

  /**
   * Get the current authorization context
   * In this implementation, returns a public context
   * 
   * @returns Current authorization context
   */
  getCurrentContext(): Promise<AuthorizationContext>;

  /**
   * Check if the user can perform an action on a resource
   * 
   * @param context - Authorization context
   * @param action - Action to perform
   * @param resource - Resource type
   * @returns true if action is allowed, false otherwise
   */
  canPerform(
    context: AuthorizationContext,
    action: string,
    resource: string
  ): Promise<boolean>;
}
