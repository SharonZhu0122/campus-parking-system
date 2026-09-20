require('dotenv').config();
const { sequelize, GateArea } = require('../models');

const GATES = [
  { name: 'Gate 1', totalParks: 487 },
  { name: 'Gate 2b', totalParks: 239 },
  { name: 'Gate 3A', totalParks: 101 },
  { name: 'Gate 3B', totalParks: 60 },
  { name: 'Gate 10', totalParks: 281 },
];

async function setup() {
  await sequelize.sync();
  for (const gate of GATES) {
    const [record] = await GateArea.findOrCreate({ where: { name: gate.name }, defaults: gate });
    if (record.totalParks !== gate.totalParks) {
      record.totalParks = gate.totalParks;
      await record.save();
    }
  }
  console.log('Database setup complete');
}

setup()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
