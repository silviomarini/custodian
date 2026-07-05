import { createCustodianMiddleware } from '@silviomarini/custodian'
import { custodianConfig } from './lib/custodian'

export const middleware = createCustodianMiddleware(custodianConfig)

export const config = {
  matcher: ['/admin/:path*'],
}
