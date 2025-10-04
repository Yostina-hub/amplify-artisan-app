import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CreditCard, Building2, Smartphone } from "lucide-react";

interface PaymentGatewayProps {
  amount: number;
  currency: string;
  onPaymentComplete: (transactionId: string, method: string) => void;
  onCancel: () => void;
}

export const PaymentGatewaySelector = ({
  amount,
  currency,
  onPaymentComplete,
  onCancel,
}: PaymentGatewayProps) => {
  const [selectedGateway, setSelectedGateway] = useState<string>("stripe");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [processing, setProcessing] = useState(false);

  const gateways = [
    {
      id: "stripe",
      name: "Stripe",
      description: "Credit/Debit Card (International)",
      icon: CreditCard,
      currencies: ["USD", "EUR", "GBP"],
    },
    {
      id: "cbe_birr",
      name: "CBE Birr",
      description: "Commercial Bank of Ethiopia",
      icon: Building2,
      currencies: ["ETB"],
    },
    {
      id: "telebirr",
      name: "Telebirr",
      description: "Mobile Money Payment",
      icon: Smartphone,
      currencies: ["ETB"],
    },
  ];

  const handlePayment = async () => {
    setProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock transaction ID
    const transactionId = `MOCK-${selectedGateway.toUpperCase()}-${Date.now()}`;
    
    setProcessing(false);
    onPaymentComplete(transactionId, selectedGateway);
  };

  const availableGateways = gateways.filter(g => 
    g.currencies.includes(currency)
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Select Payment Method</CardTitle>
        <CardDescription>
          Choose your preferred payment gateway (Sandbox Mode)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-muted rounded-lg">
          <div className="text-2xl font-bold">
            {amount.toLocaleString()} {currency}
          </div>
          <div className="text-sm text-muted-foreground">Total Amount</div>
        </div>

        <RadioGroup value={selectedGateway} onValueChange={setSelectedGateway}>
          <div className="space-y-3">
            {availableGateways.map((gateway) => {
              const Icon = gateway.icon;
              return (
                <Label
                  key={gateway.id}
                  htmlFor={gateway.id}
                  className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent transition-colors"
                >
                  <RadioGroupItem value={gateway.id} id={gateway.id} />
                  <Icon className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <div className="font-medium">{gateway.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {gateway.description}
                    </div>
                  </div>
                </Label>
              );
            })}
          </div>
        </RadioGroup>

        {(selectedGateway === "telebirr" || selectedGateway === "cbe_birr") && (
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="09xxxxxxxx"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
        )}

        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="text-sm font-medium text-amber-900 dark:text-amber-100">
            🧪 Sandbox Mode
          </div>
          <div className="text-xs text-amber-700 dark:text-amber-300 mt-1">
            This is a test environment. No real transactions will be processed.
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            className="flex-1"
            disabled={processing || (selectedGateway !== "stripe" && !phoneNumber)}
          >
            {processing ? "Processing..." : "Pay Now"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
