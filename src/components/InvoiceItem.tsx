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
    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center border rounded-lg px-3 py-2 mb-2 bg-white shadow-sm">
  <Input
    type="date"
    value={item.date}
    onChange={(e) => onUpdate({ date: e.target.value })}
    className="md:col-span-1"
  />

  <Input
    placeholder="Order ID"
    value={item.orderId}
    onChange={(e) => onUpdate({ orderId: e.target.value })}
    className="md:col-span-1"
  />

  <Input
    placeholder="Description"
    value={item.description}
    onChange={(e) => onUpdate({ description: e.target.value })}
    className="md:col-span-2"
  />

  <Input
    type="number"
    value={item.quantity}
    onChange={(e) => onUpdate({ quantity: Number(e.target.value) })}
    className="md:col-span-1"
  />

  <Input
    type="number"
    value={item.unitPrice}
    onChange={(e) => onUpdate({ unitPrice: Number(e.target.value) })}
    className="md:col-span-1"
  />

  <div className="flex items-center justify-between md:justify-end gap-3 md:col-span-6">
    <span className="font-medium text-gray-700">
      ₹{item.amount.toFixed(2)}
    </span>
    <Button
      variant="destructive"
      size="icon"
      onClick={onDelete}
      className="w-8 h-8 rounded-full"
    >
      🗑
    </Button>
  </div>
</div>

  );
};

export default InvoiceItem;
