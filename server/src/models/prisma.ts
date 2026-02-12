import { PrismaClient } from "@prisma/client";

/**
 * 导出一个全局单例的 Prisma 实例
 */
const prisma = new PrismaClient();

export default prisma;
