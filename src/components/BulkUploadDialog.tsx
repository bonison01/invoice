import { useState } from "react";
import * as XLSX from "xlsx";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Upload, Download } from "lucide-react";
import { InvoiceItem } from "@/pages/Invoices";

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemsAdd: (items: InvoiceItem[]) => void;
}

const BulkUploadDialog = ({ open, onOpenChange, onItemsAdd }: BulkUploadDialogProps) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.xlsx')) {
      setFile(selectedFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload an Excel (.xlsx) file.",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' }); // Each row is an object

      const items: InvoiceItem[] = rows.map((row: any, i: number) => {
        const quantity = parseInt(row['Qty'] || row['Quantity'] || 1);
        const unitPrice = parseFloat(row['Unit Price'] || 0);
        const description = row['Description']?.toString()?.trim() || '';

        if (!description) {
          throw new Error(`Row ${i + 2}: Description is required.`);
        }

        return {
          id: `bulk-${Date.now()}-${i}`,
          date: row['Date'] || new Date().toISOString().split('T')[0],
          orderId: row['Order ID'] || '',
          description,
          quantity,
          unitPrice,
          amount: quantity * unitPrice
        };
      });

      onItemsAdd(items);
      setFile(null);

      // Reset file input
      const fileInput = document.getElementById('bulk-excel-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error("Error reading Excel file:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to parse Excel file.",
        variant: "destructive",
      });
    }

    setIsUploading(false);
  };

  const downloadTemplate = () => {
  const wsData = [
    ["Sl No", "Date", "Order ID", "Description", "Qty", "Unit Price"],
    [1, "2024-01-01", "ORD-001", "Website Development", 1, 75000],
    [2, "2024-01-02", "ORD-002", "Logo Design", 2, 12500],
    [3, "2024-01-03", "ORD-003", "Consulting Services", 4, 7500]
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "InvoiceItems");

  // Fix: use type 'array' and wrap it in a Blob manually
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "invoice_items_template.xlsx";
  a.click();
  URL.revokeObjectURL(url);
};


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Upload Invoice Items</DialogTitle>
          <DialogDescription>
            Upload multiple invoice items from an Excel file (.xlsx)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Excel Template</h4>
              <Button onClick={downloadTemplate} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h5 className="font-medium mb-2">Required Columns (must be in order):</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><strong>1. Sl No</strong> – Serial number (optional)</li>
                <li><strong>2. Date</strong> – Format: YYYY-MM-DD (optional)</li>
                <li><strong>3. Order ID</strong> – Order ID or SKU (optional)</li>
                <li><strong>4. Description</strong> – Description of the item (required)</li>
                <li><strong>5. Qty</strong> – Quantity (required)</li>
                <li><strong>6. Unit Price</strong> – Per unit cost (required)</li>
              </ul>
              <p className="text-xs text-gray-500 mt-2">
                Values are parsed from Excel cells. Ensure all data is in correct columns.
              </p>
            </div>
          </div>

          {/* Upload Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulk-excel-file">Excel File</Label>
              <Input
                id="bulk-excel-file"
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
              />
            </div>

            {file && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Selected file:</strong> {file.name} ({Math.round(file.size / 1024)} KB)
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? "Processing..." : "Add Items"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkUploadDialog;
