import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';

const app = express();

app.use(cors());
app.use(express.json());

// API base
app.use('/api/auth', authRouter);

// health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(3000, () => {
  console.log('🔥 Server running on http://localhost:3000');
});
