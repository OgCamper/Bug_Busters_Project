import express from 'express';
import authRouter from './routes/auth';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());


app.use('/auth', authRouter);

app.get('/', (req, res) => {
  res.send('Welcome to Express Server!');
})

app.listen(3000, () => {
  console.log('Server is running on port 3000');
})