import { verifyAdmin } from '@silviomarini/auth'
import type { AdminSession } from '@silviomarini/auth'
import type { CustodianConfig } from '../types'

/** Framework-agnostic gate: true if the session belongs to one of config.adminEmails. */
export function checkAdminAccess(
  session: AdminSession | null | undefined,
  config: Pick<CustodianConfig, 'adminEmails'>
): boolean {
  return verifyAdmin(session, config.adminEmails)
}
