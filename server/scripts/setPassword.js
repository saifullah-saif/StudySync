const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setUserPassword() {
  try {
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const updated = await prisma.users.update({
      where: { email: 'mingyu@gmail.com' },
      data: { password_hash: hashedPassword }
    });
    
    console.log('Password set for user:', updated.email);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setUserPassword();
