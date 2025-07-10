import React, { useEffect, useRef, useState } from "react";
import html2pdf from "html2pdf.js";

interface InvoiceItem {
    date: string;
    orderId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}

interface Invoice {
    invoiceNumber: string;
    date: string;
    customerName: string;
    customerEmail: string;
    customerAddress: string;
    items: InvoiceItem[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    discount: number;
    discountAmount: number;
    total: number;
    paymentInstructions?: string;
    thankYouNote?: string;
}

interface InvoiceDownloadProps {
    invoice: Invoice;
    businessName: string;
    businessAddress?: string;
    businessPhone?: string;
    sealUrl?: string;
    signatureUrl?: string;
}

const InvoiceDownload: React.FC<InvoiceDownloadProps> = ({
    invoice,
    businessName,
    businessAddress,
    businessPhone,
    sealUrl,
    signatureUrl,
}) => {
    const invoiceRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);

    // Helper: preload all images in the invoice before PDF
    const preloadImages = (): Promise<void[]> => {
        if (!invoiceRef.current) return Promise.resolve([]);
        const imgs = Array.from(invoiceRef.current.querySelectorAll("img"));
        return Promise.all(
            imgs.map(
                (img) =>
                    new Promise<void>((res, rej) => {
                        if (img.complete && img.naturalHeight !== 0) return res();
                        img.onload = () => res();
                        img.onerror = () => res(); // resolve anyway to avoid hanging
                    })
            )
        );
    };

    const downloadPdf = async () => {
        if (!invoiceRef.current) return;
        setLoading(true);

        try {
            await preloadImages();

            const opt = {
                margin: [10, 10, 10, 10],
                filename: `Invoice-${invoice.invoiceNumber}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['css', 'legacy'], before: '.page-break' },
            };

            await html2pdf()
                .set(opt)
                .from(invoiceRef.current)
                .save();
        } catch (error) {
            alert("Error generating PDF. Please try again.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-8 bg-gray-50">
            <button
                onClick={downloadPdf}
                disabled={loading}
                className="mb-6 px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
                {loading ? "Preparing PDF..." : "Download Invoice PDF"}
            </button>

            <div
                ref={invoiceRef}
                className="bg-white p-8 text-sm leading-tight shadow-lg max-w-[210mm] mx-auto"
                style={{ width: "210mm" }}
            >
                {/* Invoice Header */}
                <header className="flex justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">INVOICE</h1>
                        <p className="text-lg font-semibold mt-1">#{invoice.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                        <div className="font-bold text-xl">{businessName}</div>
                        {businessAddress && <div className="whitespace-pre-line">{businessAddress}</div>}
                        {businessPhone && <div>{businessPhone}</div>}
                        <div className="mt-4">Date: {invoice.date}</div>
                    </div>
                </header>

                {/* Customer Info */}
                <section className="mb-6">
                    <h2 className="font-semibold text-lg mb-1">Bill To:</h2>
                    <div>
                        <div className="font-semibold">{invoice.customerName}</div>
                        <div>{invoice.customerEmail}</div>
                        <div className="whitespace-pre-line">{invoice.customerAddress}</div>
                    </div>
                </section>

                {/* Items Table */}
                <section className="mb-6">
                    <table className="w-full border-collapse border border-gray-300 text-xs">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="border border-gray-300 px-2 py-1">SL No.</th>
                                <th className="border border-gray-300 px-2 py-1">Date</th>
                                <th className="border border-gray-300 px-2 py-1">Order ID</th>
                                <th className="border border-gray-300 px-2 py-1">Description</th>
                                <th className="border border-gray-300 px-2 py-1 text-right">Quantity</th>
                                <th className="border border-gray-300 px-2 py-1 text-right">Unit Price</th>
                                <th className="border border-gray-300 px-2 py-1 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map((item, i) => (
                                <tr key={i} className="page-break-inside-avoid">
                                    <td className="border border-gray-300 px-2 py-1 text-center">{i + 1}</td>
                                    <td className="border border-gray-300 px-2 py-1">{item.date}</td>
                                    <td className="border border-gray-300 px-2 py-1">{item.orderId}</td>
                                    <td className="border border-gray-300 px-2 py-1">{item.description}</td>
                                    <td className="border border-gray-300 px-2 py-1 text-right">{item.quantity}</td>
                                    <td className="border border-gray-300 px-2 py-1 text-right">
                                        <span className="inline-flex items-baseline">
                                            <span className="rupee-symbol">₹</span>
                                            {item.unitPrice.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="border border-gray-300 px-2 py-1 text-right">
                                        <span className="inline-flex items-baseline">
                                            <span className="rupee-symbol">₹</span>
                                            {item.amount.toFixed(2)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                {/* Totals */}
                <section className="mb-6 flex justify-end">
                    <table className="text-xs border-collapse border border-gray-300 w-64">
                        <tbody>
                            <tr>
                                <td className="border border-gray-300 px-2 py-1 font-semibold">Subtotal:</td>
                                <td className="border border-gray-300 px-2 py-1 text-right">
                                    <span className="inline-flex items-baseline">
                                        <span className="rupee-symbol">₹</span>
                                        {invoice.subtotal.toFixed(2)}
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 px-2 py-1 font-semibold">Tax ({invoice.taxRate}%):</td>
                                <td className="border border-gray-300 px-2 py-1 text-right">
                                    <span className="inline-flex items-baseline">
                                        <span className="rupee-symbol">₹</span>
                                        {invoice.taxAmount.toFixed(2)}
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 px-2 py-1 font-semibold">Discount:</td>
                                <td className="border border-gray-300 px-2 py-1 text-right">
                                    <span className="inline-flex items-baseline">
                                        <span className="rupee-symbol">₹</span>
                                        {invoice.discountAmount.toFixed(2)}
                                    </span>
                                </td>
                            </tr>
                            <tr className="font-bold">
                                <td className="border border-gray-300 px-2 py-1 font-semibold">Total:</td>
                                <td className="border border-gray-300 px-2 py-1 text-right">
                                    <span className="inline-flex items-baseline">
                                        <span className="rupee-symbol">₹</span>
                                        {invoice.total.toFixed(2)}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                {/* Payment Instructions */}
                {invoice.paymentInstructions && (
                    <section className="mb-6">
                        <h3 className="font-semibold text-sm mb-1">Payment Instructions</h3>
                        <p className="whitespace-pre-line">{invoice.paymentInstructions}</p>
                    </section>
                )}

                {/* Thank You Note */}
                {invoice.thankYouNote && (
                    <section className="mb-6 text-center italic text-sm">
                        {invoice.thankYouNote}
                    </section>
                )}

                {/* Seal & Signature */}
                <section className="flex justify-between items-center mt-10">
                    {sealUrl && <img src={sealUrl} alt="Seal" className="h-20" />}
                    {signatureUrl && (
                        <div className="text-center">
                            <img src={signatureUrl} alt="Signature" className="h-12" />
                            <div className="text-xs mt-1">Authorized Signature</div>
                        </div>
                    )}
                </section>
            </div>

            {/* PAGE BREAKS: You can add a div with className="page-break" to force breaks */}
        </div>
    );
};

export default InvoiceDownload;
