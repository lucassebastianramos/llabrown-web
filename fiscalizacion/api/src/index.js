import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
const port = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());
import dashboardRoutes from './routes/dashboard.js';
import escuelasRoutes from './routes/escuelas.js';
import importRoutes from './routes/import.js';
import authRoutes from './routes/auth.js';
import fiscalesRoutes from './routes/fiscales.js';
import incidenciasRoutes from './routes/incidencias.js';
app.use('/api', dashboardRoutes);
app.use('/api', escuelasRoutes);
app.use('/api', importRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', fiscalesRoutes);
app.use('/api', incidenciasRoutes);
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
//# sourceMappingURL=index.js.map