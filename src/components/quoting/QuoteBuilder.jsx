
import React, { useState, useEffect } from 'react';
import { Location } from '@/api/entities';
import { VehicleType } from '@/api/entities';
import { PricingRule } from '@/api/entities';
import { Quote } from '@/api/entities';
import { ThemeSettings } from '@/api/entities';
import { SendEmail } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Trash2, FileText, Send, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import QuotePreview from './QuotePreview';

const howHeardOptions = ["Repeat Customer", "You received an email from us", "Vehicle Sign Writing / Advertising", "Internet Search", "Word of Mouth", "Other"];

export default function QuoteBuilder() {
    const [vehicleTypes, setVehicleTypes] = useState([]);
    const [locations, setLocations] = useState([]);
    // State for dynamic options from PricingRule entity
    const [insuranceOptions, setInsuranceOptions] = useState([]);
    const [kmOptions, setKmOptions] = useState([]);
    const [requirementOptions, setRequirementOptions] = useState([]);

    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedQuote, setGeneratedQuote] = useState(null);
    const [isPreviewing, setIsPreviewing] = useState(false); // New state for preview mode

    const [quote, setQuote] = useState({
        customer_name: "",
        customer_email: "",
        pickup_date: null, // New state
        pickup_time: "09:00", // New state
        dropoff_date: null, // New state
        dropoff_time: "17:00", // New state
        hire_duration_days: 1, // Will be calculated
        vehicle_category: "", // Track selected vehicle category for recalculations
        pickup_location: "",
        dropoff_location: "",
        line_items: [],
        notes: "",
        how_heard: "", // Added to state
        // New states to track selected pricing rules for easy recalculation
        selectedInsuranceRuleId: null,
        selectedRequirementRuleIds: [], // For multiple selections
        selectedKmOptionName: null, // Storing the name for KM option for now
    });
    const [totals, setTotals] = useState({ subtotal: 0, tax: 0, total: 0 });

    useEffect(() => {
        loadData();
    }, []);

    // Calculate hire duration based on pickup/dropoff dates and times
    useEffect(() => {
        if (quote.pickup_date && quote.dropoff_date) {
            const duration = calculateHireDuration(
                quote.pickup_date, 
                quote.pickup_time, 
                quote.dropoff_date, 
                quote.dropoff_time
            );
            if (duration !== quote.hire_duration_days) {
                setQuote(prev => ({ ...prev, hire_duration_days: duration }));
                // Trigger line item recalculation based on new duration
                handleDurationChange(duration);
            }
        }
    }, [quote.pickup_date, quote.pickup_time, quote.dropoff_date, quote.dropoff_time]);

    // Helper function to calculate hire duration with 2 PM rules
    const calculateHireDuration = (pickupDate, pickupTime, dropoffDate, dropoffTime) => {
        if (!pickupDate || !dropoffDate) return 1;

        const pickup = new Date(pickupDate);
        const dropoff = new Date(dropoffDate);
        
        // Parse times
        const [pickupHour, pickupMin] = pickupTime.split(':').map(Number);
        const [dropoffHour, dropoffMin] = dropoffTime.split(':').map(Number);
        
        pickup.setHours(pickupHour, pickupMin);
        dropoff.setHours(dropoffHour, dropoffMin);

        const diffTime = dropoff.getTime() - pickup.getTime();
        let days = diffTime / (1000 * 60 * 60 * 24); // Floating point days

        // Apply 2 PM rules
        // If pickup after 2 PM (14:00), effectively reduce the duration by half a day for calculation
        if (pickupHour >= 14) {
            days -= 0.5;
        }
        // If dropoff after 2 PM (14:00), effectively add half a day to the duration for calculation
        if (dropoffHour >= 14) {
            days += 0.5;
        }
        
        // Ensure minimum 1 day and round up to the nearest full day for billing
        return Math.max(1, Math.ceil(days));
    };

    const loadData = async () => {
        try {
            const [vehicleData, locationData, pricingRuleData] = await Promise.all([
                VehicleType.list('name'),
                Location.list('name'),
                PricingRule.list()
            ]);
            setVehicleTypes(vehicleData.filter(v => v.active));
            setLocations(locationData.filter(l => l.active));
            
            // Filter pricing rules into their respective categories
            const activeRules = pricingRuleData.filter(r => r.active);
            setInsuranceOptions(activeRules.filter(r => r.type === 'insurance'));
            setKmOptions(activeRules.filter(r => r.type === 'km_allowance'));
            setRequirementOptions(activeRules.filter(r => r.type === 'additional_service'));

            // Set default insurance if available and not already set
            const defaultInsurance = activeRules.find(r => r.type === 'insurance' && r.name.toLowerCase().includes('default'));
            setQuote(prev => {
                let initialLineItems = [...prev.line_items];
                let initialInsuranceId = prev.selectedInsuranceRuleId;

                // Ensure initial duration for default insurance calculation (before date selection)
                const initialDuration = prev.hire_duration_days || 1; 

                if (!initialInsuranceId && defaultInsurance) {
                    initialInsuranceId = defaultInsurance.id;
                    initialLineItems = initialLineItems.filter(item => !activeRules.filter(r => r.type === 'insurance').some(i => item.description.startsWith(i.name))); // Clear any old insurance
                    initialLineItems.push({ 
                        description: `${defaultInsurance.name} (Insurance)`, 
                        quantity: initialDuration, 
                        unit_price: defaultInsurance.daily_rate_adjustment, 
                        total: defaultInsurance.daily_rate_adjustment * initialDuration 
                    });
                }
                return { 
                    ...prev, 
                    selectedInsuranceRuleId: initialInsuranceId,
                    line_items: initialLineItems 
                };
            });

        } catch (error) {
            console.error("Error loading data:", error);
        }
    };
    
    // Helper function to get daily rate based on duration
    const getDailyRateForDuration = (vehicleType, days) => {
        if (!vehicleType || !vehicleType.pricing_tiers) {
            return vehicleType?.daily_rate || 0;
        }
        
        if (days >= 364) return vehicleType.pricing_tiers.tier_364_plus_days || vehicleType.daily_rate;
        if (days >= 179) return vehicleType.pricing_tiers.tier_179_363_days || vehicleType.daily_rate;
        if (days >= 30) return vehicleType.pricing_tiers.tier_30_178_days || vehicleType.daily_rate;
        if (days >= 15) return vehicleType.pricing_tiers.tier_15_29_days || vehicleType.daily_rate;
        return vehicleType.pricing_tiers.tier_1_14_days || vehicleType.daily_rate;
    };

    const updateLineItem = (description, unit_price, quantity = 1) => {
        setQuote(prev => {
            // Find existing item by a partial match on description (e.g., "Vehicle Name (x1)" vs "Vehicle Name")
            const existingItemIndex = prev.line_items.findIndex(item => item.description.split('(')[0].trim() === description.split('(')[0].trim());
            let newItems = [...prev.line_items];
            
            if (existingItemIndex > -1) {
                if (unit_price === 0) {
                    // If unit_price is 0, remove the item
                    newItems.splice(existingItemIndex, 1);
                } else {
                    // Otherwise update existing item, retaining its original quantity if not specified
                    newItems[existingItemIndex] = { ...newItems[existingItemIndex], description, unit_price, total: unit_price * quantity };
                }
            } else if (unit_price > 0) { // Only add if unit_price > 0
                newItems.push({ description, quantity, unit_price, total: unit_price * quantity });
            }
            return { ...prev, line_items: newItems };
        });
    };
    
    useEffect(() => {
        const subtotal = quote.line_items.reduce((acc, item) => acc + item.total, 0);
        const tax = subtotal * 0.10; // 10% GST
        const total = subtotal + tax;
        setTotals({ subtotal, tax, total });
    }, [quote.line_items]);

    const handleVehicleChange = (val) => {
        const vehicle = vehicleTypes.find(v => v.name === val);
        setQuote(prev => {
            const newQuote = { ...prev, vehicle_category: val, hire_duration_days: prev.hire_duration_days || 1 };
            // Filter out existing vehicle line items before adding the new one
            let updatedLineItems = newQuote.line_items.filter(item => !vehicleTypes.some(v => item.description.startsWith(v.name)));
            
            if(vehicle) {
                // Calculate rate based on hire duration
                const rate = getDailyRateForDuration(vehicle, newQuote.hire_duration_days);
                updatedLineItems.push({ 
                    description: vehicle.name, 
                    quantity: newQuote.hire_duration_days, 
                    unit_price: rate, 
                    total: rate * newQuote.hire_duration_days 
                });
            }
            return { ...newQuote, line_items: updatedLineItems };
        });
    };
    
    // This function is now called internally when hire_duration_days changes (e.g., by date selection)
    const handleDurationChange = (days) => {
        const duration = parseInt(days, 10) || 1;
        setQuote(prev => {
            const newQuote = { ...prev, hire_duration_days: duration };

            // Start with line items that are NOT duration-dependent (e.g., one-time transport fees, one-time requirements)
            let updatedLineItems = newQuote.line_items.filter(item => {
                const isVehicle = vehicleTypes.some(v => item.description.startsWith(v.name));
                const isInsurance = insuranceOptions.some(i => item.description.startsWith(i.name));
                const isRequirement = requirementOptions.some(r => {
                    const rule = requirementOptions.find(rr => item.description.startsWith(rr.name));
                    return rule && rule.daily_rate_adjustment > 0 && !rule.one_time_fee;
                });
                return !isVehicle && !isInsurance && !isRequirement;
            });

            // Re-add vehicle line item if a vehicle is selected
            const currentVehicle = vehicleTypes.find(v => v.name === newQuote.vehicle_category);
            if (currentVehicle) {
                const rate = getDailyRateForDuration(currentVehicle, duration);
                updatedLineItems.push({ 
                    description: currentVehicle.name, 
                    quantity: duration, 
                    unit_price: rate, 
                    total: rate * duration 
                });
            }

            // Re-add selected insurance line item
            const currentInsurance = insuranceOptions.find(i => i.id === newQuote.selectedInsuranceRuleId);
            if (currentInsurance) {
                updatedLineItems.push({ 
                    description: `${currentInsurance.name} (Insurance)`, 
                    quantity: duration, 
                    unit_price: currentInsurance.daily_rate_adjustment, 
                    total: currentInsurance.daily_rate_adjustment * duration 
                });
            }

            // Re-add selected daily-rate requirement line items
            newQuote.selectedRequirementRuleIds.forEach(ruleId => {
                const req = requirementOptions.find(r => r.id === ruleId);
                if (req && req.daily_rate_adjustment > 0 && !req.one_time_fee) {
                    updatedLineItems.push({
                        description: `${req.name} (Service)`,
                        quantity: duration,
                        unit_price: req.daily_rate_adjustment,
                        total: req.daily_rate_adjustment * duration
                    });
                }
            });
            
            return { ...newQuote, line_items: updatedLineItems };
        });
    };

    const handleLocationChange = (type, locationName) => {
        setQuote(prev => {
            const newQuote = { ...prev, [type]: locationName };
            let currentLineItems = [...newQuote.line_items];
            
            // Remove any existing transport fee line items related to this location type
            currentLineItems = currentLineItems.filter(item => 
                !(item.description.includes("Transport Fee") && (
                    // Need to check against potentially old pickup/dropoff names as well as the new ones
                    (prev.pickup_location && item.description.startsWith(`${prev.pickup_location} Transport Fee`)) ||
                    (prev.dropoff_location && item.description.startsWith(`${prev.dropoff_location} Transport Fee`))
                ))
            );

            const pickupLocation = locations.find(l => l.name === newQuote.pickup_location);
            if (pickupLocation && pickupLocation.transport_fee > 0) {
                currentLineItems.push({ description: `${pickupLocation.name} Transport Fee`, quantity: 1, unit_price: pickupLocation.transport_fee, total: pickupLocation.transport_fee });
            }

            const dropoffLocation = locations.find(l => l.name === newQuote.dropoff_location);
            if (dropoffLocation && dropoffLocation.transport_fee > 0 && newQuote.pickup_location !== newQuote.dropoff_location) {
                currentLineItems.push({ description: `${dropoffLocation.name} Transport Fee`, quantity: 1, unit_price: dropoffLocation.transport_fee, total: dropoffLocation.transport_fee });
            }
            
            return { ...newQuote, line_items: currentLineItems };
        });
    };


    const handleInsuranceChange = (ruleId) => {
        const insuranceRule = insuranceOptions.find(i => i.id === ruleId);
        setQuote(prev => {
            // Remove any existing insurance options from line items
            const filteredLineItems = prev.line_items.filter(item => 
                !insuranceOptions.some(i => item.description.startsWith(i.name))
            );

            let newSelectedInsuranceRuleId = null;
            if (insuranceRule) {
                newSelectedInsuranceRuleId = insuranceRule.id;
                // Add the new insurance rule if it's selected and has a cost (or is a default with 0 cost)
                filteredLineItems.push({ 
                    description: `${insuranceRule.name} (Insurance)`, 
                    quantity: prev.hire_duration_days, // Quantity based on current duration
                    unit_price: insuranceRule.daily_rate_adjustment, 
                    total: insuranceRule.daily_rate_adjustment * prev.hire_duration_days 
                });
            }
            return { ...prev, line_items: filteredLineItems, selectedInsuranceRuleId: newSelectedInsuranceRuleId };
        });
    };
    
    const handleRequirementToggle = (checked, rule) => {
        setQuote(prev => {
            let newItems = [...prev.line_items];
            let newSelectedRequirementRuleIds = [...prev.selectedRequirementRuleIds];
            
            // Check if a line item for this rule already exists
            const existingItemIndex = newItems.findIndex(item => item.description.startsWith(rule.name));

            if (checked) {
                if (existingItemIndex === -1) {
                    // Add requirement to line items
                    const quantity = (rule.daily_rate_adjustment > 0 && !rule.one_time_fee) ? prev.hire_duration_days : 1;
                    const unit_price = rule.one_time_fee > 0 ? rule.one_time_fee : rule.daily_rate_adjustment;
                    const total_amount = rule.one_time_fee > 0 ? rule.one_time_fee : (rule.daily_rate_adjustment * quantity);

                    newItems.push({
                        description: `${rule.name} (Service)`,
                        quantity: quantity,
                        unit_price: unit_price,
                        total: total_amount
                    });
                    newSelectedRequirementRuleIds.push(rule.id);
                }
            } else { // unchecked
                if (existingItemIndex > -1) {
                    // Remove requirement from line items
                    newItems.splice(existingItemIndex, 1);
                    newSelectedRequirementRuleIds = newSelectedRequirementRuleIds.filter(id => id !== rule.id);
                }
            }
            return { ...prev, line_items: newItems, selectedRequirementRuleIds: newSelectedRequirementRuleIds };
        });
    };

    // Handler for KM option selection (not affecting line items, just for state tracking)
    const handleKmOptionChange = (value) => {
        setQuote(prev => ({ ...prev, selectedKmOptionName: value }));
    };

    // Handler for "How heard" option selection
    const handleHowHeardChange = (value) => {
        setQuote(prev => ({ ...prev, how_heard: value }));
    };

    const generateQuoteNumber = () => {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `QUO-${timestamp}-${random}`;
    };
    
    const handlePreviewQuote = () => {
        if (!quote.customer_name || !quote.customer_email || !quote.vehicle_category) {
            alert('Please fill in customer name, email, and select a vehicle category first.');
            return;
        }
        if (!quote.pickup_date || !quote.dropoff_date) {
            alert('Please select pickup and dropoff dates.');
            return;
        }
        setIsPreviewing(true);
    };

    const handleConfirmAndSend = async () => {
        setIsGenerating(true);
        setGeneratedQuote(null); // Clear previous generated quote info

        try {
            // Fetch theme settings
            const themeSettingsList = await ThemeSettings.list();
            const theme = themeSettingsList.length > 0 
                ? themeSettingsList[0] 
                : { // Fallback defaults
                    email_header_background: '#1C2945',
                    email_header_text_color: '#FFFFFF',
                    email_accent_color: '#1C2945',
                    email_button_background: '#CE202E',
                    email_button_text_color: '#FFFFFF',
                };

            // Create quote record
            const quoteNumber = generateQuoteNumber();
            const validUntil = new Date();
            validUntil.setDate(validUntil.getDate() + 14); // Valid for 2 weeks

            const quoteData = {
                quote_number: quoteNumber,
                customer_name: quote.customer_name,
                customer_email: quote.customer_email,
                vehicle_category: quote.vehicle_category,
                hire_duration_days: quote.hire_duration_days,
                pickup_date: quote.pickup_date ? quote.pickup_date.toISOString().split('T')[0] : null, // Store as YYYY-MM-DD
                pickup_time: quote.pickup_time,
                dropoff_date: quote.dropoff_date ? quote.dropoff_date.toISOString().split('T')[0] : null, // Store as YYYY-MM-DD
                dropoff_time: quote.dropoff_time,
                pickup_location: quote.pickup_location,
                dropoff_location: quote.dropoff_location,
                estimated_kms: quote.selectedKmOptionName,
                how_heard: quote.how_heard,
                line_items: quote.line_items,
                subtotal: totals.subtotal,
                tax: totals.tax,
                total: totals.total,
                notes: quote.notes,
                valid_until: validUntil.toISOString().split('T')[0],
                status: 'sent',
                quote_sent_date: new Date().toISOString()
            };

            const savedQuote = await Quote.create(quoteData);

            // Generate email content
            const acceptUrl = `${window.location.origin}/AcceptQuote?id=${savedQuote.id}`; // Updated URL format
            
            const emailContent = `
                <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                    <div style="background: ${theme.email_header_background}; padding: 30px; text-align: center;">
                        <h1 style="color: ${theme.email_header_text_color}; margin: 0;">WWFH Fleet Hire Quote</h1>
                        <p style="color: ${theme.email_header_text_color}; opacity: 0.8; margin: 10px 0 0 0;">Quote #${quoteNumber}</p>
                    </div>
                    
                    <div style="padding: 30px; background: white;">
                        <p>Dear ${quote.customer_name},</p>
                        <p>Thank you for your interest in our vehicle hire services. Please find your quote details below:</p>
                        
                        <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: ${theme.email_accent_color}; margin-top: 0;">Quote Summary</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tbody>
                                <tr style="border-bottom: 1px solid #E2E8F0;">
                                    <td style="padding: 8px 0;"><strong>Vehicle Type:</strong></td>
                                    <td style="text-align: right;">${quote.vehicle_category}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #E2E8F0;">
                                    <td style="padding: 8px 0;"><strong>Duration:</strong></td>
                                    <td style="text-align: right;">${quote.hire_duration_days} days</td>
                                </tr>
                                ${quote.pickup_date ? `
                                <tr style="border-bottom: 1px solid #E2E8F0;">
                                    <td style="padding: 8px 0;"><strong>Pickup Date:</strong></td>
                                    <td style="text-align: right;">${format(quote.pickup_date, 'PPP')} at ${quote.pickup_time}</td>
                                </tr>` : ''}
                                ${quote.dropoff_date ? `
                                <tr style="border-bottom: 1px solid #E2E8F0;">
                                    <td style="padding: 8px 0;"><strong>Dropoff Date:</strong></td>
                                    <td style="text-align: right;">${format(quote.dropoff_date, 'PPP')} at ${quote.dropoff_time}</td>
                                </tr>` : ''}
                                ${quote.pickup_location ? `
                                <tr style="border-bottom: 1px solid #E2E8F0;">
                                    <td style="padding: 8px 0;"><strong>Pickup Location:</strong></td>
                                    <td style="text-align: right;">${quote.pickup_location}</td>
                                </tr>` : ''}
                                ${quote.dropoff_location ? `
                                <tr style="border-bottom: 1px solid #E2E8F0;">
                                    <td style="padding: 8px 0;"><strong>Dropoff Location:</strong></td>
                                    <td style="text-align: right;">${quote.dropoff_location}</td>
                                </tr>` : ''}
                                </tbody>
                            </table>
                        </div>

                        <div style="background: #F0F9FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h4 style="color: ${theme.email_accent_color}; margin-top: 0;">Line Items</h4>
                            ${quote.line_items.map(item => `
                                <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                                    <span>${item.description} (x${item.quantity})</span>
                                    <span>$${item.total.toFixed(2)}</span>
                                </div>
                            `).join('')}
                            <hr style="margin: 15px 0;">
                            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; color: ${theme.email_accent_color};">
                                <span>Total (inc. GST)</span>
                                <span>$${totals.total.toFixed(2)}</span>
                            </div>
                        </div>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${acceptUrl}" 
                               style="background: ${theme.email_button_background}; color: ${theme.email_button_text_color}; padding: 15px 30px; 
                                      text-decoration: none; border-radius: 8px; font-weight: bold; 
                                      display: inline-block;">
                                ACCEPT QUOTE
                            </a>
                        </div>

                        <p style="color: #64748B; font-size: 14px;">
                            This quote is valid until ${new Date(validUntil).toLocaleDateString()}.
                            ${quote.notes ? `<br><br><strong>Additional Notes:</strong> ${quote.notes}` : ''}
                        </p>

                        <div style="background: #FEF2F2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; color: #B91C1C; font-weight: bold;">Important:</p>
                            <p style="margin: 5px 0 0 0; color: #7F1D1D;">
                                All vehicles are subject to availability. A reservation will be confirmed upon acceptance of this quote.
                            </p>
                        </div>
                    </div>

                    <div style="background: #F8FAFC; padding: 20px; text-align: center; color: #64748B; font-size: 14px;">
                        <p>WWFH Fleet Services | Contact: fleet@wwfh.com.au</p>
                    </div>
                </div>
            `;

            // Send email
            await SendEmail({
                to: quote.customer_email,
                subject: `WWFH Fleet Hire Quote #${quoteNumber}`,
                body: emailContent,
                from_name: 'WWFH Fleet Services'
            });

            setGeneratedQuote(savedQuote);
            setIsPreviewing(false); // Go back to the builder form
            alert(`Quote #${quoteNumber} has been generated and emailed to ${quote.customer_email}!`);

        } catch (error) {
            console.error("Error generating quote:", error);
            alert('Failed to generate quote. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };
    
    if (isPreviewing) {
        return (
            <QuotePreview
                quote={quote}
                totals={totals}
                onConfirm={handleConfirmAndSend}
                onEdit={() => setIsPreviewing(false)}
                isSending={isGenerating}
            />
        );
    }

    return (
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                        <CardTitle className="text-2xl" style={{color: 'var(--wwfh-navy)'}}>New Hire Quote</CardTitle>
                        <p className="text-slate-500">Fill in the details to generate a new quote.</p>
                        {generatedQuote && (
                            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
                                <p className="text-green-800 font-medium">
                                    ✅ Quote #{generatedQuote.quote_number} sent successfully!
                                </p>
                            </div>
                        )}
                    </div>
                     <Button 
                        onClick={handlePreviewQuote} 
                        disabled={isGenerating}
                        className="text-white w-full sm:w-auto" 
                        style={{background: 'var(--wwfh-red)'}}
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        Preview Quote
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Options */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Customer & Hire Details</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Customer Name</Label>
                                <Input 
                                    placeholder="John Doe" 
                                    value={quote.customer_name}
                                    onChange={(e) => setQuote(prev => ({...prev, customer_name: e.target.value}))}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Customer Email</Label>
                                <Input 
                                    placeholder="john.doe@example.com" 
                                    type="email"
                                    value={quote.customer_email}
                                    onChange={(e) => setQuote(prev => ({...prev, customer_email: e.target.value}))}
                                />
                            </div>

                            {/* Date and Time Selection */}
                            <div className="space-y-1.5">
                                <Label>Pickup Date & Time</Label>
                                <div className="flex gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="flex-1 justify-start">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {quote.pickup_date ? format(quote.pickup_date, 'PPP') : 'Pick date'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={quote.pickup_date || undefined} // Calendar expects undefined for no selection
                                                onSelect={(date) => setQuote(prev => ({...prev, pickup_date: date}))}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <Input
                                        type="time"
                                        value={quote.pickup_time}
                                        onChange={(e) => setQuote(prev => ({...prev, pickup_time: e.target.value}))}
                                        className="w-32"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Dropoff Date & Time</Label>
                                <div className="flex gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="flex-1 justify-start">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {quote.dropoff_date ? format(quote.dropoff_date, 'PPP') : 'Pick date'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={quote.dropoff_date || undefined}
                                                onSelect={(date) => setQuote(prev => ({...prev, dropoff_date: date}))}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <Input
                                        type="time"
                                        value={quote.dropoff_time}
                                        onChange={(e) => setQuote(prev => ({...prev, dropoff_time: e.target.value}))}
                                        className="w-32"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Calculated Duration</Label>
                                <div className="p-3 bg-slate-100 rounded border">
                                    <span className="font-semibold text-lg" style={{color: 'var(--wwfh-navy)'}}>
                                        {quote.hire_duration_days} day{quote.hire_duration_days !== 1 ? 's' : ''}
                                    </span>
                                    <p className="text-xs text-slate-600 mt-1">
                                        Pickup after 2pm = not counted as day | Dropoff after 2pm = counted as day
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Pickup Location</Label>
                                <Select onValueChange={(val) => handleLocationChange('pickup_location', val)} value={quote.pickup_location}>
                                    <SelectTrigger><SelectValue placeholder="Select location..." /></SelectTrigger>
                                    <SelectContent>
                                        {locations.map(l => (
                                            <SelectItem key={l.id} value={l.name}>
                                                {l.name} {l.transport_fee > 0 ? `(+$${l.transport_fee} transport)` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-1.5">
                                <Label>Dropoff Location</Label>
                                <Select onValueChange={(val) => handleLocationChange('dropoff_location', val)} value={quote.dropoff_location}>
                                    <SelectTrigger><SelectValue placeholder="Select location..." /></SelectTrigger>
                                    <SelectContent>
                                        {locations.map(l => (
                                            <SelectItem key={l.id} value={l.name}>
                                                {l.name} {l.transport_fee > 0 ? `(+$${l.transport_fee} transport)` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                         <CardHeader><CardTitle className="text-lg">Vehicle & Insurance</CardTitle></CardHeader>
                         <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Vehicle Category</Label>
                                <Select onValueChange={handleVehicleChange} value={quote.vehicle_category}>
                                    <SelectTrigger><SelectValue placeholder="Select vehicle..." /></SelectTrigger>
                                    <SelectContent>
                                        {vehicleTypes.map(v => (
                                            <SelectItem key={v.id} value={v.name}>
                                                {v.name} (${getDailyRateForDuration(v, quote.hire_duration_days || 1)}/day)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {/* Removed direct duration input as it's now calculated */}
                             <div className="space-y-1.5 md:col-span-2"> {/* This was md:col-span-2 for insurance, if duration input was removed, this can be just one column if desired layout changes*/}
                                <Label>Insurance Option</Label>
                                <Select onValueChange={handleInsuranceChange} value={quote.selectedInsuranceRuleId || ''}>
                                    <SelectTrigger><SelectValue placeholder="Select insurance..." /></SelectTrigger>
                                    <SelectContent>
                                        {insuranceOptions.map(i => (
                                            <SelectItem key={i.id} value={i.id}>
                                                {i.name} {i.daily_rate_adjustment > 0 && `(+$${i.daily_rate_adjustment}/day)`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                         </CardContent>
                    </Card>
                     <Card>
                         <CardHeader><CardTitle className="text-lg">Additional Details</CardTitle></CardHeader>
                         <CardContent className="space-y-4">
                            <div>
                                <Label className="font-semibold">Additional Requirements</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                                    {requirementOptions.map(req => (
                                        <div key={req.id} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={req.id} 
                                                checked={quote.selectedRequirementRuleIds.includes(req.id)}
                                                onCheckedChange={(checked) => handleRequirementToggle(checked, req)}
                                            />
                                            <Label htmlFor={req.id} className="font-normal text-sm leading-tight">
                                                {req.name}
                                                {(req.one_time_fee > 0 || req.daily_rate_adjustment > 0) &&
                                                    <span className="text-xs text-slate-500 ml-1">
                                                        ({req.one_time_fee > 0 ? `$${req.one_time_fee}` : `+$${req.daily_rate_adjustment}/day`})
                                                    </span>
                                                }
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Estimated Daily Kilometers</Label>
                                    <Select onValueChange={handleKmOptionChange} value={quote.selectedKmOptionName || ''}>
                                        <SelectTrigger><SelectValue placeholder="Select km..." /></SelectTrigger>
                                        <SelectContent>
                                            {kmOptions.map(km => 
                                                <SelectItem key={km.id} value={km.name}>
                                                    {km.name} {km.daily_rate_adjustment > 0 && `(+$${km.daily_rate_adjustment}/day)`}
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>How did you hear about us?</Label>
                                    <Select onValueChange={handleHowHeardChange} value={quote.how_heard}>
                                        <SelectTrigger><SelectValue placeholder="Select source..." /></SelectTrigger>
                                        <SelectContent>{howHeardOptions.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                             <div className="space-y-1.5">
                                <Label>Notes</Label>
                                <Textarea 
                                    placeholder="Add any specific notes for this quote..."
                                    value={quote.notes}
                                    onChange={(e) => setQuote(prev => ({...prev, notes: e.target.value}))}
                                />
                            </div>
                         </CardContent>
                    </Card>
                </div>
                {/* Right Column: Quote Summary */}
                <div className="space-y-6">
                    <Card className="bg-slate-50">
                        <CardHeader><CardTitle className="text-lg">Quote Summary</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                               {quote.line_items.map((item, index) => (
                                   <div key={index} className="flex justify-between items-center text-sm">
                                       <span className="text-slate-600 flex-1 pr-2">{item.description} (x{item.quantity})</span>
                                       <span className="font-medium text-slate-800">${(item.total).toFixed(2)}</span>
                                   </div>
                               ))}
                               {quote.line_items.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Select items to build quote.</p>}
                            </div>
                            <hr className="my-4"/>
                            <div className="space-y-2 font-medium">
                                <div className="flex justify-between"><span>Subtotal</span><span>${totals.subtotal.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span>GST (10%)</span><span>${totals.tax.toFixed(2)}</span></div>
                                <div className="flex justify-between text-lg font-bold" style={{color: 'var(--wwfh-navy)'}}><span>Total</span><span>${totals.total.toFixed(2)}</span></div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
        </Card>
    );
}
