const VIOLATION_TYPES = ['reserved_violation', 'unpaid_violation', 'mobility_violation'];

// What the parking record looks like for each kind of violation.
const EVENT_FOR_TYPE = {
  reserved_violation: { parkType: 'reserved', paymentStatus: 'not_required', mobilityCardValid: null },
  unpaid_violation: { parkType: 'standard', paymentStatus: 'unpaid', mobilityCardValid: null },
  mobility_violation: { parkType: 'mobility', paymentStatus: 'not_required', mobilityCardValid: false },
};

module.exports = { VIOLATION_TYPES, EVENT_FOR_TYPE };
