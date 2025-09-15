import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';

export default function CustomerInfoStep({ onNext, onBack, initialData }) {
  const [customerName, setCustomerName] = useState(initialData.customer_name || "");
  const [evaluatorName, setEvaluatorName] = useState(initialData.evaluator_name || "");
  const [returnDate, setReturnDate] = useState(initialData.expected_return_date || "");

  const handleContinue = () => {
    onNext({
      customer_name: customerName,
      evaluator_name: evaluatorName,
      expected_return_date: returnDate,
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Customer and Rental Information</h2>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="customer_name">Customer Full Name</Label>
          <Input
            id="customer_name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="John Doe"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="evaluator_name">Evaluator Name</Label>
          <Input
            id="evaluator_name"
            value={evaluatorName}
            onChange={(e) => setEvaluatorName(e.target.value)}
            placeholder="Your Name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="return_date">Expected Return Date</Label>
          <Input
            id="return_date"
            type="datetime-local"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleContinue} disabled={!customerName || !evaluatorName || !returnDate}>
          Continue to Inspection
        </Button>
      </div>
    </motion.div>
  );
}