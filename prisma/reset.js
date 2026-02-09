const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Completely clear all data
    await prisma.report.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.product.deleteMany({});

    // Re-create only the admin user
    await prisma.user.create({
        data: {
            loginId: 'admin',
            password: 'admin_password123',
            name: '本部管理者',
            role: 'HQ',
        },
    });

    console.log('Database has been reset. Only admin user exists.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
