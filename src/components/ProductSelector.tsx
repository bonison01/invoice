import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Package } from "lucide-react";
import { InventoryProduct } from "@/pages/Inventory";

interface ProductSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectProduct: (product: InventoryProduct, quantity: number) => void;
}

const ProductSelector = ({ open, onOpenChange, onSelectProduct }: ProductSelectorProps) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<InventoryProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchProducts();
    }
  }, [open, user]);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm]);

  const fetchProducts = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory_products')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
    setIsLoading(false);
  };

  const filterProducts = () => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const handleSelectProduct = (product: InventoryProduct) => {
    setSelectedProduct(product);
    setQuantity(1);
  };

  const handleAddToInvoice = () => {
    if (selectedProduct && quantity > 0) {
      onSelectProduct(selectedProduct, quantity);
      onOpenChange(false);
      setSelectedProduct(null);
      setQuantity(1);
      setSearchTerm("");
    }
  };

  const getStockStatus = (product: InventoryProduct) => {
    if (product.current_stock === 0) return { status: "Out of Stock", variant: "destructive" as const, available: false };
    if (product.current_stock <= product.min_stock_level) return { status: "Low Stock", variant: "secondary" as const, available: true };
    return { status: "In Stock", variant: "default" as const, available: true };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Select Product from Inventory
          </DialogTitle>
          <DialogDescription>
            Choose a product from your inventory to add to the invoice
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search products by name, SKU, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Products Table */}
          <div className="flex-1 overflow-auto border rounded-lg">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                Loading products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                No products found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product);
                    return (
                      <TableRow 
                        key={product.id}
                        className={selectedProduct?.id === product.id ? "bg-muted" : ""}
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            {product.description && (
                              <div className="text-sm text-muted-foreground">
                                {product.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{product.sku || "-"}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {product.current_stock} {product.unit}
                          </div>
                        </TableCell>
                        <TableCell>₹{product.unit_price.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={stockStatus.variant}>
                            {stockStatus.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={selectedProduct?.id === product.id ? "default" : "outline"}
                            onClick={() => handleSelectProduct(product)}
                            disabled={!stockStatus.available}
                          >
                            {selectedProduct?.id === product.id ? "Selected" : "Select"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Selected Product Details */}
          {selectedProduct && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <h4 className="font-medium mb-2">Selected Product: {selectedProduct.name}</h4>
              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={selectedProduct.current_stock}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Available: {selectedProduct.current_stock} {selectedProduct.unit}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Amount</div>
                  <div className="text-lg font-semibold">
                    ₹{(selectedProduct.unit_price * quantity).toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setSelectedProduct(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddToInvoice}
                  disabled={quantity <= 0 || quantity > selectedProduct.current_stock}
                >
                  Add to Invoice
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductSelector;