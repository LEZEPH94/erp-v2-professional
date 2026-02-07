const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // 1. On crypte le mot de passe "admin123"
  const hashedPassword = await bcrypt.hash("admin123", 10);
  
  // 2. On crée l'utilisateur
  const user = await prisma.user.create({
    data: {
      email: "admin@erp.com",
      password: hashedPassword,
    },
  });
  console.log("✅ Utilisateur créé :", user.email);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());