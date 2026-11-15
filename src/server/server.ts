import express, { type Express } from 'express';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { authRoutes } from './modules/auth/auth.routes';
import { storeRoutes } from './modules/stores/store.routes';
import { productRoutes } from './modules/products/product.routes';
import { stockRoutes } from './modules/stock/stock.routes';
import { saleRoutes } from './modules/sales/sale.routes';
import { reportRoutes } from './modules/reports/report.routes';
import { offlineRoutes } from './modules/offline/offline.routes';
import { backupRoutes } from './modules/backup/backup.routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

export function createApp(): Express {
  const app = express();

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (_req, res) => {
    res.json({ success: true, message: 'ERP API OK' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/stores', storeRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/stocks', stockRoutes);
  app.use('/api/sales', saleRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/offline', offlineRoutes);
  app.use('/api/backup', backupRoutes);

  app.use(errorHandler);

  return app;
}

const app = createApp();
const port = Number(process.env.PORT || 3000);

createServer(app).listen(port, () => {
  console.log(`ERP API listening on http://localhost:${port}`);
});
