import * as React from 'react';
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function StripeCheckoutButton({ request }) {
  const [loading, setLoading] = React.useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('createCheckout', {
        amount: request.budget,
        requestId: request.id,
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        toast.error('Failed to create checkout');
        setLoading(false);
      }
    } catch (error) {
      toast.error('Error: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={loading}
      className="w-full h-12 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          Pay ${request.budget}
        </>
      )}
    </Button>
  );
}