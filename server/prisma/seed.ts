import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // 从环境变量获取管理员初始密码（不再硬编码）
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_INIT_PASSWORD || generateRandomPassword();

  const existingAdmin = await prisma.user.findUnique({
    where: { username: adminUsername },
  });

  if (!existingAdmin) {
    const hashedPassword = await argon2.hash(adminPassword);
    await prisma.user.create({
      data: {
        username: adminUsername,
        nickname: "超级管理员",
        password: hashedPassword,
        status: "0",
        loginUserAgent: "System Initialization",
        remark: "系统初始化自动生成的顶级管理员",
      } as any,
    });
    console.log(`✅ Admin user created!`);
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   ⚠️ 请务必在首次登录后修改密码！`);
  } else {
    console.log("ℹ️ Admin user already exists, skipping.");
  }

  console.log("🏁 Seeding finished.");
}

/**
 * 生成随机安全密码
 * 包含大小写字母、数字、特殊字符
 */
function generateRandomPassword(length = 16): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed!");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
