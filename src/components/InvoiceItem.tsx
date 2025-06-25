
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { InvoiceItem as InvoiceItemType } from "@/pages/Invoices";

interface InvoiceItemProps {
  item: InvoiceItemType;
  onUpdate: (updatedItem: Partial<InvoiceItemType>) => void;
  onDelete: () => void;
}

const InvoiceItem = ({ item, onUpdate, onDelete }: InvoiceItemProps) => {
  return (
    <div className="grid grid-cols-12 gap-2 items-center p-4 border rounded-lg bg-white">
      <div className="col-span-2">
        <Input
          type="date"
          value={item.date}
          onChange={(e) => onUpdate({ date: e.target.value })}
        />
      </div>
      <div className="col-span-2">
        <Input
          placeholder="Order ID"
          value={item.orderId}
          onChange={(e) => onUpdate({ orderId: e.target.value })}
        />
      </div>
      <div className="col-span-3">
        <Input
          placeholder="Description"
          value={item.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
        />
      </div>
      <div className="col-span-1">
        <Input
          type="number"
          placeholder="Qty"
          value={item.quantity}
          onChange={(e) => onUpdate({ quantity: parseInt(e.target.value) || 0 })}
        />
      </div>
      <div className="col-span-2">
        <Input
          type="number"
          step="0.01"
          placeholder="Unit Price"
          value={item.unitPrice}
          onChange={(e) => onUpdate({ unitPrice: parseFloat(e.target.value) || 0 })}
        />
      </div>
      <div className="col-span-1 text-right font-medium">
        ${item.amount.toFixed(2)}
      </div>
      <div className="col-span-1">
        <Button
          size="sm"
          variant="outline"
          onClick={onDelete}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default InvoiceItem;
