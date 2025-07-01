
import { useState } from "react";
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
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file.",
        variant: "destructive",
      });
    }
  };

  const parseCSV = (csvText: string): InvoiceItem[] => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Expected column order: sl_no, date, order_id, description, quantity, unit_price
    const expectedHeaders = ['sl_no', 'date', 'order_id', 'description', 'quantity', 'unit_price'];
    
    const items: InvoiceItem[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map(v => v.trim());
      
      // Map values by position, not by header names
      const slNo = values[0] || '';
      const date = values[1] || new Date().toISOString().split('T')[0];
      const orderId = values[2] || '';
      const description = values[3] || '';
      const quantity = parseInt(values[4]) || 1;
      const unitPrice = parseFloat(values[5]) || 0;

      // Validate required fields
      if (!description) {
        throw new Error(`Row ${i + 1}: Description is required`);
      }

      items.push({
        id: `bulk-${Date.now()}-${i}`,
        date,
        orderId,
        description,
        quantity,
        unitPrice,
        amount: quantity * unitPrice,
      });
    }

    return items;
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const csvText = await file.text();
      const items = parseCSV(csvText);

      onItemsAdd(items);
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('bulk-csv-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to parse CSV file.",
        variant: "destructive",
      });
    }
    setIsUploading(false);
  };

  const downloadTemplate = () => {
    const template = `Sl No,Date,Order ID,Description,Qty,Unit Price
1,2024-01-01,ORD-001,Website Development,1,75000
2,2024-01-02,ORD-002,Logo Design,2,12500
3,2024-01-03,ORD-003,Consulting Services,4,7500`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoice_items_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Upload Invoice Items</DialogTitle>
          <DialogDescription>
            Upload multiple invoice items from a CSV file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">CSV Template</h4>
              <Button onClick={downloadTemplate} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h5 className="font-medium mb-2">Column order (must be followed exactly):</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><strong>1. Sl No:</strong> Serial number (optional)</li>
                <li><strong>2. Date:</strong> Date in YYYY-MM-DD format (optional, defaults to today)</li>
                <li><strong>3. Order ID:</strong> Order ID (optional)</li>
                <li><strong>4. Description:</strong> Item description (required)</li>
                <li><strong>5. Qty:</strong> Quantity (number, required)</li>
                <li><strong>6. Unit Price:</strong> Price per unit in rupees (number, required)</li>
              </ul>
              <p className="text-xs text-gray-500 mt-2">
                Note: Values are assigned by column position, not by header names. Follow the exact order above.
              </p>
            </div>
          </div>

          {/* Upload Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulk-csv-file">CSV File</Label>
              <Input
                id="bulk-csv-file"
                type="file"
                accept=".csv"
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
                {isUploading ? 'Processing...' : 'Add Items'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkUploadDialog;
