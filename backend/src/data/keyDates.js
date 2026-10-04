// Dates when campus is expected to be busier than usual (visitors, new
// students, ceremonies). Taken from the University of Waikato's published
// key dates (waikato.ac.nz/study/key-university-dates and
// waikato.ac.nz/students/graduation/ceremonies). Dates are inclusive, NZ time.
// To add an event (e.g. Open Day once the university confirms it), add a line.
const KEY_DATES = [
  { name: 'Graduation ceremonies (Hamilton)', start: '2026-10-19', end: '2026-10-20' },
  { name: 'Trimester C begins', start: '2026-11-16', end: '2026-11-16' },
  { name: 'International graduation ceremony', start: '2026-12-15', end: '2026-12-15' },
  { name: 'Orientation Week', start: '2027-02-22', end: '2027-02-26' },
  { name: 'Trimester A begins', start: '2027-03-01', end: '2027-03-01' },
  { name: 'Graduation ceremonies (Hamilton)', start: '2027-04-20', end: '2027-04-23' },
  { name: 'Orientation Week', start: '2027-07-05', end: '2027-07-09' },
  { name: 'Trimester B begins', start: '2027-07-12', end: '2027-07-12' },
  { name: 'Trimester C begins', start: '2027-11-15', end: '2027-11-15' },
];

module.exports = { KEY_DATES };
