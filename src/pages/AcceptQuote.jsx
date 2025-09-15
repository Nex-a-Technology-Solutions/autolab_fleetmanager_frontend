import React, { useState, useEffect } from 'react';
import { Quote } from '@/api/entities';
import { Reservation } from '@/api/entities';
import { Notification } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Calendar, Phone, User, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AcceptQuote() {
    const [quote, setQuote] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAccepting, setIsAccepting] = useState(false);
    const [isAccepted, setIsAccepted] = useState(false);
    const [error, setError] = useState(null);
    const [customerPhone, setCustomerPhone] = useState('');
    const [pickupDate, setPickupDate] = useState('');
    const [dropoffDate, setDropoffDate] = useState('');

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const quoteId = urlParams.get('id');
        
        if (quoteId) {
            loadQuote(quoteId);
        } else {
            setError('Invalid quote link. Please contact us for assistance.');
            setIsLoading(false);
        }
    }, []);

    const loadQuote = async (quoteId) => {
        try {
            const quoteData = await Quote.filter({ id: quoteId });
            if (quoteData.length > 0) {
                const quote = quoteData[0];
                if (quote.status === 'accepted') {
                    setIsAccepted(true);
                } else if (quote.status === 'expired') {
                    setError('This quote has expired. Please contact us for a new quote.');
                } else {
                    setQuote(quote);
                }
            } else {
                setError('Quote not found. Please contact us for assistance.');
            }
        } catch (err) {
            console.error('Error loading quote:', err);
            setError('Failed to load quote. Please try again.');
        }
        setIsLoading(false);
    };

    const handleAcceptQuote = async () => {
        if (!customerPhone || !pickupDate || !dropoffDate) {
            alert('Please fill in all required fields.');
            return;
        }

        setIsAccepting(true);
        try {
            // Update quote status
            await Quote.update(quote.id, { 
                status: 'accepted',
                accepted_date: new Date().toISOString()
            });

            // Create reservation
            const reservationData = {
                quote_id: quote.id,
                customer_name: quote.customer_name,
                customer_email: quote.customer_email,
                customer_phone: customerPhone,
                vehicle_category: quote.vehicle_category,
                pickup_date: new Date(pickupDate).toISOString(),
                dropoff_date: new Date(dropoffDate).toISOString(),
                pickup_location: quote.pickup_location,
                dropoff_location: quote.dropoff_location,
                total_amount: quote.total,
                status: 'pending_confirmation',
                confirmation_required_by: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
            };

            const reservation = await Reservation.create(reservationData);

            // Create notification for admin
            await Notification.create({
                type: 'reservation_pending',
                title: 'New Reservation Requires Confirmation',
                message: `${quote.customer_name} has accepted quote #${quote.quote_number} for ${quote.vehicle_category}. Pickup: ${new Date(pickupDate).toLocaleDateString()}`,
                priority: 'high',
                related_entity_id: reservation.id,
                related_entity_type: 'reservation',
                action_required: true,
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            });

            setIsAccepted(true);
        } catch (err) {
            console.error('Error accepting quote:', err);
            alert('Failed to accept quote. Please try again.');
        }
        setIsAccepting(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="p-6 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p>Loading quote...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="p-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Unable to Load Quote</h2>
                        <p className="text-slate-600 mb-4">{error}</p>
                        <p className="text-sm text-slate-500">
                            Contact us at <strong>fleet@wwfh.com.au</strong> for assistance.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isAccepted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <Card className="w-full max-w-2xl">
                        <CardContent className="p-8 text-center">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">Quote Accepted Successfully!</h1>
                            <p className="text-slate-600 mb-6">
                                Thank you for accepting our quote. We've received your reservation request and will confirm availability within 24 hours.
                            </p>
                            <div className="bg-blue-50 p-4 rounded-lg text-left">
                                <h3 className="font-semibold text-slate-900 mb-2">Next Steps:</h3>
                                <ul className="text-sm text-slate-700 space-y-1">
                                    <li>• We'll confirm vehicle availability and send you a confirmation email</li>
                                    <li>• Payment details will be included in the confirmation</li>
                                    <li>• You'll receive pickup instructions 24 hours before your rental</li>
                                </ul>
                            </div>
                            <p className="text-sm text-slate-500 mt-4">
                                Questions? Contact us at <strong>fleet@wwfh.com.au</strong>
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
            <div className="max-w-4xl mx-auto py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="shadow-xl">
                        <CardHeader className="text-center" style={{background: 'linear-gradient(135deg, var(--wwfh-navy), var(--wwfh-navy-light))'}}>
                            <CardTitle className="text-white text-2xl">Accept Your Quote</CardTitle>
                            <p className="text-slate-200">Quote #{quote?.quote_number}</p>
                        </CardHeader>
                        <CardContent className="p-8">
                            {/* Quote Summary */}
                            <div className="grid md:grid-cols-2 gap-8 mb-8">
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Quote Details</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Vehicle:</span>
                                            <span className="font-medium">{quote?.vehicle_category}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Duration:</span>
                                            <span className="font-medium">{quote?.hire_duration_days} days</span>
                                        </div>
                                        {quote?.pickup_location && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Pickup:</span>
                                                <span className="font-medium">{quote.pickup_location}</span>
                                            </div>
                                        )}
                                        {quote?.dropoff_location && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Dropoff:</span>
                                                <span className="font-medium">{quote.dropoff_location}</span>
                                            </div>
                                        )}
                                        <hr className="my-3"/>
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>Total (inc. GST):</span>
                                            <span>${quote?.total?.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Acceptance Form */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Confirm Your Details</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="phone">Contact Phone Number *</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                                <Input
                                                    id="phone"
                                                    type="tel"
                                                    placeholder="Enter your phone number"
                                                    value={customerPhone}
                                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                                    className="pl-10"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="pickup">Preferred Pickup Date *</Label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                                <Input
                                                    id="pickup"
                                                    type="date"
                                                    value={pickupDate}
                                                    onChange={(e) => setPickupDate(e.target.value)}
                                                    className="pl-10"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="dropoff">Preferred Dropoff Date *</Label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                                <Input
                                                    id="dropoff"
                                                    type="date"
                                                    value={dropoffDate}
                                                    onChange={(e) => setDropoffDate(e.target.value)}
                                                    className="pl-10"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Terms and Accept Button */}
                            <div className="border-t pt-6">
                                <div className="bg-slate-50 p-4 rounded-lg mb-6">
                                    <h4 className="font-semibold mb-2">Terms & Conditions</h4>
                                    <ul className="text-sm text-slate-600 space-y-1">
                                        <li>• Vehicle availability is subject to confirmation</li>
                                        <li>• Full payment is required before vehicle pickup</li>
                                        <li>• Valid driver's license required for all drivers</li>
                                        <li>• Vehicle must be returned in same condition</li>
                                    </ul>
                                </div>
                                
                                <div className="text-center">
                                    <Button
                                        onClick={handleAcceptQuote}
                                        disabled={isAccepting}
                                        size="lg"
                                        className="text-white px-8 py-3"
                                        style={{background: 'var(--wwfh-red)'}}
                                    >
                                        {isAccepting ? 'Processing...' : 'Accept Quote & Create Reservation'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}