import express from 'express';
import authRouter from './routes/auth';

const app = express();

app.use(express.json());


app.use('/auth', authRouter);

app.get('/', (req, res) => {
  res.send('Welcome to Express Server!');
})

app.listen(3000, () => {
    console.log('Server is running on port 3000');
})