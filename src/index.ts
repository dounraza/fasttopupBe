import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import apiRoutes from './routes/api';

const app = express();
const PORT = process.env.PORT || 3000;

// Explicit CORS config
app.use(cors({
  origin: '*', // Allows any origin, including your frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// Helmet configuration that doesn't block cross-origin
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.send('Varotrabe Backend is running');
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

export default app;
