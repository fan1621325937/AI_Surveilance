import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. 初始化管理员账号
  const adminUsername = "admin";
  const adminPassword = "admin123"; // 默认初始密码

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
        loginUserAgent: "System Initialization", // 登录用户代理用来记录登录设备信息
        remark: "系统初始化自动生成的顶级管理员",
      } as any,
    });
    console.log(
      `✅ Admin user created! (Username: ${adminUsername}, Password: ${adminPassword})`,
    );
  } else {
    console.log("ℹ️ Admin user already exists, skipping.");
  }

  console.log("🏁 Seeding finished.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed!");
    console.error(e); // 打印完整错误堆栈以便排查 (如数据库连接或字段缺失)
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
