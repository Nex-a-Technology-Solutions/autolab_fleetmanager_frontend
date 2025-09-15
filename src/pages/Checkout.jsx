
import React, { useState, useEffect } from "react";
import { CheckoutReport, Car as CarEntity, VehicleType } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Stepper, Step, StepIndicator, StepStatus, StepNumber, StepTitle, StepDescription, StepSeparator } from "@/components/ui/stepper";
import { Check, Car, User, ClipboardList, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

import CarSelectionStep from "../components/checkout/CarSelectionStep";
import CustomerInfoStep from "../components/checkout/CustomerInfoStep";
import InspectionStep from "../components/checkout/InspectionStep";
import SummaryStep from "../components/checkout/SummaryStep";

const steps = [
  { id: "car-selection", label: "Select Vehicle", icon: Car },
  { id: "customer-info", label: "Customer Details", icon: User },
  { id: "inspection", label: "Vehicle Inspection", icon: ClipboardList },
  { id: "summary", label: "Summary & Confirm", icon: ShieldCheck },
];

export default function Checkout() {
  const [activeStep, setActiveStep] = useState(0);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [checkoutData, setCheckoutData] = useState({
    car_id: null,
    car_details: null,
    vehicle_type_details: null, // Add vehicle_type_details to state
    fleet_id: null, // Add fleet_id to state
    customer_name: "",
    evaluator_name: "",
    expected_return_date: null,
    exterior_condition: { overall_rating: 'good', damages: [], photos: [] },
    interior_condition: { cleanliness: 'good', damages: [] },
    mechanical_check: {
      engine_status: 'good',
      fluid_levels: 'good',
      tire_condition: 'good',
      lights_working: true,
      air_conditioning: true,
    },
    fuel_level_out: 0,
    mileage_out: 0,
    additional_notes: "",
  });

  useEffect(() => {
    const loadVehicleTypes = async () => {
      try {
        const types = await VehicleType.list();
        setVehicleTypes(types);
      } catch (error) {
        console.error("Failed to load vehicle types:", error);
      }
    };
    loadVehicleTypes();
  }, []);

  const handleNext = (data) => {
    setCheckoutData(prev => ({ ...prev, ...data }));
    setActiveStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setActiveStep(prev => Math.max(prev - 1, 0));
  };

  const handleFinalSubmit = async () => {
    try {
      // Exclude details objects from the final report data
      const { car_details, vehicle_type_details, ...reportData } = checkoutData;
      reportData.checkout_date = new Date().toISOString();
      
      // The fleet_id is now a top-level property in checkoutData
      if (!reportData.fleet_id) {
          alert("Could not find Fleet ID. Please go back and re-select the vehicle.");
          return;
      }
      
      // 1. Create Checkout Report using the new SDK
      await CheckoutReport.create(reportData);

      // 2. Update Car Status and other details using the new SDK
      await CarEntity.update(reportData.car_id, {
        status: 'checked_out',
        mileage: reportData.mileage_out,
        fuel_level: reportData.fuel_level_out
      });

      // Reset and move to final step
      setActiveStep(steps.length);

    } catch (error) {
      console.error("Error submitting checkout:", error);
      alert(`An error occurred during submission: ${error.message}`);
    }
  };
  
  const resetProcess = () => {
    setActiveStep(0);
    setCheckoutData({
        car_id: null, car_details: null, vehicle_type_details: null, fleet_id: null, customer_name: "", evaluator_name: "",
        expected_return_date: null, exterior_condition: { overall_rating: 'good', damages: [], photos: [] },
        interior_condition: { cleanliness: 'good', damages: [] },
        mechanical_check: { engine_status: 'good', fluid_levels: 'good', tire_condition: 'good', lights_working: true, air_conditioning: true, },
        fuel_level_out: 0, mileage_out: 0, additional_notes: "",
    });
  }

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return <CarSelectionStep onNext={handleNext} vehicleTypes={vehicleTypes} />;
      case 1:
        return <CustomerInfoStep onNext={handleNext} onBack={handleBack} initialData={checkoutData} />;
      case 2:
        return <InspectionStep onNext={handleNext} onBack={handleBack} initialData={checkoutData} />;
      case 3:
        return <SummaryStep onNext={handleFinalSubmit} onBack={handleBack} data={checkoutData} />;
      default:
        return (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
              <Check className="w-24 h-24 mx-auto text-emerald-500 bg-emerald-100 rounded-full p-4 mb-6" />
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Checkout Complete!</h2>
              <p className="text-slate-600 mb-6">The vehicle has been successfully checked out.</p>
              <Button onClick={resetProcess}>Start New Checkout</Button>
            </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3 sm:p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Vehicle Checkout Process
          </h1>
          <p className="text-slate-600 text-base md:text-lg">
            Follow the steps to complete the vehicle checkout.
          </p>
        </motion.div>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="mb-8 md:mb-12">
              {/* Mobile Stepper - Stack vertically on small screens */}
              <div className="block md:hidden space-y-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                      activeStep > index 
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : activeStep === index 
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300 bg-white text-slate-500'
                    }`}>
                      {activeStep > index ? <Check className="w-4 h-4" /> : <span className="text-sm font-semibold">{index + 1}</span>}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${
                        activeStep === index ? 'text-blue-600' : activeStep > index ? 'text-slate-800' : 'text-slate-500'
                      }`}>
                        {step.label}
                      </p>
                      <p className="text-xs text-slate-500">Step {index + 1}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Stepper - Horizontal on larger screens */}
              <div className="hidden md:block">
                <Stepper activeStep={activeStep}>
                  {steps.map((step, index) => (
                    <Step key={step.id}>
                      <StepIndicator>
                        <StepStatus
                          complete={<Check className="w-5 h-5" />}
                          active={<StepNumber />}
                          incomplete={<StepNumber />}
                        />
                      </StepIndicator>
                      <div className="ml-3">
                        <StepTitle>{step.label}</StepTitle>
                        <StepDescription>{`Step ${index + 1}`}</StepDescription>
                      </div>
                      {index < steps.length - 1 && <StepSeparator />}
                    </Step>
                  ))}
                </Stepper>
              </div>
            </div>
            
            {renderStepContent()}
            
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
