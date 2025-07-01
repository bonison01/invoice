
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import Navbar from "@/components/Navbar";

interface BusinessSettings {
  business_name: string;
  business_address: string;
  business_phone: string;
  business_email: string;
  payment_instructions: string;
  thank_you_note: string;
}

const BusinessSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [settings, setSettings] = useState<BusinessSettings>({
    business_name: '',
    business_address: '',
    business_phone: '',
    business_email: '',
    payment_instructions: 'Payment due within 30 days. Thank you for your business!',
    thank_you_note: 'Thank you for choosing our services.'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBusinessSettings();
    }
  }, [user]);

  const fetchBusinessSettings = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          business_name: data.business_name || '',
          business_address: data.business_address || '',
          business_phone: data.business_phone || '',
          business_email: data.business_email || '',
          payment_instructions: data.payment_instructions || 'Payment due within 30 days. Thank you for your business!',
          thank_you_note: data.thank_you_note || 'Thank you for choosing our services.'
        });
      }
    } catch (error) {
      console.error('Error fetching business settings:', error);
      toast({
        title: "Error",
        description: "Failed to load business settings.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const saveSettings = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('business_settings')
        .upsert(
          {
            user_id: user.id,
            business_name: settings.business_name,
            business_address: settings.business_address,
            business_phone: settings.business_phone,
            business_email: settings.business_email,
            payment_instructions: settings.payment_instructions,
            thank_you_note: settings.thank_you_note,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' } // ✅ ensure updates instead of no-op
        );

      if (error) throw error;

      toast({
        title: "Settings saved!",
        description: "Your business settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving business settings:', error);
      toast({
        title: "Error",
        description: "Failed to save business settings. Please try again.",
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };


  const handleInputChange = (field: keyof BusinessSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-purple-50 flex items-center justify-center">
        <Navbar />
        <div>Loading business settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-purple-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button onClick={() => navigate('/')} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-purple-600 bg-clip-text text-transparent">
              Business Settings
            </h1>
            <p className="text-gray-600">Configure your business information for invoices</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                This information will appear on your invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="business_name">Business Name *</Label>
                  <Input
                    id="business_name"
                    value={settings.business_name}
                    onChange={(e) => handleInputChange('business_name', e.target.value)}
                    placeholder="Your Business Name"
                  />
                </div>
                <div>
                  <Label htmlFor="business_email">Business Email</Label>
                  <Input
                    id="business_email"
                    type="email"
                    value={settings.business_email}
                    onChange={(e) => handleInputChange('business_email', e.target.value)}
                    placeholder="business@example.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="business_phone">Business Phone</Label>
                <Input
                  id="business_phone"
                  value={settings.business_phone}
                  onChange={(e) => handleInputChange('business_phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <Label htmlFor="business_address">Business Address</Label>
                <Textarea
                  id="business_address"
                  value={settings.business_address}
                  onChange={(e) => handleInputChange('business_address', e.target.value)}
                  placeholder="123 Business Street&#10;City, State 12345&#10;Country"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="payment_instructions">Default Payment Instructions</Label>
                <Textarea
                  id="payment_instructions"
                  value={settings.payment_instructions}
                  onChange={(e) => handleInputChange('payment_instructions', e.target.value)}
                  placeholder="Payment terms and instructions..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="thank_you_note">Default Thank You Note</Label>
                <Textarea
                  id="thank_you_note"
                  value={settings.thank_you_note}
                  onChange={(e) => handleInputChange('thank_you_note', e.target.value)}
                  placeholder="Thank you message..."
                  rows={2}
                />
              </div>

              <Button
                onClick={saveSettings}
                disabled={isSaving || !settings.business_name.trim()}
                className="w-full bg-gradient-to-r from-green-600 to-purple-600 hover:from-green-700 hover:to-purple-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BusinessSettings;
