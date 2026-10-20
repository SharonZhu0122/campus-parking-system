// Words a driver sees. They differ a little from the admin's, which talk about staff actions.

export const VIOLATION_LABELS = {
  reserved_violation: 'Reserved space without a permit',
  unpaid_violation: 'Unpaid during paid hours',
  mobility_violation: 'Mobility park without a valid card',
};

const RESOLUTION_LABELS = {
  ticket_issued: 'Ticket issued',
  false_positive: 'Closed: no violation found',
  other: 'Closed',
};

export function statusOf(violation) {
  if (!violation.resolved) return { text: 'Under review', className: 'unresolved' };
  return { text: RESOLUTION_LABELS[violation.resolutionType] || 'Closed', className: 'resolved' };
}
