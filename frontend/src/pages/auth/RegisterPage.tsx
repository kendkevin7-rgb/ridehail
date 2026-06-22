import { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import clsx from 'clsx';

interface FormData {
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  role: UserRole;
  licenseNumber: string;
  make: string;
  model: string;
  year: string;
  color: string;
  plateNumber: string;
  vehicleType: string;
}

interface FieldErrors {
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  fullName?: string;
  licenseNumber?: string;
  make?: string;
  model?: string;
  year?: string;
  color?: string;
  plateNumber?: string;
  vehicleType?: string;
}

const INITIAL_DATA: FormData = {
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  role: UserRole.RIDER,
  licenseNumber: '',
  make: '',
  model: '',
  year: '',
  color: '',
  plateNumber: '',
  vehicleType: '',
};

const STEPS = [
  { label: 'Account', description: 'Login credentials' },
  { label: 'Profile', description: 'Personal details' },
  { label: 'Vehicle', description: 'License & car info' },
];

export function RegisterPage() {
  const navigate = useNavigate();
  const { user, isLoading, error, register, clearError } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_DATA);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const totalSteps = formData.role === UserRole.DRIVER ? 3 : 2;

  useEffect(() => {
    if (submitted && user) {
      const path = user.role === UserRole.DRIVER ? '/driver/dashboard' : '/rider/home';
      navigate(path, { replace: true });
    }
  }, [user, submitted, navigate]);

  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateStep1 = (): boolean => {
    const errors: FieldErrors = {};
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s\-()]{7,15}$/.test(formData.phone)) {
      errors.phone = 'Invalid phone number';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.password)) {
      errors.password = 'Must contain an uppercase letter';
    } else if (!/\d/.test(formData.password)) {
      errors.password = 'Must contain a number';
    }
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errors: FieldErrors = {};
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const errors: FieldErrors = {};
    if (!formData.licenseNumber.trim()) {
      errors.licenseNumber = 'License number is required';
    }
    if (!formData.make.trim()) {
      errors.make = 'Make is required';
    }
    if (!formData.model.trim()) {
      errors.model = 'Model is required';
    }
    if (!formData.year.trim()) {
      errors.year = 'Year is required';
    } else if (!/^\d{4}$/.test(formData.year)) {
      errors.year = 'Must be a 4-digit year';
    } else {
      const y = parseInt(formData.year, 10);
      const currentYear = new Date().getFullYear();
      if (y < 1990 || y > currentYear + 1) {
        errors.year = `Year must be between 1990 and ${currentYear + 1}`;
      }
    }
    if (!formData.color.trim()) {
      errors.color = 'Color is required';
    }
    if (!formData.plateNumber.trim()) {
      errors.plateNumber = 'Plate number is required';
    }
    if (!formData.vehicleType.trim()) {
      errors.vehicleType = 'Vehicle type is required';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const performRegistration = async () => {
    const payload: Record<string, unknown> = {
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      full_name: formData.fullName,
      role: formData.role,
    };

    if (formData.role === UserRole.DRIVER) {
      payload.license_number = formData.licenseNumber;
      payload.vehicle = {
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year, 10),
        color: formData.color,
        plate_number: formData.plateNumber,
        vehicle_type: formData.vehicleType,
      };
    }

    try {
      setSubmitted(true);
      await register(payload);
    } catch {
      setSubmitted(false);
    }
  };

  const handleSubmitOrNext = (e: FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    } else if (step === 2) {
      if (!validateStep2()) return;
      if (formData.role === UserRole.RIDER) {
        performRegistration();
      } else {
        setStep(3);
      }
    } else if (step === 3) {
      if (validateStep3()) {
        performRegistration();
      }
    }
  };

  const handleBack = () => {
    setStep((s) => Math.max(1, s - 1));
  };

  const isLastStep = step === totalSteps;

  const stepsToShow = STEPS.slice(0, totalSteps);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create an account</h1>
          <p className="text-gray-600 mt-1">Join us and start riding</p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          {stepsToShow.map((s, i) => {
            const stepNum = i + 1;
            const isActive = stepNum === step;
            const isCompleted = stepNum < step;
            return (
              <div key={s.label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={clsx(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                      isActive && 'bg-primary-600 text-white',
                      isCompleted && 'bg-green-500 text-white',
                      !isActive && !isCompleted && 'bg-gray-200 text-gray-500'
                    )}
                  >
                    {isCompleted ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      stepNum
                    )}
                  </div>
                  <span
                    className={clsx(
                      'text-xs mt-1 font-medium',
                      isActive && 'text-primary-600',
                      isCompleted && 'text-green-600',
                      !isActive && !isCompleted && 'text-gray-400'
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < stepsToShow.length - 1 && (
                  <div
                    className={clsx(
                      'w-12 h-0.5 mx-2 mb-5 transition-colors',
                      stepNum < step ? 'bg-green-500' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmitOrNext} noValidate>
          {/* Step 1: Account info */}
          {step === 1 && (
            <div className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                error={fieldErrors.email}
                fullWidth
                disabled={isLoading}
                autoComplete="email"
              />
              <Input
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                error={fieldErrors.phone}
                fullWidth
                disabled={isLoading}
                autoComplete="tel"
                helperText="Include country code (e.g. +1)"
              />
              <Input
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                error={fieldErrors.password}
                fullWidth
                disabled={isLoading}
                autoComplete="new-password"
                helperText="Min 8 chars, 1 uppercase, 1 number"
              />
              <Input
                label="Confirm Password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                error={fieldErrors.confirmPassword}
                fullWidth
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>
          )}

          {/* Step 2: Profile */}
          {step === 2 && (
            <div className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                value={formData.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                error={fieldErrors.fullName}
                fullWidth
                disabled={isLoading}
                autoComplete="name"
              />

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">I want to join as</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => updateField('role', UserRole.RIDER)}
                    disabled={isLoading}
                    className={clsx(
                      'flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-colors border-2',
                      formData.role === UserRole.RIDER
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <span className="block text-lg mb-1">🚗</span>
                    Rider
                    <span className="block text-xs font-normal mt-0.5 text-gray-400">
                      Book rides
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('role', UserRole.DRIVER)}
                    disabled={isLoading}
                    className={clsx(
                      'flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-colors border-2',
                      formData.role === UserRole.DRIVER
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <span className="block text-lg mb-1">🚘</span>
                    Driver
                    <span className="block text-xs font-normal mt-0.5 text-gray-400">
                      Earn money
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: License & Vehicle (Driver only) */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 mb-2">
                Please provide your driver license and vehicle details to complete registration.
              </div>
              <Input
                label="License Number"
                type="text"
                value={formData.licenseNumber}
                onChange={(e) => updateField('licenseNumber', e.target.value)}
                error={fieldErrors.licenseNumber}
                fullWidth
                disabled={isLoading}
              />

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Vehicle Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Make"
                    type="text"
                    value={formData.make}
                    onChange={(e) => updateField('make', e.target.value)}
                    error={fieldErrors.make}
                    fullWidth
                    disabled={isLoading}
                    placeholder="e.g. Toyota"
                  />
                  <Input
                    label="Model"
                    type="text"
                    value={formData.model}
                    onChange={(e) => updateField('model', e.target.value)}
                    error={fieldErrors.model}
                    fullWidth
                    disabled={isLoading}
                    placeholder="e.g. Camry"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Input
                    label="Year"
                    type="text"
                    value={formData.year}
                    onChange={(e) => updateField('year', e.target.value)}
                    error={fieldErrors.year}
                    fullWidth
                    disabled={isLoading}
                    placeholder="e.g. 2022"
                  />
                  <Input
                    label="Color"
                    type="text"
                    value={formData.color}
                    onChange={(e) => updateField('color', e.target.value)}
                    error={fieldErrors.color}
                    fullWidth
                    disabled={isLoading}
                    placeholder="e.g. White"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Input
                    label="Plate Number"
                    type="text"
                    value={formData.plateNumber}
                    onChange={(e) => updateField('plateNumber', e.target.value)}
                    error={fieldErrors.plateNumber}
                    fullWidth
                    disabled={isLoading}
                    placeholder="e.g. ABC-1234"
                  />
                  <Input
                    label="Vehicle Type"
                    type="text"
                    value={formData.vehicleType}
                    onChange={(e) => updateField('vehicleType', e.target.value)}
                    error={fieldErrors.vehicleType}
                    fullWidth
                    disabled={isLoading}
                    placeholder="e.g. Sedan"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className={clsx('flex gap-3 mt-8', step === 1 && 'justify-center')}>
            {step > 1 && (
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={handleBack}
                disabled={isLoading}
                className="flex-1"
              >
                Back
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              disabled={isLoading}
              className={step > 1 ? 'flex-1' : 'w-full'}
            >
              {isLastStep ? 'Create Account' : 'Next'}
            </Button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
