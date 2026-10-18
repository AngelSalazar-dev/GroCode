const { PrismaClient } = require("./src/generated-v2/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const postsCount = await prisma.post.count();
    console.log("Posts count:", postsCount);
    const posts = await prisma.post.findMany({
      take: 1,
      include: {
        author: true,
        _count: true,
      }
    });
    console.log("First post:", JSON.stringify(posts[0], null, 2));
  } catch (e) {
    console.error("Database error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
