import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const BillingSystemAlert = () => {
  return (
    <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-900 dark:text-blue-100">
        New Unified Billing Management
      </AlertTitle>
      <AlertDescription className="text-blue-800 dark:text-blue-200 space-y-2">
        <p>
          We've consolidated subscription, payment, and pricing management into a single professional dashboard for better workflow and data consistency.
        </p>
        <Link to="/admin/billing">
          <Button variant="link" className="p-0 h-auto text-blue-600 dark:text-blue-400">
            Go to New Billing Dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
};
