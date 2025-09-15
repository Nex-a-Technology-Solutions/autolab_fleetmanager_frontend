import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  FileText, Send, CheckCircle, Clock, Calendar, DollarSign, User, MapPin, AlertTriangle, ArrowRight
} from "lucide-react";
import { format, isAfter } from "date-fns";
import AllocationModal from './AllocationModal';

export default function QuoteStage({ quotes, cars, onRefresh, isLoading }) {
  const [selectedQuote, setSelectedQuote] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'sent': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'accepted': return 'bg-green-100 text-green-700 border-green-200';
      case 'expired': return 'bg-red-100 text-red-700 border-red-200';
      case 'invoiced': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft': return Clock;
      case 'sent': return Send;
      case 'accepted': return CheckCircle;
      case 'expired': return AlertTriangle;
      case 'invoiced': return DollarSign;
      default: return FileText;
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {Array(3).fill(0).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-slate-200 rounded mb-2"></div>
              <div className="h-6 bg-slate-200 rounded mb-4 w-1/2"></div>
              <div className="flex gap-2">
                <div className="h-8 bg-slate-200 rounded w-20"></div>
                <div className="h-8 bg-slate-200 rounded w-24"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No quotes found</h3>
          <p className="text-slate-600 mb-4">Create your first quote to get started with the booking process.</p>
          <Button onClick={() => window.open('/Quoting', '_blank')}>
            Create New Quote
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {quotes.map((quote, index) => {
        const StatusIcon = getStatusIcon(quote.status);
        const isExpired = quote.valid_until && isAfter(new Date(), new Date(quote.valid_until));
        const actualStatus = isExpired && quote.status === 'sent' ? 'expired' : quote.status;
        
        return (
          <motion.div
            key={quote.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <StatusIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Quote #{quote.quote_number}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <User className="w-3 h-3" />
                        <span>{quote.customer_name}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(actualStatus)} border font-medium`}>
                    {actualStatus.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* ... existing card content for quote details ... */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Pickup</p>
                      <p className="font-medium">
                        {quote.pickup_date ? format(new Date(quote.pickup_date), 'MMM d, yyyy') : 'Not set'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Vehicle</p>
                      <p className="font-medium">{quote.vehicle_category || 'Any'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Total</p>
                      <p className="font-medium">${quote.total?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Duration</p>
                      <p className="font-medium">{quote.hire_duration_days || 0} days</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-xs text-slate-500">
                    Created: {quote.created_date ? format(new Date(quote.created_date), 'MMM d, h:mm a') : 'Unknown'}
                    {quote.valid_until && (
                      <span className={`ml-3 ${isExpired ? 'text-red-600' : ''}`}>
                        Valid until: {format(new Date(quote.valid_until), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {quote.status === 'sent' && !isExpired && (
                      <Button
                        size="sm"
                        onClick={() => setSelectedQuote(quote)}
                        className="text-white"
                        style={{background: 'var(--wwfh-red)'}}
                      >
                        Convert to Reservation <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}

      <AllocationModal
        isOpen={!!selectedQuote}
        onClose={() => setSelectedQuote(null)}
        quote={selectedQuote}
        cars={cars}
        onRefresh={onRefresh}
      />
    </div>
  );
}