// components/InvoicePreview.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Invoice } from "@/pages/Invoices";

interface InvoicePreviewProps {
  invoice: Invoice;
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  isPrint?: boolean; // 👈 Add this line
}

const InvoicePreview = ({
  invoice,
  businessName,
  businessAddress,
  businessPhone,
}: InvoicePreviewProps) => {
  return (
    <Card className="max-h-screen overflow-auto">
      <CardHeader>
        {/* <CardTitle>Invoice Preview</CardTitle> */}
      </CardHeader>
      <CardContent>
        <div className="space-y-6 bg-white p-6 border rounded-lg">
          {/* Header */}
          <div className="border-b pb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">INVOICE</h1>
                <p className="text-gray-600">#{invoice.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">{businessName}</div>
                {businessAddress && (
                  <div className="text-sm text-gray-600 mt-1 whitespace-pre-line">{businessAddress}</div>
                )}
                {businessPhone && (
                  <div className="text-sm text-gray-600">{businessPhone}</div>
                )}
                <div className="text-sm text-gray-600 mt-2">Date: {invoice.date}</div>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          {invoice.customer && (
            <div className="border-b pb-6">
              <h3 className="font-semibold mb-2">Bill To:</h3>
              <div className="text-sm">
                <div className="font-medium">{invoice.customer.name}</div>
                <div>{invoice.customer.email}</div>
                {invoice.customer.address && (
                  <div className="mt-1 whitespace-pre-line">{invoice.customer.address}</div>
                )}
              </div>
            </div>
          )}

          {/* Items Table */}
          {invoice.items.length > 0 && (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">SL No.</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Order ID</TableHead>
                    <TableHead className="text-xs">Description</TableHead>
                    <TableHead className="text-xs">Qty</TableHead>
                    <TableHead className="text-xs">Unit Price</TableHead>
                    <TableHead className="text-xs text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs">{index + 1}</TableCell>
                      <TableCell className="text-xs">{item.date}</TableCell>
                      <TableCell className="text-xs">{item.orderId}</TableCell>
                      <TableCell className="text-xs">{item.description}</TableCell>
                      <TableCell className="text-xs">{item.quantity}</TableCell>
                      <TableCell className="text-xs">${item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-right">${item.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Totals */}
          <div className="border-t pt-6">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${invoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({invoice.taxRate}%):</span>
                  <span>${invoice.taxAmount.toFixed(2)}</span>
                </div>
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-${invoice.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>${invoice.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t pt-6 space-y-4">
            {invoice.paymentInstructions && (
              <div>
                <h4 className="font-semibold mb-2">Payment Instructions:</h4>
                <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.paymentInstructions}</p>
              </div>
            )}
            {invoice.thankYouNote && (
              <div>
                <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.thankYouNote}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoicePreview;
