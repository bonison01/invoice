import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Save, Download, Upload, Package } from "lucide-react";
import InvoiceItem from "@/components/InvoiceItem";
import CustomerSelector from "@/components/CustomerSelector";
import InvoicePreview from "@/components/InvoicePreview";
import BulkUploadDialog from "@/components/BulkUploadDialog";
import ProductSelector from "@/components/ProductSelector";
import Navbar from "@/components/Navbar";
import InvoiceDownload from "@/components/InvoiceDownload";
import { InventoryProduct } from "@/pages/Inventory";

export interface InvoiceItem {
  id: string;
  date: string;
  orderId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  address: string;
  phone?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customer: Customer | null;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountType: "fixed" | "percentage";
  discountValue: number;
  discountAmount: number;
  total: number;
  paymentInstructions: string;
  thankYouNote: string;
}

const Invoices = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [invoice, setInvoice] = useState<Invoice>({
    id: "",
    invoiceNumber: `INV-${Date.now()}`,
    date: new Date().toISOString().split("T")[0],
    customer: null,
    items: [],
    subtotal: 0,
    taxRate: 10,
    taxAmount: 0,
    discountType: "percentage",
    discountValue: 0,
    discountAmount: 0,
    total: 0,
    paymentInstructions: "Payment due within 10 days. Thank you for your business!",
    thankYouNote: "Thank you for choosing our services.",
  });

  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [triggerDownload, setTriggerDownload] = useState(false);
  const [businessSettings, setBusinessSettings] = useState<any>(null);
  const [businessName, setBusinessName] = useState<string>("Your Business Name");
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);

  useEffect(() => {
    calculateTotals();
  }, [invoice.items, invoice.taxRate, invoice.discountType, invoice.discountValue]);

  useEffect(() => {
    if (user) {
      fetchBusinessSettings();
      fetchBusinessName();
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
        setBusinessSettings(data);
        setInvoice((prev) => ({
          ...prev,
          paymentInstructions: data.payment_instructions || prev.paymentInstructions,
          thankYouNote: data.thank_you_note || prev.thankYouNote,
        }));
      }
    } catch (error) {
      console.error("Error fetching business settings:", error);
    }
  };

  const fetchBusinessName = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("business_settings")
        .select("business_name")
        .eq("user_id", user.id)
        .single();

      if (data && !error) setBusinessName(data.business_name);
    } catch (error) {
      console.error("Error fetching business name:", error);
    }
  };

  const calculateTotals = () => {
    const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = (subtotal * invoice.taxRate) / 100;
    const discountAmount =
      invoice.discountType === "percentage"
        ? (subtotal * invoice.discountValue) / 100
        : invoice.discountValue;

    const total = subtotal + taxAmount - discountAmount;
    setInvoice((prev) => ({ ...prev, subtotal, taxAmount, discountAmount, total }));
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      orderId: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    };
    setInvoice((prev) => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handleBulkItemsAdd = (items: InvoiceItem[]) => {
    setInvoice((prev) => ({ ...prev, items: [...prev.items, ...items] }));
    setShowBulkUpload(false);
    toast({
      title: "Items added!",
      description: `Successfully added ${items.length} items to the invoice.`,
    });
  };

  const handleProductSelect = (product: InventoryProduct, quantity: number) => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      orderId: product.sku || "",
      description: product.name + (product.description ? ` - ${product.description}` : ""),
      quantity,
      unitPrice: product.unit_price,
      amount: quantity * product.unit_price,
    };
    setInvoice((prev) => ({ ...prev, items: [...prev.items, newItem] }));
    toast({
      title: "Product added!",
      description: `${product.name} has been added to the invoice.`,
    });
  };

  const updateItem = (id: string, updatedItem: Partial<InvoiceItem>) => {
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updatedItem,
              amount:
                (updatedItem.quantity ?? item.quantity) *
                (updatedItem.unitPrice ?? item.unitPrice),
            }
          : item
      ),
    }));
  };

  const deleteItem = (id: string) => {
    setInvoice((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== id) }));
  };

  // 🔐 SAVE INVOICE WITH FULL DATA, ITEMS AS JSON STRING
  const saveInvoice = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save invoices.",
        variant: "destructive",
      });
      return;
    }

    if (!invoice.customer) {
      toast({
        title: "Customer required",
        description: "Please select a customer before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const invoiceData = {
        user_id: user.id,
        invoice_number: invoice.invoiceNumber,
        date: invoice.date,
        customer_name: invoice.customer?.name || "",
        customer_email: invoice.customer?.email || "",
        customer_address: invoice.customer?.address || "",
        // Fix: items must be JSON-serializable, so store as string
        items: JSON.stringify(invoice.items),
        subtotal: invoice.subtotal,
        tax_rate: invoice.taxRate,
        tax_amount: invoice.taxAmount,
        // Your table currently has single `discount` column
        discount: invoice.discountAmount,
        total: invoice.total,
        payment_instructions: invoice.paymentInstructions,
        thank_you_note: invoice.thankYouNote,
        business_name: businessSettings?.business_name || businessName,
        business_address: businessSettings?.business_address || "",
        business_phone: businessSettings?.business_phone || "",
        seal_url: businessSettings?.seal_url || "",
        signature_url: businessSettings?.signature_url || "",
      };

      const { error } = await supabase.from("saved_invoices").insert(invoiceData);
      if (error) throw error;

      toast({ title: "Invoice saved!", description: "Successfully saved." });
      navigate("/saved-invoices");
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to save invoice.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const exportToPDF = () => {
    if (!invoice.customer) {
      toast({
        title: "Missing Customer",
        description: "Please select a customer before exporting the invoice.",
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Preparing Download", description: "Generating your invoice PDF..." });
    setTriggerDownload(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-yellow-50 flex items-center justify-center p-4">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate("/")} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent">
                Create Invoice
              </h1>
              <p className="text-gray-600">
                {businessName} - Invoice #{invoice.invoiceNumber}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setShowPreview(!showPreview)} variant="outline">
              {showPreview ? "Hide" : "Show"} Preview
            </Button>
            {user && (
              <Button onClick={saveInvoice} variant="outline" disabled={isLoading}>
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? "Saving..." : "Save"}
              </Button>
            )}
            <Button
              onClick={exportToPDF}
              className="bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700"
            >
              <Download className="w-4 h-4 mr-2" /> Download Invoice
            </Button>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {/* Invoice Details */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="invoiceNumber">Invoice Number</Label>
                    <Input
                      id="invoiceNumber"
                      value={invoice.invoiceNumber}
                      onChange={(e) =>
                        setInvoice((prev) => ({ ...prev, invoiceNumber: e.target.value }))
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="date">Invoice Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={invoice.date}
                      onChange={(e) =>
                        setInvoice((prev) => ({ ...prev, date: e.target.value }))
                      }
                    />
                  </div>

                  {/* Guest Business Name Input */}
                  {!user && (
                    <div className="col-span-2">
                      <Label htmlFor="businessName">Business Name (optional)</Label>
                      <Input
                        id="businessName"
                        placeholder="Enter your business name"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Customer */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomerSelector
                  selectedCustomer={invoice.customer}
                  onCustomerSelect={(customer) => setInvoice((prev) => ({ ...prev, customer }))}
                />
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Invoice Items</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowProductSelector(true)}
                      size="sm"
                      variant="outline"
                    >
                      <Package className="w-4 h-4 mr-2" /> From Inventory
                    </Button>
                    <Button
                      onClick={() => setShowBulkUpload(true)}
                      size="sm"
                      variant="outline"
                    >
                      <Upload className="w-4 h-4 mr-2" /> Bulk Upload
                    </Button>
                    <Button onClick={addItem} size="sm">
                      <Plus className="w-4 h-4 mr-2" /> Add Item
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {invoice.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No items added yet. Click “Add Item” or “Bulk Upload” to get started.
                  </div>
                ) : (
                  invoice.items.map((item) => (
                    <InvoiceItem
                      key={item.id}
                      item={item}
                      onUpdate={(updated) => updateItem(item.id, updated)}
                      onDelete={() => deleteItem(item.id)}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Totals */}
            <Card>
              <CardHeader>
                <CardTitle>Totals & Discounts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tax Rate (%)</Label>
                    <Input
                      type="number"
                      value={invoice.taxRate}
                      onChange={(e) =>
                        setInvoice((prev) => ({
                          ...prev,
                          taxRate: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Discount Type</Label>
                    <Select
                      value={invoice.discountType}
                      onValueChange={(value: "fixed" | "percentage") =>
                        setInvoice((prev) => ({ ...prev, discountType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-4">
                  <Label>
                    Discount {invoice.discountType === "percentage" ? "(%)" : "(₹)"}
                  </Label>
                  <Input
                    type="number"
                    value={invoice.discountValue}
                    onChange={(e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        discountValue: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>

                <div className="border-t mt-4 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{invoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({invoice.taxRate}%):</span>
                    <span>₹{invoice.taxAmount.toFixed(2)}</span>
                  </div>
                  {invoice.discountAmount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount:</span>
                      <span>-₹{invoice.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>₹{invoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Payment Instructions</Label>
                  <Textarea
                    value={invoice.paymentInstructions}
                    onChange={(e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        paymentInstructions: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Thank You Note</Label>
                  <Textarea
                    value={invoice.thankYouNote}
                    onChange={(e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        thankYouNote: e.target.value,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - preview */}
          {showPreview && (
            <div className="lg:sticky lg:top-8">
              <InvoicePreview
                invoice={invoice}
                businessName={businessName || businessSettings?.business_name || ""}
                businessAddress={businessSettings?.business_address || ""}
                businessPhone={businessSettings?.business_phone || ""}
                sealUrl={businessSettings?.seal_url || ""}
                signatureUrl={businessSettings?.signature_url || ""}
              />
            </div>
          )}
        </div>

        {/* Dialogs */}
        <BulkUploadDialog
          open={showBulkUpload}
          onOpenChange={setShowBulkUpload}
          onItemsAdd={handleBulkItemsAdd}
        />
        <ProductSelector
          open={showProductSelector}
          onOpenChange={setShowProductSelector}
          onSelectProduct={handleProductSelect}
        />

        {/* Hidden PDF generator */}
        <InvoiceDownload
          invoice={invoice}
          businessName={businessName || businessSettings?.business_name || ""}
          businessAddress={businessSettings?.business_address || ""}
          businessPhone={businessSettings?.business_phone || ""}
          sealUrl={businessSettings?.seal_url || ""}
          signatureUrl={businessSettings?.signature_url || ""}
          triggerDownload={triggerDownload}
          onComplete={() => {
            setTriggerDownload(false);
            toast({
              title: "Download Complete",
              description: `Invoice ${invoice.invoiceNumber} downloaded successfully.`,
            });
          }}
        />
      </div>
    </div>
  );
};

export default Invoices;
