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
    <div className="grid grid-cols-12 gap-3 items-center p-3 border rounded-xl bg-white shadow-sm">
      {/* Date */}
      <div className="col-span-2 min-w-[110px]">
        <Input
          type="date"
          value={item.date}
          onChange={(e) => onUpdate({ date: e.target.value })}
          className="text-sm"
        />
      </div>

      {/* Order ID */}
      <div className="col-span-2 min-w-[120px]">
        <Input
          placeholder="Order ID"
          value={item.orderId}
          onChange={(e) => onUpdate({ orderId: e.target.value })}
          className="text-sm"
        />
      </div>

      {/* Description */}
      <div className="col-span-3 min-w-[180px]">
        <Input
          placeholder="Description"
          value={item.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className="text-sm"
        />
      </div>

      {/* Quantity */}
      <div className="col-span-1 flex justify-center">
        <Input
          type="number"
          className="text-center text-sm w-full min-w-[70px]"
          value={item.quantity}
          onChange={(e) =>
            onUpdate({ quantity: parseFloat(e.target.value) || 0 })
          }
        />
      </div>

      {/* Unit Price */}
      <div className="col-span-2 min-w-[120px]">
        <Input
          type="number"
          step="0.01"
          placeholder="Unit Price"
          value={item.unitPrice}
          onChange={(e) =>
            onUpdate({ unitPrice: parseFloat(e.target.value) || 0 })
          }
          className="text-sm"
        />
      </div>

      {/* Amount */}
      <div className="col-span-1 text-right font-semibold text-gray-800">
        ₹{item.amount.toFixed(2)}
      </div>

      {/* Delete Button */}
      <div className="col-span-1 flex justify-center">
        <Button
          size="sm"
          variant="outline"
          onClick={onDelete}
          className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-400"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default InvoiceItem;
