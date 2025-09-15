import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { user, organization } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Eye, EyeOff, UserPlus, Loader2, AlertCircle, Car, Building, User, Mail, Phone, MapPin } from 'lucide-react';
import { motion } from "framer-motion";

export default function RegisterPage() {
  const [step, setStep] = useState(1); // 1: Account Info, 2: Organization Info, 3: Confirmation
  const [formData, setFormData] = useState({
    // User data
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: '',
    role: 'owner', // Default to owner for new organizations
    
    // Organization data
    organization_name: '',
    organization_slug: '',
    organization_description: '',
    organization_email: '',
    organization_phone: '',
    organization_address: '',
    registration_number: '',
    tax_number: '',
    subscription_plan: 'basic',
    
    // Agreement
    agree_terms: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);
  
  const navigate = useNavigate();

  // Auto-generate organization slug from name
  useEffect(() => {
    if (formData.organization_name && !formData.organization_slug) {
      const slug = formData.organization_name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
      setFormData(prev => ({ ...prev, organization_slug: slug }));
    }
  }, [formData.organization_name, formData.organization_slug]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep1 = () => {
    const stepErrors = {};
    
    if (!formData.first_name.trim()) stepErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) stepErrors.last_name = 'Last name is required';
    if (!formData.email.trim()) stepErrors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) stepErrors.email = 'Invalid email format';
    if (!formData.password) stepErrors.password = 'Password is required';
    if (formData.password.length < 8) stepErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirm_password) stepErrors.confirm_password = 'Passwords do not match';
    
    return stepErrors;
  };

  const validateStep2 = () => {
    const stepErrors = {};
    
    if (!formData.organization_name.trim()) stepErrors.organization_name = 'Organization name is required';
    if (!formData.organization_slug.trim()) stepErrors.organization_slug = 'Organization slug is required';
    if (!/^[a-z0-9-]+$/.test(formData.organization_slug)) stepErrors.organization_slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    if (!formData.organization_email.trim()) stepErrors.organization_email = 'Organization email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.organization_email)) stepErrors.organization_email = 'Invalid email format';
    if (!formData.agree_terms) stepErrors.agree_terms = 'You must agree to the terms and conditions';
    
    return stepErrors;
  };

  const handleNextStep = () => {
    let stepErrors = {};
    
    if (step === 1) {
      stepErrors = validateStep1();
    } else if (step === 2) {
      stepErrors = validateStep2();
    }
    
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    
    setErrors({});
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      // Final validation
      const step1Errors = validateStep1();
      const step2Errors = validateStep2();
      const allErrors = { ...step1Errors, ...step2Errors };
      
      if (Object.keys(allErrors).length > 0) {
        setErrors(allErrors);
        setStep(1); // Go back to first step with errors
        return;
      }

      // Register organization first
      const organizationData = {
        name: formData.organization_name,
        slug: formData.organization_slug,
        description: formData.organization_description,
        email: formData.organization_email,
        phone: formData.organization_phone,
        address: formData.organization_address,
        registration_number: formData.registration_number,
        tax_number: formData.tax_number,
        subscription_plan: formData.subscription_plan,
        created_by: formData.email
      };

      const organizationResponse = await organization.registerOrganization(organizationData);

      // Register user with organization
      const userData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: formData.role,
        organization_id: organizationResponse.id
      };

      await user.register(userData);

      setIsSuccess(true);
      setStep(3);
      
      // Redirect to login after a delay
      setTimeout(() => {
        navigate('/login', {
          state: { message: 'Registration successful! Please sign in to your account.' }
        });
      }, 3000);
      
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle different error types
      if (error.status === 400 && error.data) {
        // Validation errors from backend
        setErrors(error.data);
      } else if (error.status === 409) {
        setErrors({ email: 'An account with this email already exists' });
      } else {
        setErrors({ general: error.message || 'Registration failed. Please try again.' });
      }
      
      // Go back to appropriate step based on error
      if (errors.organization_name || errors.organization_slug) {
        setStep(2);
      } else {
        setStep(1);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name</Label>
          <Input
            id="first_name"
            name="first_name"
            placeholder="John"
            value={formData.first_name}
            onChange={handleInputChange}
            disabled={isLoading}
            className={errors.first_name ? 'border-red-500' : ''}
          />
          {errors.first_name && <p className="text-sm text-red-500">{errors.first_name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name</Label>
          <Input
            id="last_name"
            name="last_name"
            placeholder="Doe"
            value={formData.last_name}
            onChange={handleInputChange}
            disabled={isLoading}
            className={errors.last_name ? 'border-red-500' : ''}
          />
          {errors.last_name && <p className="text-sm text-red-500">{errors.last_name}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="john@example.com"
          value={formData.email}
          onChange={handleInputChange}
          disabled={isLoading}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number (Optional)</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="+1 (555) 123-4567"
          value={formData.phone}
          onChange={handleInputChange}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter a strong password"
            value={formData.password}
            onChange={handleInputChange}
            disabled={isLoading}
            className={`pr-12 ${errors.password ? 'border-red-500' : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
            disabled={isLoading}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm_password">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirm_password"
            name="confirm_password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            value={formData.confirm_password}
            onChange={handleInputChange}
            disabled={isLoading}
            className={`pr-12 ${errors.confirm_password ? 'border-red-500' : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
            disabled={isLoading}
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.confirm_password && <p className="text-sm text-red-500">{errors.confirm_password}</p>}
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="organization_name">Organization Name</Label>
        <Input
          id="organization_name"
          name="organization_name"
          placeholder="Your Company Name"
          value={formData.organization_name}
          onChange={handleInputChange}
          disabled={isLoading}
          className={errors.organization_name ? 'border-red-500' : ''}
        />
        {errors.organization_name && <p className="text-sm text-red-500">{errors.organization_name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="organization_slug">Organization Slug</Label>
        <Input
          id="organization_slug"
          name="organization_slug"
          placeholder="your-company"
          value={formData.organization_slug}
          onChange={handleInputChange}
          disabled={isLoading}
          className={errors.organization_slug ? 'border-red-500' : ''}
        />
        <p className="text-sm text-slate-500">Used for your organization's URL: yourcompany.wwfhfleet.com</p>
        {errors.organization_slug && <p className="text-sm text-red-500">{errors.organization_slug}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="organization_email">Organization Email</Label>
        <Input
          id="organization_email"
          name="organization_email"
          type="email"
          placeholder="info@yourcompany.com"
          value={formData.organization_email}
          onChange={handleInputChange}
          disabled={isLoading}
          className={errors.organization_email ? 'border-red-500' : ''}
        />
        {errors.organization_email && <p className="text-sm text-red-500">{errors.organization_email}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="organization_phone">Organization Phone</Label>
          <Input
            id="organization_phone"
            name="organization_phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={formData.organization_phone}
            onChange={handleInputChange}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subscription_plan">Subscription Plan</Label>
          <Select 
            value={formData.subscription_plan} 
            onValueChange={(value) => handleSelectChange('subscription_plan', value)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic - $99/month (10 vehicles)</SelectItem>
              <SelectItem value="premium">Premium - $199/month (50 vehicles)</SelectItem>
              <SelectItem value="enterprise">Enterprise - $499/month (Unlimited)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="organization_address">Address</Label>
        <Textarea
          id="organization_address"
          name="organization_address"
          placeholder="Street address, City, State, ZIP"
          value={formData.organization_address}
          onChange={handleInputChange}
          disabled={isLoading}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="organization_description">Description (Optional)</Label>
        <Textarea
          id="organization_description"
          name="organization_description"
          placeholder="Brief description of your organization..."
          value={formData.organization_description}
          onChange={handleInputChange}
          disabled={isLoading}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="registration_number">Registration Number (Optional)</Label>
          <Input
            id="registration_number"
            name="registration_number"
            placeholder="Business registration number"
            value={formData.registration_number}
            onChange={handleInputChange}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tax_number">Tax Number (Optional)</Label>
          <Input
            id="tax_number"
            name="tax_number"
            placeholder="Tax identification number"
            value={formData.tax_number}
            onChange={handleInputChange}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-4">
        <Checkbox
          id="agree_terms"
          name="agree_terms"
          checked={formData.agree_terms}
          onCheckedChange={(checked) => handleInputChange({ target: { name: 'agree_terms', type: 'checkbox', checked } })}
          disabled={isLoading}
          className={errors.agree_terms ? 'border-red-500' : ''}
        />
        <Label htmlFor="agree_terms" className="text-sm">
          I agree to the <Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
        </Label>
      </div>
      {errors.agree_terms && <p className="text-sm text-red-500">{errors.agree_terms}</p>}
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-6"
    >
      {isSuccess ? (
        <>
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <UserPlus className="w-8 h-8 text-green-600" />
            </motion.div>
          </div>
          <h2 className="text-2xl font-bold text-green-600">Registration Successful!</h2>
          <p className="text-slate-600">
            Your account and organization have been created successfully. 
            You will be redirected to the login page shortly.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-slate-500">Redirecting...</span>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-slate-600" />
          <p className="text-slate-600">Creating your account...</p>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg"
            style={{ background: 'var(--wwfh-navy)' }}
          >
            <Building className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-slate-900">Join WWFH Fleet</h1>
          <p className="text-slate-600 mt-2">Create your organization and start managing your fleet</p>
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-center mt-6 space-x-2">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step >= stepNumber 
                    ? 'bg-green-500 text-white' 
                    : step === stepNumber 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-slate-200 text-slate-500'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`w-12 h-1 mx-2 transition-all ${
                    step > stepNumber ? 'bg-green-500' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2 text-sm text-slate-600 space-x-8">
            <span className={step === 1 ? 'font-medium text-blue-600' : ''}>Account</span>
            <span className={step === 2 ? 'font-medium text-blue-600' : ''}>Organization</span>
            <span className={step === 3 ? 'font-medium text-blue-600' : ''}>Complete</span>
          </div>
        </div>

        {/* Registration Card */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-center" style={{ color: 'var(--wwfh-navy)' }}>
              {step === 1 && 'Personal Information'}
              {step === 2 && 'Organization Details'}
              {step === 3 && 'Registration Complete'}
            </CardTitle>
            {step < 3 && (
              <p className="text-center text-slate-600">
                {step === 1 && 'Tell us about yourself'}
                {step === 2 && 'Set up your organization'}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {/* Global Error */}
            {errors.general && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}

              {/* Navigation Buttons */}
              {step < 3 && !isSuccess && (
                <div className="flex justify-between mt-8">
                  {step === 1 ? (
                    <Link to="/login">
                      <Button variant="outline" type="button" disabled={isLoading}>
                        Back to Login
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      variant="outline" 
                      type="button" 
                      onClick={handlePrevStep}
                      disabled={isLoading}
                    >
                      Previous
                    </Button>
                  )}

                  {step === 1 ? (
                    <Button
                      type="button"
                      onClick={handleNextStep}
                      disabled={isLoading}
                      className="text-white"
                      style={{ background: 'var(--wwfh-navy)' }}
                    >
                      Next Step
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="text-white shadow-lg hover:shadow-xl transition-all"
                      style={{
                        background: 'linear-gradient(135deg, var(--wwfh-red), #E63946)',
                      }}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Create Account
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </form>

            {/* Login Link */}
            {step < 3 && !isSuccess && (
              <div className="text-center mt-6">
                <p className="text-sm text-slate-600">
                  Already have an account?{' '}
                  <Link 
                    to="/login" 
                    className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-slate-500">
          <p>&copy; 2025 WWFH Fleet Services. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <Link to="/terms" className="hover:text-slate-700 transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-slate-700 transition-colors">Privacy</Link>
            <Link to="/support" className="hover:text-slate-700 transition-colors">Support</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}