const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.users.findFirst({ where: { email: 'mingyu@gmail.com' } });
    console.log('User found:', user ? { id: user.id, email: user.email, name: user.name } : 'Not found');
    
    if (user && user.password_hash) {
      console.log('User has password hash');
      const isValid = await bcrypt.compare('123456', user.password_hash);
      console.log('Password "123456" is valid:', isValid);
    } else {
      console.log('User has no password set');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
