import express from 'express';
import cors from 'cors';
import authRouter from './routes/authRoute.js';
import deckRouter from './routes/deckRoute.js';
import cardRouter from './routes/cardRoute.js';
import statsRouter from './routes/stats.js';  // Add this line
import studySessionRouter from './routes/studySession.js'; // Optional: add this line too

const app = express();

app.use(cors());
app.use(express.json());

// API base
app.use('/api/auth', authRouter);
app.use('/api/decks', deckRouter);
app.use('/api/cards', cardRouter);
app.use('/api/stats', statsRouter);             // Register here
app.use('/api/studySession', studySessionRouter);    // Register here (if added)



// health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(3000, () => {
  console.log('🔥 Server running on http://localhost:3000');
});
