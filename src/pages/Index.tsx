import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Settings, Archive, CheckCircle, Clock, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Feature {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Invoice Generator
            </h1>
            <p className="text-gray-600">Create professional invoices in minutes</p>
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {user.email}</span>
              <Button onClick={handleSignOut} variant="outline" size="sm">
                Sign Out
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigate('/invoices')}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Create Invoice</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Generate professional invoices with customizable templates and automatic calculations.
              </CardDescription>
            </CardContent>
          </Card>

          {user && (
            <>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigate('/customers')}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <CardTitle>Manage Customers</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Add and organize your customer information for quick invoice creation.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigate('/saved-invoices')}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <Archive className="w-6 h-6 text-purple-600" />
                    </div>
                    <CardTitle>Saved Invoices</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    View and download your previously saved invoices.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigate('/business-settings')}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                      <Settings className="w-6 h-6 text-orange-600" />
                    </div>
                    <CardTitle>Business Settings</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Configure your business information and invoice defaults.
                  </CardDescription>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {!user && (
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Ready to get started?</h2>
            <p className="text-gray-600 mb-6">Sign up to save your invoices and manage customers</p>
            <Button onClick={() => navigate('/auth')} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Sign Up / Sign In
            </Button>
          </div>
        )}

        <section className="mb-16">
          <h2 className="text-3xl font-semibold mb-8 text-center">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              title="Easy Invoice Creation"
              description="Create and customize invoices quickly with our intuitive interface."
              icon={CheckCircle}
            />
            <FeatureCard
              title="Customer Management"
              description="Manage your customers efficiently, making invoicing a breeze."
              icon={Users}
            />
            <FeatureCard
              title="Save and Download"
              description="Save your invoices securely and download them in PDF format."
              icon={Archive}
            />
            <FeatureCard
              title="Payment Tracking"
              description="Keep track of payments and send reminders to your clients."
              icon={Clock}
            />
            <FeatureCard
              title="Secure and Reliable"
              description="Your data is safe with us. We use industry-standard security measures."
              icon={Shield}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon: Icon }) => (
  <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
    <div className="flex items-center mb-4">
      <div className="p-3 bg-blue-100 text-blue-600 rounded-full mr-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
    </div>
    <p className="text-gray-600">{description}</p>
  </div>
);

export default Index;
