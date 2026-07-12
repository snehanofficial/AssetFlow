import bcrypt from 'bcryptjs';
import prisma from './client.js';

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing database records (in reverse order of dependencies)
  await prisma.refreshToken.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.assetCategory.deleteMany({});

  console.log('🧹 Cleaned existing records.');

  // 2. Hash default password
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // 3. Create Department Head and standard Employees
  const head = await prisma.employee.create({
    data: {
      email: 'head@assetflow.com',
      name: 'Department Head User',
      password: hashedPassword,
      role: 'DEPT_HEAD',
      status: 'ACTIVE',
    },
  });

  const manager = await prisma.employee.create({
    data: {
      email: 'manager@assetflow.com',
      name: 'Asset Manager User',
      password: hashedPassword,
      role: 'ASSET_MANAGER',
      status: 'ACTIVE',
    },
  });

  const normalEmployee = await prisma.employee.create({
    data: {
      email: 'employee@assetflow.com',
      name: 'Standard Employee',
      password: hashedPassword,
      role: 'EMPLOYEE',
      status: 'ACTIVE',
    },
  });

  const admin = await prisma.employee.create({
    data: {
      email: 'admin@assetflow.com',
      name: 'System Administrator',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log('👥 Created initial employees.');

  // 4. Create Departments (Operations, Engineering, Finance)
  const operations = await prisma.department.create({
    data: {
      name: 'Operations',
      status: 'ACTIVE',
      headId: head.id,
    },
  });

  const engineering = await prisma.department.create({
    data: {
      name: 'Engineering',
      status: 'ACTIVE',
      parentId: operations.id,
    },
  });

  await prisma.department.create({
    data: {
      name: 'Finance',
      status: 'ACTIVE',
      parentId: operations.id,
    },
  });

  console.log('🏢 Created departments hierarchy.');

  // Assign employees to departments
  await prisma.employee.update({
    where: { id: head.id },
    data: { departmentId: operations.id },
  });

  await prisma.employee.update({
    where: { id: manager.id },
    data: { departmentId: operations.id },
  });

  await prisma.employee.update({
    where: { id: normalEmployee.id },
    data: { departmentId: engineering.id },
  });

  await prisma.employee.update({
    where: { id: admin.id },
    data: { departmentId: operations.id },
  });

  console.log('🔗 Linked employees to departments.');

  // 5. Create Asset Categories with JSON custom schemas
  await prisma.assetCategory.create({
    data: {
      name: 'Laptops',
      customFieldsSchema: [
        { name: 'RAM', type: 'string', required: true },
        { name: 'OS', type: 'string', required: true },
      ],
    },
  });

  await prisma.assetCategory.create({
    data: {
      name: 'Vehicles',
      customFieldsSchema: [{ name: 'Fuel Type', type: 'string', required: true }],
    },
  });

  await prisma.assetCategory.create({
    data: {
      name: 'Meeting Rooms',
      customFieldsSchema: [],
    },
  });

  console.log('📁 Created asset categories.');
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
