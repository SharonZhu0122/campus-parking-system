// Words shown for the values the API stores.

export const VIOLATION_LABELS = {
  reserved_violation: 'Reserved space violation',
  unpaid_violation: 'Unpaid during paid hours',
  mobility_violation: 'Mobility park violation',
};

export const VIOLATION_OPTIONS = Object.entries(VIOLATION_LABELS);

export const RESOLUTION_LABELS = {
  ticket_issued: 'Ticket issued',
  false_positive: 'False positive',
  other: 'Other',
};
