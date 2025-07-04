-- Create inventory products table
CREATE TABLE public.inventory_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_price DECIMAL(10,2),
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER DEFAULT 0,
  max_stock_level INTEGER,
  unit TEXT DEFAULT 'piece',
  category TEXT,
  barcode TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory stock movements table for tracking changes
CREATE TABLE public.inventory_stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.inventory_products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity INTEGER NOT NULL,
  reference_type TEXT, -- 'invoice', 'purchase', 'adjustment', etc.
  reference_id UUID, -- could reference invoice id, etc.
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS on inventory tables
ALTER TABLE public.inventory_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_stock_movements ENABLE ROW LEVEL SECURITY;

-- Create policies for inventory_products
CREATE POLICY "Users can view their own inventory products" 
ON public.inventory_products 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own inventory products" 
ON public.inventory_products 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory products" 
ON public.inventory_products 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory products" 
ON public.inventory_products 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for inventory_stock_movements
CREATE POLICY "Users can view their own stock movements" 
ON public.inventory_stock_movements 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can create stock movements" 
ON public.inventory_stock_movements 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

-- Create function to update stock levels
CREATE OR REPLACE FUNCTION public.update_product_stock(
  product_id UUID,
  quantity_change INTEGER,
  movement_type TEXT,
  reference_type TEXT DEFAULT NULL,
  reference_id UUID DEFAULT NULL,
  notes TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update product stock
  UPDATE public.inventory_products 
  SET 
    current_stock = current_stock + quantity_change,
    updated_at = now()
  WHERE id = product_id AND user_id = current_user_id;
  
  -- Record stock movement
  INSERT INTO public.inventory_stock_movements (
    product_id, movement_type, quantity, reference_type, 
    reference_id, notes, created_by
  ) VALUES (
    product_id, movement_type, quantity_change, reference_type,
    reference_id, notes, current_user_id
  );
  
  RETURN TRUE;
END;
$$;

-- Create function to get low stock products
CREATE OR REPLACE FUNCTION public.get_low_stock_products(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  current_stock INTEGER,
  min_stock_level INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.current_stock,
    p.min_stock_level
  FROM public.inventory_products p
  WHERE p.user_id = user_uuid 
    AND p.is_active = true
    AND p.current_stock <= p.min_stock_level;
END;
$$;

-- Add indexes for better performance
CREATE INDEX idx_inventory_products_user_id ON public.inventory_products(user_id);
CREATE INDEX idx_inventory_products_sku ON public.inventory_products(sku);
CREATE INDEX idx_inventory_stock_movements_product_id ON public.inventory_stock_movements(product_id);
CREATE INDEX idx_inventory_stock_movements_created_by ON public.inventory_stock_movements(created_by);

-- Create trigger for automatic updated_at
CREATE OR REPLACE FUNCTION public.update_inventory_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inventory_products_updated_at
BEFORE UPDATE ON public.inventory_products
FOR EACH ROW
EXECUTE FUNCTION public.update_inventory_updated_at_column();