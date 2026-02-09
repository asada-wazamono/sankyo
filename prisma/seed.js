const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Clear existing data (optional but good for clean seed)
  await prisma.report.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.product.deleteMany({});

  // Create HQ Admin
  await prisma.user.create({
    data: {
      loginId: 'admin',
      password: 'admin_password123',
      name: '本部管理者',
      role: 'HQ',
    },
  });

  // Create Products
  const products = ['ダンボールA', '化粧箱B', '緩衝材C', 'パレットD', 'PPバンドE'];
  const productRecords = [];
  for (const name of products) {
    const p = await prisma.product.create({
      data: { name: name, isMaster: true },
    });
    productRecords.push(p);
  }

  // Create Stores and Mock Reports
  const stores = [
    { name: '中野店', code: '2017', id: 'store_nakano' },
    { name: '新宿店', code: '2018', id: 'store_shinjuku' },
    { name: '渋谷店', code: '2019', id: 'store_shibuya' },
    { name: '池袋店', code: '2020', id: 'store_ikebukuro' },
  ];

  for (const s of stores) {
    const user = await prisma.user.create({
      data: {
        loginId: s.id,
        password: 'store_password123',
        name: s.name,
        storeCode: s.code,
        role: 'STORE',
      },
    });

    // Create some reports for this store
    for (let i = 0; i < productRecords.length; i++) {
      // Randomly skip some products
      if (Math.random() > 0.3) {
        await prisma.report.create({
          data: {
            userId: user.id,
            productId: productRecords[i].id,
            quantity: Math.floor(Math.random() * 10) + 1,
            comment: '品質不良のため返品',
            period: '2026-01-A',
          }
        });
      }
    }
  }

  console.log('Advanced Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
