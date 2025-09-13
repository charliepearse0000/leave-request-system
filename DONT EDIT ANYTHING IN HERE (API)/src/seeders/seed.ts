import { DataSource } from 'typeorm';
import { UserLeaveRequestsSeeder } from './seeders/user-leave-requests.seeder';
import { db } from '../config/database';

async function runSeeders() {
  await db.initialize();
  
  try {
    const seeder = new UserLeaveRequestsSeeder(db.getDataSource());
    await seeder.run();
    console.log("Seeders executed successfully");
  } catch (error) {
    console.error("Error executing seeders:", error);
  } finally {
    await db.getDataSource().destroy();
  }
}

runSeeders(); 