
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Customer } from "@/pages/Invoices";
import { Plus } from "lucide-react";

interface CustomerSelectorProps {
  selectedCustomer: Customer | null;
  onCustomerSelect: (customer: Customer | null) => void;
}

const CustomerSelector = ({ selectedCustomer, onCustomerSelect }: CustomerSelectorProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState(selectedCustomer?.name || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("invoice_user") || "{}");
    const userCustomers = JSON.parse(localStorage.getItem(`customers_${user.id}`) || "[]");
    setCustomers(userCustomers);
  }, []);

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

  return (
    <div className="space-y-4">
      <div className="relative">
        <Label htmlFor="customerSearch">Customer Name</Label>
        <Input
          id="customerSearch"
          placeholder="Start typing customer name..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
        />
        
        {showSuggestions && filteredCustomers.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                onClick={() => handleCustomerSelect(customer)}
              >
                <div className="font-medium">{customer.name}</div>
                <div className="text-sm text-gray-500">{customer.email}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCustomer && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Selected Customer:</h4>
          <div className="text-sm">
            <div><strong>Name:</strong> {selectedCustomer.name}</div>
            <div><strong>Email:</strong> {selectedCustomer.email}</div>
            {selectedCustomer.address && (
              <div><strong>Address:</strong> {selectedCustomer.address}</div>
            )}
          </div>
        </div>
      )}

      {customers.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <p className="mb-2">No customers found.</p>
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
      )}
    </div>
  );
};

export default CustomerSelector;
