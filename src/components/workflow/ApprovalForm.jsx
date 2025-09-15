import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, AlertTriangle } from "lucide-react";

export default function ApprovalForm({ onComplete, isSubmitting }) {
  const [formData, setFormData] = useState({
    manager_name: '',
    final_inspection_notes: '',
    approved_for_hire: false,
    send_to_maintenance: false,
  });

  const handleApprove = () => {
    if (!formData.manager_name) {
      alert("Manager name is required to approve.");
      return;
    }
    onComplete({ ...formData, approved: true });
  };

  const handleReject = () => {
    if (!formData.manager_name) {
      alert("Manager name is required to send for maintenance.");
      return;
    }
    onComplete({ ...formData, approved: false });
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-blue-600" />
          Final Approval
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-slate-600">Review all checks and approve the vehicle for hire or send it back to maintenance if issues persist.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="manager_name">Approving Manager Name *</Label>
          <Input
            id="manager_name"
            value={formData.manager_name}
            onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
            placeholder="Enter your full name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="final_inspection_notes">Final Inspection Notes</Label>
          <Textarea
            id="final_inspection_notes"
            value={formData.final_inspection_notes}
            onChange={(e) => setFormData({ ...formData, final_inspection_notes: e.target.value })}
            placeholder="Add any final comments or conditions..."
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleReject}
            disabled={isSubmitting}
            variant="destructive"
            className="flex-1"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Reject & Send to Maintenance'}
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isSubmitting}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white"
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Approving...' : 'Approve for Hire'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}