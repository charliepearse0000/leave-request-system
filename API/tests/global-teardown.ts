import { db } from '../src/config/database';
export default async function globalTeardown() {
  if (db.getDataSource().isInitialized) {
    await db.getDataSource().destroy();
  }
} 