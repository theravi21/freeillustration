import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Unlock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface LeadCaptureProps {
  onEmailCaptured: (email: string) => void;
}

const LeadCapture: React.FC<LeadCaptureProps> = ({ onEmailCaptured }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Store email in leads table
      const { error } = await supabase
        .from('leads')
        .insert([{ email }]);

      if (error && !error.message.includes('duplicate key')) {
        throw error;
      }

      // Store email in localStorage for session persistence
      localStorage.setItem('capturedEmail', email);
      
      toast({
        title: "Welcome!",
        description: "Email captured successfully. You now have full access to browse and upload illustrations.",
      });
      
      onEmailCaptured(email);
    } catch (error) {
      console.error('Error capturing email:', error);
      toast({
        title: "Error",
        description: "Failed to process email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Unlock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">
            Unlock Free <span className="text-primary">Illustrations</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Get instant access to thousands of high-quality illustrations. 
            Just enter your email to start browsing and uploading.
          </p>
        </div>

        {/* Email Capture Form */}
        <Card className="border-2 hover:border-primary/20 transition-colors duration-200">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Enter Your Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="sr-only">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 text-base hover:scale-105 active:scale-95 transition-all duration-200 transform hover:shadow-lg hover:shadow-primary/25"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Get Instant Access'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">10K+</div>
            <div className="text-sm text-muted-foreground">Free Illustrations</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">SVG & PNG</div>
            <div className="text-sm text-muted-foreground">High Quality</div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center">
          By continuing, you agree to receive updates about new illustrations and features. 
          You can unsubscribe at any time.
        </p>
      </div>
    </div>
  );
};

export default LeadCapture;