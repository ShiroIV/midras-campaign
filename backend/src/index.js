import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import authRoutes from './routes/auth.js';
import campaignRoutes from './routes/campaigns.js';
import characterRoutes from './routes/characters.js';
import calendarRoutes from './routes/calendar.js';
import mapRoutes from './routes/maps.js';
import monsterRoutes from './routes/monsters.js';
import itemRoutes from './routes/items.js';
import { errorHandler } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/maps', mapRoutes);
app.use('/api/monsters', monsterRoutes);
app.use('/api/items', itemRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Midras backend running on port ${PORT}`);
});
