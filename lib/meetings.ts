export function normalizeMeetingsResponse(response: any, defaultLimit = 10) {
  const payload = response?.data || response
  const meetings = payload?.meetings || payload?.data?.meetings || []
  const pagination = payload?.pagination || payload?.data?.pagination || { page: 1, limit: defaultLimit, total: 0, totalPages: 1 }
  return { meetings, pagination }
}
