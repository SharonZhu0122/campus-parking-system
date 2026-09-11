const app = require('./app');
const { startDataGenerator } = require('./services/dataGenerator');

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
  startDataGenerator();
});
