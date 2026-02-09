import * as XLSX from 'xlsx';

export function exportToExcel(data: {
    stores: any[];
    products: any[];
    reports: any[];
    period: string;
}) {
    const { stores, products, reports, period } = data;

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Matrix View
    const matrixData: any[][] = [];

    // Header row
    const headerRow = ['店舗名', '店舗コード', ...products.map(p => p.name), '合計'];
    matrixData.push(headerRow);

    // Data rows
    stores.forEach(store => {
        const row: any[] = [store.name, store.storeCode];
        let storeTotal = 0;

        products.forEach(product => {
            const report = reports.find(r => r.userId === store.id && r.productId === product.id);
            const qty = report ? report.quantity : 0;
            row.push(qty);
            storeTotal += qty;
        });

        row.push(storeTotal);
        matrixData.push(row);
    });

    // Total row
    const totalRow = ['全体総計', '---'];
    products.forEach(product => {
        const total = reports
            .filter(r => r.productId === product.id)
            .reduce((acc, curr) => acc + curr.quantity, 0);
        totalRow.push(total);
    });
    totalRow.push(reports.reduce((acc, curr) => acc + curr.quantity, 0));
    matrixData.push(totalRow);

    const ws1 = XLSX.utils.aoa_to_sheet(matrixData);
    XLSX.utils.book_append_sheet(wb, ws1, '集計マトリクス');

    // Sheet 2: Detailed List
    const detailData = reports.map(r => ({
        '店舗名': r.user?.name || '',
        '店舗コード': r.user?.storeCode || '',
        '商品名': r.product?.name || r.customProductName || '',
        '数量': r.quantity,
        '不具合種類': r.category || '',
        'コメント': r.comment || '',
        '報告日時': new Date(r.createdAt).toLocaleString('ja-JP'),
    }));

    const ws2 = XLSX.utils.json_to_sheet(detailData);
    XLSX.utils.book_append_sheet(wb, ws2, '詳細リスト');

    // Download
    XLSX.writeFile(wb, `返品報告_${period}.xlsx`);
}
