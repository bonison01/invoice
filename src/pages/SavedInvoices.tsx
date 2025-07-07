import { useState, useEffect, createRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Download, Eye } from "lucide-react";
import InvoicePreview from "@/components/InvoicePreview";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Invoice } from "@/pages/Invoices";
import html2pdf from "html2pdf.js";

interface SavedInvoice {
  id: string;
  invoice_number: string;
  date: string;
  customer_name: string;
  customer_email: string;
  customer_address: string;
  total: number;
  business_name: string;
  items: any[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount: number;
  payment_instructions: string;
  thank_you_note: string;
  created_at: string;
}

const SavedInvoices = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<SavedInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [shouldDownload, setShouldDownload] = useState(false);

  const [businessName, setBusinessName] = useState<string>("");
  const [businessAddress, setBusinessAddress] = useState<string>("");
  const [businessPhone, setBusinessPhone] = useState<string>("");
  const [sealUrl, setSealUrl] = useState<string>("");
  const [signatureUrl, setSignatureUrl] = useState<string>("");

  const hiddenInvoiceRef = createRef<HTMLDivElement>();

  useEffect(() => {
    if (user) {
      fetchBusinessSettings();
      fetchSavedInvoices();
    }
  }, [user]);

  const fetchBusinessSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("business_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setBusinessName(data.business_name || "");
        setBusinessAddress(data.business_address || "");
        setBusinessPhone(data.business_phone || "");
        setSealUrl(data.seal_url || "");
        setSignatureUrl(data.signature_url || "");
      }
    } catch (error) {
      console.error("Error fetching business settings:", error);
      toast({
        title: "Error",
        description: "Failed to load business settings.",
        variant: "destructive",
      });
    }
  };

  const fetchSavedInvoices = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("saved_invoices")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const processedData = (data || []).map((invoice) => ({
        ...invoice,
        items: Array.isArray(invoice.items)
          ? invoice.items
          : typeof invoice.items === "string"
            ? JSON.parse(invoice.items)
            : [],
      }));

      setInvoices(processedData);
    } catch (error) {
      console.error("Error fetching saved invoices:", error);
      toast({
        title: "Error",
        description: "Failed to load saved invoices.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const viewInvoice = (savedInvoice: SavedInvoice) => {
    const invoice: Invoice = convertToInvoice(savedInvoice);
    setSelectedInvoice(invoice);
    setShowPreview(true);
  };

  const downloadInvoice = (invoice: SavedInvoice) => {
    const invoiceData = convertToInvoice(invoice);
    setSelectedInvoice(invoiceData);
    setShouldDownload(true); // triggers the useEffect
  };

  const convertToInvoice = (savedInvoice: SavedInvoice): Invoice => ({
    id: savedInvoice.id,
    invoiceNumber: savedInvoice.invoice_number,
    date: savedInvoice.date,
    customer: {
      id: "",
      name: savedInvoice.customer_name,
      email: savedInvoice.customer_email,
      address: savedInvoice.customer_address,
    },
    items: savedInvoice.items || [],
    subtotal: savedInvoice.subtotal,
    taxRate: savedInvoice.tax_rate,
    taxAmount: savedInvoice.tax_amount,
    discountType: "fixed",
    discountValue: savedInvoice.discount,
    discountAmount: savedInvoice.discount,
    total: savedInvoice.total,
    paymentInstructions: savedInvoice.payment_instructions || "",
    thankYouNote: savedInvoice.thank_you_note || "",
  });

  useEffect(() => {
    if (shouldDownload && hiddenInvoiceRef.current && selectedInvoice) {
      html2pdf()
        .set({
          margin: 0.5,
          filename: `Invoice-${selectedInvoice.invoiceNumber}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
        })
        .from(hiddenInvoiceRef.current)
        .save()
        .then(() => setShouldDownload(false))
        .catch((err) => {
          console.error("PDF generation error:", err);
          toast({
            title: "PDF Error",
            description: "Failed to generate PDF.",
            variant: "destructive",
          });
          setShouldDownload(false);
        });
    }
  }, [shouldDownload, hiddenInvoiceRef, selectedInvoice]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-purple-50 flex items-center justify-center">
        <div>Loading saved invoices...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-purple-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button onClick={() => navigate("/")} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-purple-600 bg-clip-text text-transparent">
              Saved Invoices
            </h1>
            <p className="text-gray-600">View and download your saved invoices</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Invoices</CardTitle>
            <CardDescription>
              {invoices.length} saved invoice{invoices.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No saved invoices yet.</p>
                <Button
                  onClick={() => navigate("/invoices")}
                  className="mt-4"
                  variant="outline"
                >
                  Create Your First Invoice
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.invoice_number}
                        </TableCell>
                        <TableCell>{invoice.date}</TableCell>
                        <TableCell>{invoice.customer_name}</TableCell>
                        <TableCell>₹{invoice.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewInvoice(invoice)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadInvoice(invoice)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              {/* <DialogTitle>Invoice Preview</DialogTitle> */}
            </DialogHeader>
            {selectedInvoice && (
              <InvoicePreview
                invoice={selectedInvoice}
                businessName={businessName}
                businessAddress={businessAddress}
                businessPhone={businessPhone}
                sealUrl={sealUrl}
                signatureUrl={signatureUrl}
                isPrint={true}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Hidden invoice for PDF generation */}
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px", width: "210mm", backgroundColor: "white" }}>
          {selectedInvoice && (
            <div 
              ref={hiddenInvoiceRef} 
              style={{ 
                backgroundColor: "white", 
                padding: "20px",
                fontFamily: "system-ui, -apple-system, sans-serif",
                color: "#000000"
              }}
            >
              <div className="space-y-6 bg-white p-6 border rounded-lg" style={{ backgroundColor: "white", padding: "24px", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                {/* Header */}
                <div className="border-b pb-6" style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: "24px" }}>
                  <div className="flex justify-between items-start" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900" style={{ fontSize: "24px", fontWeight: "700", color: "#111827", margin: "0" }}>INVOICE</h1>
                      <p className="text-gray-600" style={{ color: "#4b5563", margin: "4px 0 0 0" }}>#{selectedInvoice.invoiceNumber}</p>
                    </div>
                    <div className="text-right" style={{ textAlign: "right" }}>
                      <div className="text-lg font-semibold" style={{ fontSize: "18px", fontWeight: "600", margin: "0" }}>{businessName}</div>
                      {businessAddress && (
                        <div className="text-sm text-gray-600 mt-1 whitespace-pre-line" style={{ fontSize: "14px", color: "#4b5563", marginTop: "4px", whiteSpace: "pre-line" }}>{businessAddress}</div>
                      )}
                      {businessPhone && (
                        <div className="text-sm text-gray-600" style={{ fontSize: "14px", color: "#4b5563" }}>{businessPhone}</div>
                      )}
                      <div className="text-sm text-gray-600 mt-2" style={{ fontSize: "14px", color: "#4b5563", marginTop: "8px" }}>Date: {selectedInvoice.date}</div>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                {selectedInvoice.customer && (
                  <div className="border-b pb-6" style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: "24px" }}>
                    <h3 className="font-semibold mb-2" style={{ fontWeight: "600", marginBottom: "8px", margin: "0 0 8px 0" }}>Bill To:</h3>
                    <div className="text-sm" style={{ fontSize: "14px" }}>
                      <div className="font-medium" style={{ fontWeight: "500" }}>{selectedInvoice.customer.name}</div>
                      <div>{selectedInvoice.customer.email}</div>
                      {selectedInvoice.customer.address && (
                        <div className="mt-1 whitespace-pre-line" style={{ marginTop: "4px", whiteSpace: "pre-line" }}>{selectedInvoice.customer.address}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Items Table */}
                {selectedInvoice.items.length > 0 && (
                  <div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <th style={{ height: "48px", padding: "16px", textAlign: "left", fontWeight: "500", color: "#6b7280" }}>SL No.</th>
                          <th style={{ height: "48px", padding: "16px", textAlign: "left", fontWeight: "500", color: "#6b7280" }}>Date</th>
                          <th style={{ height: "48px", padding: "16px", textAlign: "left", fontWeight: "500", color: "#6b7280" }}>Order ID</th>
                          <th style={{ height: "48px", padding: "16px", textAlign: "left", fontWeight: "500", color: "#6b7280" }}>Description</th>
                          <th style={{ height: "48px", padding: "16px", textAlign: "left", fontWeight: "500", color: "#6b7280" }}>Qty</th>
                          <th style={{ height: "48px", padding: "16px", textAlign: "left", fontWeight: "500", color: "#6b7280" }}>Unit Price</th>
                          <th style={{ height: "48px", padding: "16px", textAlign: "right", fontWeight: "500", color: "#6b7280" }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.items.map((item, index) => (
                          <tr key={item.id} style={{ borderBottom: index === selectedInvoice.items.length - 1 ? "none" : "1px solid #e5e7eb" }}>
                            <td style={{ padding: "16px", verticalAlign: "middle" }}>{index + 1}</td>
                            <td style={{ padding: "16px", verticalAlign: "middle" }}>{item.date}</td>
                            <td style={{ padding: "16px", verticalAlign: "middle" }}>{item.orderId}</td>
                            <td style={{ padding: "16px", verticalAlign: "middle" }}>{item.description}</td>
                            <td style={{ padding: "16px", verticalAlign: "middle" }}>{item.quantity}</td>
                            <td style={{ padding: "16px", verticalAlign: "middle" }}>
                              <div style={{ display: "flex", alignItems: "center" }}>
                                ₹{item.unitPrice.toFixed(2)}
                              </div>
                            </td>
                            <td style={{ padding: "16px", verticalAlign: "middle", textAlign: "right" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                                ₹{item.amount.toFixed(2)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Totals */}
                <div className="border-t pt-6" style={{ borderTop: "1px solid #e5e7eb", paddingTop: "24px" }}>
                  <div className="flex justify-end" style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div className="w-64 space-y-2" style={{ width: "256px" }}>
                      <div className="flex justify-between" style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span>Subtotal:</span>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          ₹{selectedInvoice.subtotal.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex justify-between" style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span>Tax ({selectedInvoice.taxRate}%):</span>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          ₹{selectedInvoice.taxAmount.toFixed(2)}
                        </div>
                      </div>
                      {selectedInvoice.discountAmount > 0 && (
                        <div className="flex justify-between" style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                          <span>Discount:</span>
                          <div style={{ display: "flex", alignItems: "center" }}>
                            -₹{selectedInvoice.discountAmount.toFixed(2)}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg border-t pt-2" style={{ display: "flex", justifyContent: "space-between", fontWeight: "700", fontSize: "18px", borderTop: "1px solid #e5e7eb", paddingTop: "8px" }}>
                        <span>Total:</span>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          ₹{selectedInvoice.total.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t pt-6 space-y-4" style={{ borderTop: "1px solid #e5e7eb", paddingTop: "24px" }}>
                  {selectedInvoice.paymentInstructions && (
                    <div>
                      <h4 className="font-semibold mb-2" style={{ fontWeight: "600", marginBottom: "8px", margin: "0 0 8px 0" }}>Payment Instructions:</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-line" style={{ fontSize: "14px", color: "#4b5563", whiteSpace: "pre-line", margin: "0" }}>{selectedInvoice.paymentInstructions}</p>
                    </div>
                  )}
                  {selectedInvoice.thankYouNote && (
                    <div>
                      <p className="text-sm text-gray-600 whitespace-pre-line" style={{ fontSize: "14px", color: "#4b5563", whiteSpace: "pre-line", margin: "0" }}>{selectedInvoice.thankYouNote}</p>
                    </div>
                  )}
                  
                  {/* Seal and Signature */}
                  {(sealUrl || signatureUrl) && (
                    <div className="flex justify-between items-end mt-8 pt-4" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "32px", paddingTop: "16px" }}>
                      {sealUrl && (
                        <div className="text-center" style={{ textAlign: "center" }}>
                          <img 
                            src={sealUrl} 
                            alt="Business Seal" 
                            style={{ 
                              width: "192px", 
                              height: "192px", 
                              objectFit: "contain", 
                              margin: "0 auto 8px auto",
                              maxWidth: "192px", 
                              maxHeight: "192px" 
                            }}
                          />
                          <p style={{ fontSize: "12px", color: "#6b7280", margin: "0" }}>Business Seal</p>
                        </div>
                      )}
                      {signatureUrl && (
                        <div className="text-center" style={{ textAlign: "center" }}>
                          <img 
                            src={signatureUrl} 
                            alt="Signature" 
                            style={{ 
                              width: "128px", 
                              height: "64px", 
                              objectFit: "contain", 
                              margin: "0 auto 8px auto" 
                            }} 
                          />
                          <p style={{ fontSize: "12px", color: "#6b7280", margin: "0" }}>Authorized Signature</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedInvoices;
