import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Invoice } from "@/pages/Invoices";
import { IndianRupee } from "lucide-react";
import { useAuth } from "@/hooks/useAuth"; // ✅ Added for guest detection

interface InvoicePreviewProps {
  invoice: Invoice;
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  sealUrl?: string;
  signatureUrl?: string;
  isPrint?: boolean;
}

const InvoicePreview = ({
  invoice,
  businessName,
  businessAddress,
  businessPhone,
  sealUrl,
  signatureUrl,
}: InvoicePreviewProps) => {
  const { user } = useAuth();
  const isGuest = !user; // ✅ Guest mode if not logged in

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
                <div className="text-lg font-semibold">{businessName || "Business Name"}</div>
                {businessAddress && (
                  <div className="text-sm text-gray-600 mt-1 whitespace-pre-line">{businessAddress}</div>
                )}
                {businessPhone && <div className="text-sm text-gray-600">{businessPhone}</div>}
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
                      <TableCell className="text-xs">
                        <span className="inline-flex items-baseline">
                          <IndianRupee className="w-3 h-3 mr-1" style={{ verticalAlign: "baseline" }} />
                          <span>{item.unitPrice.toFixed(2)}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        <span className="inline-flex items-baseline">
                          <IndianRupee className="w-3 h-3 mr-1" style={{ verticalAlign: "baseline" }} />
                          <span>{(item.unitPrice * item.quantity).toFixed(2)}</span>
                        </span>
                      </TableCell>
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
                  <div className="flex items-center">
                    <IndianRupee className="w-4 h-4 mr-1" />
                    {invoice.subtotal.toFixed(2)}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({invoice.taxRate}%):</span>
                  <div className="flex items-center">
                    <IndianRupee className="w-4 h-4 mr-1" />
                    {invoice.taxAmount.toFixed(2)}
                  </div>
                </div>
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <div className="flex items-center">
                      -<IndianRupee className="w-4 h-4 mr-1" />
                      {invoice.discountAmount.toFixed(2)}
                    </div>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <div className="flex items-center">
                    <IndianRupee className="w-4 h-4 mr-1" />
                    {invoice.total.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t pt-6 relative">
            {/* Seal */}
            {sealUrl && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
                <img
                  src={sealUrl}
                  alt="Business Seal"
                  style={{ width: "300px", height: "300px", objectFit: "contain" }}
                />
              </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:space-x-8 relative z-10">
              {/* ✅ Only show payment info if not guest */}
              {!isGuest && (
                <div className="flex-1 space-y-4">
                  {invoice.paymentInstructions && (
                    <div>
                      <h4 className="font-semibold mb-2">Payment Instructions:</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.paymentInstructions}</p>
                    </div>
                  )}

                  {/* UPI */}
                  <div>
                    <h4 className="font-semibold mb-1">Payment UPI:</h4>
                    <p className="text-sm text-gray-700">doeasy01-4@okaxis</p>
                  </div>

                  {/* Bank Details */}
                  <div>
                    <h4 className="font-semibold mb-1">Bank Details:</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      JUSTMATENG SERVICE PRIVATE LIMITED
                      {"\n"}A/C No: 43261950171
                      {"\n"}IFSC: SBIN0005320
                    </p>
                  </div>
                </div>
              )}

              {/* Signature */}
              {signatureUrl && (
                <div className="w-64 text-center mt-6 md:mt-0 relative">
                  <div className="relative h-40 flex items-end justify-center">
                    <img
                      src={signatureUrl}
                      alt="Signature"
                      className="absolute top-0 left-1/2 transform -translate-x-1/2 object-contain w-[300px] h-[200px] opacity-90"
                    />
                    <p className="text-xs text-gray-500 z-10">Authorized Signature</p>
                  </div>
                </div>
              )}
            </div>

            {/* Thank You Note */}
            {invoice.thankYouNote && (
              <div className="mt-6">
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
