// src/components/InvoiceDownload.tsx
import { useEffect, useRef } from "react";
import html2pdf from "html2pdf.js";
import type { Invoice } from "@/pages/Invoices";

interface InvoiceDownloadProps {
    invoice: Invoice;
    businessName: string;
    businessAddress?: string;
    businessPhone?: string;
    sealUrl?: string;
    signatureUrl?: string;
    triggerDownload: boolean;
    onComplete: () => void;
}

const InvoiceDownload = ({
    invoice,
    businessName,
    businessAddress,
    businessPhone,
    sealUrl,
    signatureUrl,
    triggerDownload,
    onComplete,
}: InvoiceDownloadProps) => {
    const hiddenRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const generatePDF = async () => {
            if (!triggerDownload || !hiddenRef.current) return;

            try {
                const images = hiddenRef.current.querySelectorAll("img");
                await Promise.all(
                    Array.from(images).map(
                        (img) =>
                            new Promise<void>((resolve, reject) => {
                                if (img.complete && img.naturalHeight !== 0) {
                                    resolve();
                                } else {
                                    img.onload = () => resolve();
                                    img.onerror = () => reject(new Error("Image failed to load"));
                                }
                            })
                    )
                );

                await html2pdf()
                    .set({
                        margin: [10, 10, 16, 10], // top, right, bottom, left in mm
                        filename: `Invoice-${invoice.invoiceNumber}.pdf`,
                        image: { type: "jpeg", quality: 0.98 },
                        html2canvas: { scale: 2, useCORS: true },
                        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
                    })
                    .from(hiddenRef.current)
                    .save();
            } catch (err) {
                console.error("PDF generation failed:", err);
            } finally {
                onComplete();
            }
        };

        generatePDF();
    }, [triggerDownload]);

    return (
        <div
            style={{
                position: "absolute",
                left: "-9999px",
                top: "-9999px",
                width: "210mm",
                backgroundColor: "white",
                padding: "50mm",
                fontFamily: "Arial, sans-serif",
                color: "#111",
                fontSize: "12px",
                lineHeight: 1.6,
            }}
        >
            <div ref={hiddenRef}>

                {/* Header */}
                <div style={{ borderBottom: "1px solid #ccc", paddingBottom: "16px", marginBottom: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div>
                            <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>INVOICE</h1>
                            <p style={{ color: "#555" }}>#{invoice.invoiceNumber}</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: "bold", fontSize: "14px" }}>{businessName}</div>
                            {businessAddress && <div style={{ whiteSpace: "pre-line", fontSize: "12px" }}>{businessAddress}</div>}
                            {businessPhone && <div>{businessPhone}</div>}
                            <div style={{ marginTop: "5px" }}>Date: {invoice.date}</div>
                        </div>
                    </div>
                </div>

                {/* Customer Info */}
                <div style={{ marginBottom: "24px" }}>
                    <h3 style={{ fontWeight: "bold", marginBottom: "6px" }}>Bill To:</h3>
                    <div>
                        <div style={{ fontWeight: 600 }}>{invoice.customer.name}</div>
                        <div>{invoice.customer.email}</div>
                        {invoice.customer.address && (
                            <div style={{ whiteSpace: "pre-line" }}>{invoice.customer.address}</div>
                        )}
                    </div>
                </div>

                {/* Items Table */}
                <table
                    width="100%"
                    cellPadding={6}
                    style={{
                        borderCollapse: "collapse",
                        marginBottom: "28px",
                        fontSize: "11px",
                    }}
                >
                    <thead>
                        <tr style={{ borderBottom: "1px solid #ccc", backgroundColor: "#f4f4f4" }}>
                            <th align="left">SL No.</th>
                            <th align="left">Date</th>
                            <th align="left">Order ID</th>
                            <th align="left">Description</th>
                            <th align="right">Qty</th>
                            <th align="right">Unit Price</th>
                            <th align="right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.items.map((item, index) => (
                            <tr key={item.id || index} style={{ borderBottom: "1px solid #eee" }}>
                                <td>{index + 1}</td>
                                <td>{item.date}</td>
                                <td>{item.orderId}</td>
                                <td>{item.description}</td>
                                <td align="right">{item.quantity}</td>
                                <td align="right">₹{item.unitPrice.toFixed(2)}</td>
                                <td align="right">₹{(item.unitPrice * item.quantity).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div style={{ textAlign: "right", marginBottom: "30px", fontSize: "13px" }}>
                    <div style={{ marginBottom: "4px" }}>Subtotal: ₹{invoice.subtotal.toFixed(2)}</div>
                    <div style={{ marginBottom: "4px" }}>
                        Tax ({invoice.taxRate}%): ₹{invoice.taxAmount.toFixed(2)}
                    </div>
                    {invoice.discountAmount > 0 && (
                        <div style={{ marginBottom: "4px" }}>Discount: -₹{invoice.discountAmount.toFixed(2)}</div>
                    )}
                    <div style={{ fontWeight: "bold", fontSize: "14px", marginTop: "6px" }}>
                        Total: ₹{invoice.total.toFixed(2)}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ borderTop: "1px solid #ccc", paddingTop: "20px", marginTop: "30px", position: "relative" }}>
                    {/* Seal Image Centered */}
                    {sealUrl && (
                        <div
                            style={{
                                position: "absolute",
                                top: "-60px",
                                left: "50%",
                                transform: "translateX(-50%)",
                                opacity: 1,
                                zIndex: 0,
                            }}
                        >
                            <img src={sealUrl} alt="Seal" style={{ width: "300px", height: "300px", objectFit: "contain" }} />
                        </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        {/* Payment Info */}
                        <div style={{ flex: 1, marginRight: "40px", zIndex: 1 }}>
                            {invoice.paymentInstructions && (
                                <div style={{ marginBottom: "14px" }}>
                                    <h4 style={{ fontWeight: "bold" }}>Payment Instructions:</h4>
                                    <p style={{ whiteSpace: "pre-line" }}>{invoice.paymentInstructions}</p>
                                </div>
                            )}

                            <div style={{ marginBottom: "10px" }}>
                                <h4 style={{ fontWeight: "bold" }}>Payment UPI:</h4>
                                <p>doeasy01-4@okaxis</p>
                            </div>

                            <div>
                                <h4 style={{ fontWeight: "bold" }}>Bank Details:</h4>
                                <p style={{ whiteSpace: "pre-line" }}>
                                    JUSTMATENG SERVICE PRIVATE LIMITED{"\n"}
                                    A/C No: 43261950171{"\n"}
                                    IFSC: SBIN0005320
                                </p>
                            </div>
                        </div>

                        {/* Signature */}
                        {signatureUrl && (
                            <div style={{ width: "180px", textAlign: "center", zIndex: 1 }}>
                                <img
                                    src={signatureUrl}
                                    alt="Signature"
                                    style={{ width: "200%", maxHeight: "150px", objectFit: "contain", opacity: 1 }}
                                />
                                <p style={{ fontSize: "10px", color: "#666", marginTop: "4px" }}>Authorized Signature</p>
                            </div>
                        )}
                    </div>

                    {/* Thank You Note */}
                    {invoice.thankYouNote && (
                        <div style={{ marginTop: "20px", fontSize: "12px", color: "#555", whiteSpace: "pre-line" }}>
                            {invoice.thankYouNote}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InvoiceDownload;
