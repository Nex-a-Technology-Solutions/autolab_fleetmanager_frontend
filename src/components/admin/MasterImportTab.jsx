import React from 'react';
import AIDataImporter from './AIDataImporter';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function MasterImportTab() {
  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>AI-Powered Import:</strong> Upload any Excel or CSV file with vehicle pricing data. 
          Our AI will analyze the structure and automatically map it to your fleet's pricing system, 
          including vehicle categories, pricing tiers, insurance options, and additional services.
        </AlertDescription>
      </Alert>

      <AIDataImporter />
    </div>
  );
}