import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();
if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
  dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
}

const app = express();
const port = process.env.PORT || 3001;

const corsOptions: cors.CorsOptions = {
  origin: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '25mb' }));

// Static uploads (actas / telegramas)
const uploadsPath = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/api/uploads', express.static(uploadsPath));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'fiscalizacion-api', timestamp: new Date().toISOString() });
});

import dashboardRoutes from './routes/dashboard.js';
import escuelasRoutes from './routes/escuelas.js';
import importRoutes from './routes/import.js';
import authRoutes from './routes/auth.js';
import fiscalesRoutes from './routes/fiscales.js';
import incidenciasRoutes from './routes/incidencias.js';
import mesasRoutes from './routes/mesas.js';
import backupRoutes from './routes/backup.js';
import usersRoutes from './routes/users.js';
import geoRoutes from './routes/geo.js';

app.use('/api', dashboardRoutes);
app.use('/api', escuelasRoutes);
app.use('/api', importRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', fiscalesRoutes);
app.use('/api', incidenciasRoutes);
app.use('/api', mesasRoutes);
app.use('/api', backupRoutes);
app.use('/api', usersRoutes);
app.use('/api', geoRoutes);

// Servir SPA compilada de Vite bajo /fiscalizacion
const frontendDist = path.resolve(process.cwd(), '../dist');
if (fs.existsSync(frontendDist)) {
  app.use('/fiscalizacion', express.static(frontendDist));
  app.get(/^\/fiscalizacion(\/.*)?$/, (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Fiscalización server running on port ${port}`);
});
