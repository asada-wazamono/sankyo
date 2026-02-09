'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Helper for random password
function generateRandomPassword() {
    return Math.random().toString(36).slice(-8);
}

// Authentication Action
export async function login(loginId: string, password: string) {
    const user = await prisma.user.findUnique({
        where: { loginId },
    });

    if (!user || user.password !== password) {
        throw new Error('IDまたはパスワードが正しくありません');
    }

    return {
        id: user.id,
        name: user.name,
        role: user.role,
        storeCode: user.storeCode,
    };
}

// Master Fetch Actions
export async function getProducts() {
    return await prisma.product.findMany({
        orderBy: { createdAt: 'asc' },
    });
}

export async function getStores() {
    return await prisma.user.findMany({
        where: { role: 'STORE' },
        orderBy: { storeCode: 'asc' },
    });
}

// Report Actions
export async function getReportsByPeriod(period: string) {
    return await prisma.report.findMany({
        where: { period },
        include: { product: true, user: true },
    });
}

export async function submitReports(userId: string, period: string, reports: any[]) {
    // CRITICAL: Ensure we are using correctly formatted userId
    if (!userId) throw new Error("Invalid User ID");

    // Clear existing reports for this user and period
    await prisma.report.deleteMany({
        where: { userId, period },
    });

    for (const report of reports) {
        if (report.quantity > 0) {
            await prisma.report.create({
                data: {
                    userId,
                    productId: report.productId,
                    quantity: report.quantity,
                    category: report.category || null,
                    comment: report.comment || '',
                    period,
                },
            });
        }
    }
    revalidatePath('/store');
    revalidatePath('/admin');
    return { success: true };
}

// Master CRUD Actions
export async function upsertProduct(id: string | null, data: { name: string }) {
    if (id && !id.startsWith('temp')) {
        await prisma.product.update({
            where: { id },
            data: { name: data.name },
        });
    } else {
        await prisma.product.create({
            data: { name: data.name, isMaster: true },
        });
    }
    revalidatePath('/admin/masters');
}

export async function upsertStore(id: string | null, data: any) {
    const pwd = data.password || generateRandomPassword();

    if (id && !id.startsWith('temp')) {
        await prisma.user.update({
            where: { id },
            data: {
                name: data.name,
                storeCode: data.storeCode,
                loginId: data.loginId,
                password: data.password, // Use provided pwd
            },
        });
    } else {
        await prisma.user.create({
            data: {
                name: data.name,
                storeCode: data.storeCode,
                loginId: data.loginId,
                password: pwd,
                role: 'STORE',
            },
        });
    }
    revalidatePath('/admin/masters');
}

export async function deleteProduct(id: string) {
    await prisma.report.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });
    revalidatePath('/admin/masters');
}

export async function deleteStore(id: string) {
    await prisma.report.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
    revalidatePath('/admin/masters');
}
