import { createClient } from '@supabase/supabase-js'
import { getServerSession } from '@silviomarini/auth'
import { checkAdminAccess } from '@silviomarini/custodian'
import type { NextRequest } from 'next/server'
import { custodianConfig } from './custodian'

// Service-role client: bypasses RLS. Safe here because every write handler
// gates on getAuthContext()'s isAdmin check before touching the db.
export const db = createClient(custodianConfig.supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function getAuthContext(req: NextRequest) {
  const session = await getServerSession(req, {
    supabaseUrl: custodianConfig.supabaseUrl,
    supabaseAnonKey: custodianConfig.supabaseAnonKey,
  })
  return { isAdmin: checkAdminAccess(session, custodianConfig) }
}
