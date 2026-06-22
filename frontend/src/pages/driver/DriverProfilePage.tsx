import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDriver } from '../../contexts/DriverContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { Modal } from '../../components/ui/Modal';

export default function DriverProfilePage() {
  const { profile, isLoading: driverLoading, fetchProfile, updateProfile } = useDriver();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [pageError, setPageError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    license_number: '',
  });

  const [vehicleForm, setVehicleForm] = useState({
    make: '',
    model: '',
    year: '',
    color: '',
    plate_number: '',
    vehicle_type: '',
  });

  useEffect(() => {
    const init = async () => {
      try {
        await fetchProfile();
      } catch {
        setPageError('Failed to load profile');
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || user?.full_name || '',
        email: profile.email || user?.email || '',
        phone: profile.phone || user?.phone || '',
        license_number: profile.license_number || '',
      });
      if (profile.vehicle) {
        setVehicleForm({
          make: profile.vehicle.make || '',
          model: profile.vehicle.model || '',
          year: profile.vehicle.year?.toString() || '',
          color: profile.vehicle.color || '',
          plate_number: profile.vehicle.plate_number || '',
          vehicle_type: profile.vehicle.vehicle_type || '',
        });
      }
    }
  }, [profile, user]);

  const handleFieldChange = useCallback(
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    },
    [],
  );

  const handleVehicleFieldChange = useCallback(
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setVehicleForm((prev) => ({ ...prev, [field]: e.target.value }));
    },
    [],
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await updateProfile({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        license_number: form.license_number,
        vehicle: {
          id: profile?.vehicle?.id || '',
          driver_id: profile?.id || '',
          make: vehicleForm.make,
          model: vehicleForm.model,
          year: parseInt(vehicleForm.year, 10) || 0,
          color: vehicleForm.color,
          plate_number: vehicleForm.plate_number,
          vehicle_type: vehicleForm.vehicle_type,
        },
      });
      showToast('Profile updated successfully', 'success');
      setIsEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  }, [form, vehicleForm, profile, updateProfile, showToast]);

  const handleCancel = useCallback(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || user?.full_name || '',
        email: profile.email || user?.email || '',
        phone: profile.phone || user?.phone || '',
        license_number: profile.license_number || '',
      });
      if (profile.vehicle) {
        setVehicleForm({
          make: profile.vehicle.make || '',
          model: profile.vehicle.model || '',
          year: profile.vehicle.year?.toString() || '',
          color: profile.vehicle.color || '',
          plate_number: profile.vehicle.plate_number || '',
          vehicle_type: profile.vehicle.vehicle_type || '',
        });
      }
    }
    setIsEditing(false);
  }, [profile, user]);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch {
      showToast('Failed to log out', 'error');
    } finally {
      setLoggingOut(false);
      setShowLogoutModal(false);
    }
  }, [logout, navigate, showToast]);

  const isLoading = driverLoading && !profile;

  if (isLoading) {
    return (
      <div className="animate-fade-up space-y-4 p-4 max-w-2xl mx-auto">
        <div className="flex flex-col items-center mb-6">
          <div className="skeleton w-24 h-24 rounded-full mb-4" />
          <div className="skeleton h-6 w-40 rounded-lg mb-1" />
          <div className="skeleton h-4 w-32 rounded-lg" />
        </div>
        <div className="skeleton h-44 w-full rounded-2xl" />
        <div className="skeleton h-44 w-full rounded-2xl" />
        <div className="skeleton h-20 w-full rounded-2xl" />
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="animate-fade-up">
        <ErrorState message={pageError} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const name = profile?.full_name || user?.full_name || 'Driver';
  const email = profile?.email || user?.email || '';
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const rating = profile?.rating ?? 0;

  return (
    <div className="animate-fade-up space-y-5 p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex flex-col items-center text-center mb-2">
        <div className="w-24 h-24 rounded-full gradient-brand flex items-center justify-center mb-4 shadow-lg shadow-brand-500/30">
          <span className="text-3xl font-display font-bold text-white">{initials}</span>
        </div>
        <h1 className="text-xl font-display font-bold text-white">{name}</h1>
        <p className="text-sm text-surface-400">{email}</p>
      </div>

      {isEditing && (
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} loading={saving}>
            Save Changes
          </Button>
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Personal Info
          </h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-brand-400 hover:text-brand-300 font-medium transition-colors"
            >
              Edit
            </button>
          )}
        </div>
        {isEditing ? (
          <div className="space-y-4">
            <Input label="Full Name" value={form.full_name} onChange={handleFieldChange('full_name')} fullWidth />
            <Input label="Email" type="email" value={form.email} onChange={handleFieldChange('email')} fullWidth />
            <Input label="Phone" type="tel" value={form.phone} onChange={handleFieldChange('phone')} fullWidth />
            <Input label="License Number" value={form.license_number} onChange={handleFieldChange('license_number')} fullWidth />
          </div>
        ) : (
          <div className="space-y-3">
            <ProfileRow label="Name" value={profile?.full_name || user?.full_name || '—'} />
            <ProfileRow label="Email" value={profile?.email || user?.email || '—'} />
            <ProfileRow label="Phone" value={profile?.phone || user?.phone || '—'} />
            <ProfileRow label="License Number" value={profile?.license_number || '—'} />
          </div>
        )}
      </Card>

      <Card>
        <h2 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10m10 0h-3m3 0h3m-3 0V8h3l3 4v4" />
          </svg>
          Vehicle Info
        </h2>
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Make" value={vehicleForm.make} onChange={handleVehicleFieldChange('make')} fullWidth />
              <Input label="Model" value={vehicleForm.model} onChange={handleVehicleFieldChange('model')} fullWidth />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Year" type="number" value={vehicleForm.year} onChange={handleVehicleFieldChange('year')} fullWidth />
              <Input label="Color" value={vehicleForm.color} onChange={handleVehicleFieldChange('color')} fullWidth />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Plate Number" value={vehicleForm.plate_number} onChange={handleVehicleFieldChange('plate_number')} fullWidth />
              <Input label="Vehicle Type" value={vehicleForm.vehicle_type} onChange={handleVehicleFieldChange('vehicle_type')} fullWidth />
            </div>
          </div>
        ) : profile?.vehicle ? (
          <div className="space-y-3">
            <ProfileRow label="Make" value={profile.vehicle.make} />
            <ProfileRow label="Model" value={profile.vehicle.model} />
            <ProfileRow label="Year" value={profile.vehicle.year.toString()} />
            <ProfileRow label="Color" value={profile.vehicle.color} />
            <ProfileRow label="Plate Number" value={profile.vehicle.plate_number} />
            <ProfileRow label="Type" value={profile.vehicle.vehicle_type} />
          </div>
        ) : (
          <p className="text-sm text-surface-500">No vehicle information available.</p>
        )}
      </Card>

      <Card>
        <h2 className="font-display font-semibold text-white mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Rating
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(rating) ? 'text-amber-400' : 'text-surface-600'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-sm font-medium text-white">
            {rating > 0 ? rating.toFixed(1) : 'New'}
          </span>
          {profile && profile.ride_count > 0 && (
            <span className="text-xs text-surface-400">({profile.ride_count} rides)</span>
          )}
        </div>
      </Card>

      <Card
        hoverable
        onClick={() => navigate('/driver/verification')}
        className="cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-700 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Documents</p>
              <p className="text-xs text-surface-400">View verification documents</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Card>

      <div className="pt-2">
        <Button
          variant="danger"
          fullWidth
          onClick={() => setShowLogoutModal(true)}
        >
          Logout
        </Button>
      </div>

      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Logout"
        size="sm"
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <p className="text-sm text-surface-400 mb-6">
            Are you sure you want to log out? You will stop receiving ride requests.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => setShowLogoutModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleLogout} loading={loggingOut}>
              Logout
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-surface-400">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}
