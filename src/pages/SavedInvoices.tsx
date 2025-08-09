// src/pages/SavedInvoices.tsx
import { useState, useEffect } from "react";
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
import InvoiceDownload from "@/components/InvoiceDownload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import type { Invoice } from "@/pages/Invoices";

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
  const [showPreview, setShowPreview] = useState(false);
  const [shouldDownload, setShouldDownload] = useState(false);

  const [businessName, setBusinessName] = useState<string>("");
  const [businessAddress, setBusinessAddress] = useState<string>("");
  const [businessPhone, setBusinessPhone] = useState<string>("");
  const [sealUrl, setSealUrl] = useState<string>("");
  const [signatureUrl, setSignatureUrl] = useState<string>("");

  useEffect(() => {
    if (user) {
      fetchBusinessSettings();
      fetchSavedInvoices();
    }
  }, [user]);


  const deleteInvoice = async (invoiceId: string) => {
  if (!user) return;
  const confirmed = window.confirm("Are you sure you want to delete this invoice?");
  if (!confirmed) return;

  try {
    const { error } = await supabase
      .from("saved_invoices")
      .delete()
      .eq("id", invoiceId)
      .eq("user_id", user.id);

    if (error) throw error;

    toast({
      title: "Success",
      description: "Invoice deleted successfully.",
    });

    // Refresh list
    setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to delete invoice.",
      variant: "destructive",
    });
  }
};


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
      toast({
        title: "Error",
        description: "Failed to load business settings.",
        variant: "destructive",
      });
    }
  };

  const fetchSavedInvoices = async () => {
    if (!user) return;
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
      toast({
        title: "Error",
        description: "Failed to load saved invoices.",
        variant: "destructive",
      });
    }
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

  const viewInvoice = (invoice: SavedInvoice) => {
    setSelectedInvoice(convertToInvoice(invoice));
    setShowPreview(true);
  };

  const downloadInvoice = (invoice: SavedInvoice) => {
    setSelectedInvoice(convertToInvoice(invoice));
    setShouldDownload(true);
  };

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
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-purple-600">
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
      <TableCell>{invoice.invoice_number}</TableCell>
      <TableCell>{invoice.date}</TableCell>
      <TableCell>{invoice.customer_name}</TableCell>
      <TableCell>₹{invoice.total.toFixed(2)}</TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => viewInvoice(invoice)}>
            <Eye className="w-4 h-4 mr-1" /> View
          </Button>
          <Button size="sm" variant="outline" onClick={() => downloadInvoice(invoice)}>
            <Download className="w-4 h-4 mr-1" /> Download
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => deleteInvoice(invoice.id)} // Make sure `invoice` is from `.map`
          >
            Delete
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

        {/* Invoice Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader />
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

        {/* Hidden PDF generator */}
        {selectedInvoice && (
          <InvoiceDownload
            invoice={selectedInvoice}
            businessName={businessName}
            businessAddress={businessAddress}
            businessPhone={businessPhone}
            sealUrl={sealUrl}
            signatureUrl={signatureUrl}
            triggerDownload={shouldDownload}
            onComplete={() => setShouldDownload(false)}
          />
        )}
      </div>
    </div>
  );
};

export default SavedInvoices;
