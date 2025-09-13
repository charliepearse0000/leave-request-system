import { User } from '../../src/models/user.entity';
import bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { db } from '../../src/config/database';
import { Role } from '../../src/models/role.entity';
import { RoleType } from '../../src/models/role.entity';
import { LeaveType, LeaveTypeCategory } from '../../src/models/leave-type.entity';


export const roles = [
  {
    id: '9d25b977-67cc-4e57-8829-c83be9ce3cef',
    name: RoleType.ADMIN,
    description: 'Admin role'
  },
  {
    id: 'b8032669-1b85-441c-96fe-670072baecbb',
    name: RoleType.EMPLOYEE,
    description: 'Employee role'
  },
  {
    id: '701eb321-ac30-44fc-9c18-d3ddc3f8c0ec',
    name: RoleType.MANAGER,
    description: 'Manager role'
  }
]

export const leaveTypes = [
  {
    id: '49fc9eb7-4bd6-49d1-9354-e95c851bb946',
    name: 'Annual Leave',
    description: 'Annual Leave Description',
    deductsBalance: true,
    category: LeaveTypeCategory.ANNUAL
  },
  {
    id: 'f010453c-0cc4-4a49-920f-d877619fc22c',
    name: 'Sick Leave',
    description: 'Sick Leave Description',
    deductsBalance: true,
    category: LeaveTypeCategory.SICK
  },
]

export async function createTestUser() {
  await ensureRolesExist();
  
  const roleRepository = db.getDataSource().getRepository(Role);
  const employeeRole = await roleRepository.findOne({ where: { name: RoleType.EMPLOYEE} });
  
  if (!employeeRole) {
    throw new Error('Employee role not found');
  }
  
  const userRepository = db.getDataSource().getRepository(User);
  const salt = bcrypt.genSaltSync(14);
  const hashedPassword = bcrypt.hashSync('test123', salt);

  const employee = userRepository.create({
    email: `test${Date.now()}@example.com`,
    password: hashedPassword,
    firstName: 'Test',
    lastName: 'User',
    roleId: employeeRole.id,
  });

  const user = await userRepository.save(employee);

  return {
    ...user,
    role: employeeRole?.name
  }
}

export async function createTestAdmin() {
  await ensureRolesExist();
  
  const roleRepository = db.getDataSource().getRepository(Role);
  const adminRole = await roleRepository.findOne({ where: { name: RoleType.ADMIN } });
  
  if (!adminRole) {
    throw new Error('Admin role not found');
  }
  
  const userRepository = db.getDataSource().getRepository(User);
  const salt = bcrypt.genSaltSync(14);
  const hashedPassword = bcrypt.hashSync('admin123', salt);

  const admin = userRepository.create({
    email: `admin${Date.now()}@example.com`,
    password: hashedPassword,
    firstName: 'Admin',
    lastName: 'User',
    roleId: adminRole.id,
  });

  const user = await userRepository.save(admin);

  return {
    ...user,
    role: adminRole?.name
  }
}

export async function createTestManager() {
  await ensureRolesExist();
  
  const roleRepository = db.getDataSource().getRepository(Role);
  const managerRole = await roleRepository.findOne({ where: { name: RoleType.MANAGER } });
  
  if (!managerRole) {
    throw new Error('Manager role not found');
  }
  
  const userRepository = db.getDataSource().getRepository(User);
  const salt = bcrypt.genSaltSync(14);
  const hashedPassword = bcrypt.hashSync('manager123', salt);

  const manager = userRepository.create({
    email: `manager${Date.now()}@example.com`,
    password: hashedPassword,
    firstName: 'Manager',
    lastName: 'User',
    roleId: managerRole.id,
  });

  const user = await userRepository.save(manager);

  return {
    ...user,
    role: managerRole?.name
  };
} 

export async function createTestLeaveType() {
  const leaveTypeRepository = db.getDataSource().getRepository(LeaveType);
  const leaveType = leaveTypeRepository.create({
    name: 'Test Leave Type',
    description: 'Test Leave Type Description'
  });

  return await leaveTypeRepository.save(leaveType);
}


export async function getAuthToken(user: User): Promise<string> {
  const token = sign(
    { 
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );

  return token;
}

export async function cleanupTestData(): Promise<void> {
  try {
    // Desactivar temporalmente todas las restricciones en la base de datos
    await db.getDataSource().query('SET session_replication_role = replica');
    
    // Eliminar datos de todas las tablas
    await db.getDataSource().query('TRUNCATE TABLE leave_requests, users, leave_types, roles CASCADE');
    
    // Restaurar las restricciones
    await db.getDataSource().query('SET session_replication_role = default');
  } catch (error) {
    console.error('Error al limpiar datos de prueba:', error);
    // Asegurarse de restaurar las restricciones incluso si hay un error
    await db.getDataSource().query('SET session_replication_role = default');
    throw error;
  }
}

export async function closeTestDatabase(): Promise<void> {
  if (db.getDataSource().isInitialized) {
    await db.getDataSource().destroy();
  }
}

export async function initializeTestDatabase(): Promise<void> {
  if (!db.getDataSource().isInitialized) {
    await db.getDataSource().initialize();
  }
}

export async function ensureRolesExist(): Promise<void> {
  const roleRepository = db.getDataSource().getRepository(Role);
  
  const count = await roleRepository.count();
  if (count > 0) return;
  
  const adminRole = roleRepository.create(roles[0]);
  const employeeRole = roleRepository.create(roles[1]);
  const managerRole = roleRepository.create(roles[2]);
  
  await roleRepository.save([adminRole, employeeRole, managerRole]);
} 

export async function ensureLeaveTypesExist(): Promise<void> {
  const leaveTypeRepository = db.getDataSource().getRepository(LeaveType);

  const leaveType = leaveTypeRepository.create(leaveTypes[0]);
  const sickLeaveType = leaveTypeRepository.create(leaveTypes[1]);

  await leaveTypeRepository.save([leaveType, sickLeaveType]);
}