/** Central query-key registry so cache invalidation (incl. realtime) stays consistent. */
export const queryKeys = {
  profile: (userId: string) => ['profile', userId] as const,
  entitlements: (userId: string) => ['entitlements', userId] as const,
  athleteHome: (userId: string) => ['athlete-home', userId] as const,
  notifications: (userId: string) => ['notifications', userId] as const,
  statusBoard: (userId: string) => ['status-board', userId] as const,
}
