import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Download, Eye } from "lucide-react";
import InvoicePreview from "@/components/InvoicePreview";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [isLoading, setIsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSavedInvoices();
    }
  }, [user]);

  const fetchSavedInvoices = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process the data to ensure items is properly parsed
      const processedData = (data || []).map(invoice => ({
        ...invoice,
        items: Array.isArray(invoice.items) ? invoice.items : 
               typeof invoice.items === 'string' ? 
               JSON.parse(invoice.items) : []
      }));

      setInvoices(processedData);
    } catch (error) {
      console.error('Error fetching saved invoices:', error);
      toast({
        title: "Error",
        description: "Failed to load saved invoices.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const viewInvoice = (savedInvoice: SavedInvoice) => {
    const invoice: Invoice = {
      id: savedInvoice.id,
      invoiceNumber: savedInvoice.invoice_number,
      date: savedInvoice.date,
      customer: {
        id: '',
        name: savedInvoice.customer_name,
        email: savedInvoice.customer_email,
        address: savedInvoice.customer_address
      },
      items: savedInvoice.items || [],
      subtotal: savedInvoice.subtotal,
      taxRate: savedInvoice.tax_rate,
      taxAmount: savedInvoice.tax_amount,
      discountType: 'fixed',
      discountValue: savedInvoice.discount,
      discountAmount: savedInvoice.discount,
      total: savedInvoice.total,
      paymentInstructions: savedInvoice.payment_instructions || '',
      thankYouNote: savedInvoice.thank_you_note || ''
    };

    setSelectedInvoice(invoice);
    setShowPreview(true);
  };

  const downloadInvoice = (invoice: SavedInvoice) => {
    // This would integrate with a PDF generation library
    toast({
      title: "PDF Download",
      description: `Downloading invoice ${invoice.invoice_number}...`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div>Loading saved invoices...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button onClick={() => navigate('/')} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Saved Invoices
            </h1>
            <p className="text-gray-600">View and download your saved invoices</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Invoices</CardTitle>
            <CardDescription>
              {invoices.length} saved invoice{invoices.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No saved invoices yet.</p>
                <Button 
                  onClick={() => navigate('/invoices')} 
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
                        <TableCell>${invoice.total.toFixed(2)}</TableCell>
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
              <DialogTitle>Invoice Preview</DialogTitle>
            </DialogHeader>
            {selectedInvoice && <InvoicePreview invoice={selectedInvoice} />}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SavedInvoices;
