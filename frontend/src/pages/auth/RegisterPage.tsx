import { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
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

const MailIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-50 via-surface-100 to-surface-200 px-4 py-8">
      <div className="w-full max-w-lg animate-fade-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-brand shadow-lg shadow-brand-500/25 mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-display font-bold text-gradient">
            Create an account
          </h1>
          <p className="text-surface-500 mt-2 font-sans">Join us and start riding</p>
        </div>

        <div className="glass-strong rounded-3xl p-8 shadow-glass-lg">
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
                        'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
                        isActive && 'gradient-brand text-white shadow-lg shadow-brand-500/25 scale-110',
                        isCompleted && 'gradient-success text-white',
                        !isActive && !isCompleted && 'bg-surface-200 text-surface-400'
                      )}
                    >
                      {isCompleted ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        stepNum
                      )}
                    </div>
                    <span
                      className={clsx(
                        'text-xs mt-2 font-medium transition-colors duration-300',
                        isActive && 'text-brand-600',
                        isCompleted && 'text-emerald-600',
                        !isActive && !isCompleted && 'text-surface-400'
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < stepsToShow.length - 1 && (
                    <div
                      className={clsx(
                        'w-16 h-1 mx-3 mb-6 rounded-full transition-all duration-500',
                        stepNum < step ? 'gradient-success' : 'bg-surface-200'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {error && (
            <div className="mb-6 p-4 glass-strong rounded-2xl border border-red-200/50 bg-red-50/80 animate-fade-in">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmitOrNext} noValidate>
            {/* Step 1: Account info */}
            {step === 1 && (
              <div key="step1" className="space-y-4 animate-fade-up">
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  error={fieldErrors.email}
                  fullWidth
                  disabled={isLoading}
                  autoComplete="email"
                  icon={<MailIcon />}
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
                  icon={<PhoneIcon />}
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
                  icon={<LockIcon />}
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
                  icon={<LockIcon />}
                />
              </div>
            )}

            {/* Step 2: Profile */}
            {step === 2 && (
              <div key="step2" className="space-y-4 animate-fade-up">
                <Input
                  label="Full Name"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  error={fieldErrors.fullName}
                  fullWidth
                  disabled={isLoading}
                  autoComplete="name"
                  icon={<UserIcon />}
                />

                <div>
                  <p className="text-sm font-medium text-surface-700 mb-3">I want to join as</p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => updateField('role', UserRole.RIDER)}
                      disabled={isLoading}
                      className={clsx(
                        'flex-1 p-4 rounded-2xl font-medium text-sm transition-all duration-200 border-2',
                        formData.role === UserRole.RIDER
                          ? 'gradient-brand text-white border-brand-500 shadow-lg shadow-brand-500/20 scale-[1.02]'
                          : 'glass text-surface-600 border-surface-200/50 hover:border-brand-300 hover:shadow-soft'
                      )}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={clsx(
                          'w-10 h-10 rounded-xl flex items-center justify-center',
                          formData.role === UserRole.RIDER ? 'bg-white/20' : 'bg-brand-50'
                        )}>
                          <svg className={clsx('w-5 h-5', formData.role === UserRole.RIDER ? 'text-white' : 'text-brand-600')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <span className={formData.role === UserRole.RIDER ? 'text-white' : ''}>Rider</span>
                        <span className={clsx('text-xs font-normal', formData.role === UserRole.RIDER ? 'text-white/70' : 'text-surface-400')}>
                          Book rides
                        </span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField('role', UserRole.DRIVER)}
                      disabled={isLoading}
                      className={clsx(
                        'flex-1 p-4 rounded-2xl font-medium text-sm transition-all duration-200 border-2',
                        formData.role === UserRole.DRIVER
                          ? 'gradient-brand text-white border-brand-500 shadow-lg shadow-brand-500/20 scale-[1.02]'
                          : 'glass text-surface-600 border-surface-200/50 hover:border-brand-300 hover:shadow-soft'
                      )}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={clsx(
                          'w-10 h-10 rounded-xl flex items-center justify-center',
                          formData.role === UserRole.DRIVER ? 'bg-white/20' : 'bg-brand-50'
                        )}>
                          <svg className={clsx('w-5 h-5', formData.role === UserRole.DRIVER ? 'text-white' : 'text-brand-600')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <span className={formData.role === UserRole.DRIVER ? 'text-white' : ''}>Driver</span>
                        <span className={clsx('text-xs font-normal', formData.role === UserRole.DRIVER ? 'text-white/70' : 'text-surface-400')}>
                          Earn money
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: License & Vehicle (Driver only) */}
            {step === 3 && (
              <div key="step3" className="space-y-4 animate-fade-up">
                <div className="p-4 glass rounded-2xl border border-brand-100/50 text-sm text-brand-700 mb-2 flex items-start gap-3">
                  <svg className="w-5 h-5 text-brand-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Please provide your driver license and vehicle details to complete registration.</span>
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

                <div className="border-t border-surface-200 pt-4">
                  <h3 className="text-sm font-bold text-surface-700 mb-4 font-display">Vehicle Information</h3>
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

          <p className="text-center text-sm text-surface-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
