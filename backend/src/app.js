require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const gateRoutes = require('./routes/gateRoutes');
const adminRoutes = require('./routes/adminRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');
const assistantRoutes = require('./routes/assistantRoutes');
const alertRoutes = require('./routes/alertRoutes');
const meRoutes = require('./routes/meRoutes');
const { corsOptions } = require('./config/cors');
const { notFound, errorHandler } = require('./middleware/errorHandling');
const passwordResetRoutes = require('./routes/passwordResetRoutes');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(cors(corsOptions()));
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  next();
});
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', authRoutes);
app.use('/api', passwordResetRoutes);
app.use('/api/gates', gateRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/me', meRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
