
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Customer } from "@/pages/Invoices";
import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CustomerSelectorProps {
  selectedCustomer: Customer | null;
  onCustomerSelect: (customer: Customer | null) => void;
}

const CustomerSelector = ({ selectedCustomer, onCustomerSelect }: CustomerSelectorProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState(selectedCustomer?.name || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadCustomers();
    }
  }, [user]);

  useEffect(() => {
    if (searchTerm && showSuggestions) {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers([]);
    }
  }, [searchTerm, customers, showSuggestions]);

  const loadCustomers = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading customers:', error);
    } else {
      setCustomers(data || []);
    }
    setIsLoading(false);
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSearchTerm(customer.name);
    onCustomerSelect(customer);
    setShowSuggestions(false);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setShowSuggestions(true);
    
    if (!value) {
      onCustomerSelect(null);
    }
  };

  const handleAddCustomer = () => {
    navigate('/customers');
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Label htmlFor="customerSearch">Customer Name</Label>
        <div className="relative">
          <Input
            id="customerSearch"
            placeholder="Start typing customer name or email..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            className="pr-10"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
        
        {showSuggestions && filteredCustomers.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                onClick={() => handleCustomerSelect(customer)}
              >
                <div className="font-medium">{customer.name}</div>
                <div className="text-sm text-gray-500">{customer.email}</div>
                {customer.phone && (
                  <div className="text-sm text-gray-400">{customer.phone}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCustomer && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Selected Customer:</h4>
          <div className="text-sm space-y-1">
            <div><strong>Name:</strong> {selectedCustomer.name}</div>
            <div><strong>Email:</strong> {selectedCustomer.email}</div>
            {selectedCustomer.phone && (
              <div><strong>Phone:</strong> {selectedCustomer.phone}</div>
            )}
            {selectedCustomer.address && (
              <div><strong>Address:</strong> {selectedCustomer.address}</div>
            )}
          </div>
        </div>
      )}

      {user ? (
        <div className="text-center">
          {customers.length === 0 && !isLoading && (
            <p className="text-gray-500 mb-2">No customers found.</p>
          )}
          {isLoading && (
            <p className="text-gray-500 mb-2">Loading customers...</p>
          )}
          <Button onClick={handleAddCustomer} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            {customers.length === 0 ? 'Add Your First Customer' : 'Add New Customer'}
          </Button>
        </div>
      ) : (
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Guest Mode:</strong> You can create an invoice and export it as PDF. 
            To save customers and invoices, please sign in.
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomerSelector;
