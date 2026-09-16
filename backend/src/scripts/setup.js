require('dotenv').config();
const { sequelize, GateArea } = require('../models');

const GATES = [
  { name: 'Gate 1', totalParks: 500 },
  { name: 'Gate 2b', totalParks: 230 },
  { name: 'Gate 3A', totalParks: 50 },
  { name: 'Gate 3B', totalParks: 50 },
  { name: 'Gate 10', totalParks: 50 },
];

async function setup() {
  await sequelize.sync();
  for (const gate of GATES) {
    await GateArea.findOrCreate({ where: { name: gate.name }, defaults: gate });
  }
  console.log('Database setup complete');
}

setup()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
