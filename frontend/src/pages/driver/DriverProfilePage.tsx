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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (pageError) {
    return (
      <ErrorState message={pageError} onRetry={() => window.location.reload()} />
    );
  }

  const rating = profile?.rating ?? 0;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        {!isEditing ? (
          <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} loading={saving}>
              Save
            </Button>
          </div>
        )}
      </div>

      {/* Driver Info */}
      <Card className="!p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Driver Information
        </h2>
        {isEditing ? (
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={form.full_name}
              onChange={handleFieldChange('full_name')}
              fullWidth
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={handleFieldChange('email')}
              fullWidth
            />
            <Input
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={handleFieldChange('phone')}
              fullWidth
            />
            <Input
              label="License Number"
              value={form.license_number}
              onChange={handleFieldChange('license_number')}
              fullWidth
            />
          </div>
        ) : (
          <div className="space-y-3">
            <ProfileRow label="Name" value={profile?.full_name || user?.full_name || '—'} />
            <ProfileRow label="Email" value={profile?.email || user?.email || '—'} />
            <ProfileRow label="Phone" value={profile?.phone || user?.phone || '—'} />
            <ProfileRow
              label="License Number"
              value={profile?.license_number || '—'}
            />
          </div>
        )}
      </Card>

      {/* Vehicle Info */}
      <Card className="!p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Vehicle Information
        </h2>
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Make"
                value={vehicleForm.make}
                onChange={handleVehicleFieldChange('make')}
                fullWidth
              />
              <Input
                label="Model"
                value={vehicleForm.model}
                onChange={handleVehicleFieldChange('model')}
                fullWidth
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Year"
                type="number"
                value={vehicleForm.year}
                onChange={handleVehicleFieldChange('year')}
                fullWidth
              />
              <Input
                label="Color"
                value={vehicleForm.color}
                onChange={handleVehicleFieldChange('color')}
                fullWidth
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Plate Number"
                value={vehicleForm.plate_number}
                onChange={handleVehicleFieldChange('plate_number')}
                fullWidth
              />
              <Input
                label="Vehicle Type"
                value={vehicleForm.vehicle_type}
                onChange={handleVehicleFieldChange('vehicle_type')}
                fullWidth
              />
            </div>
          </div>
        ) : profile?.vehicle ? (
          <div className="space-y-3">
            <ProfileRow
              label="Make"
              value={profile.vehicle.make}
            />
            <ProfileRow
              label="Model"
              value={profile.vehicle.model}
            />
            <ProfileRow
              label="Year"
              value={profile.vehicle.year.toString()}
            />
            <ProfileRow
              label="Color"
              value={profile.vehicle.color}
            />
            <ProfileRow
              label="Plate Number"
              value={profile.vehicle.plate_number}
            />
            <ProfileRow
              label="Type"
              value={profile.vehicle.vehicle_type}
            />
          </div>
        ) : (
          <p className="text-sm text-gray-400">No vehicle information available.</p>
        )}
      </Card>

      {/* Rating */}
      <Card className="!p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Rating</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-5 h-5 ${
                      star <= Math.round(rating)
                        ? 'text-yellow-400'
                        : 'text-gray-200'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm font-medium text-gray-900">
                {rating > 0 ? rating.toFixed(1) : 'New'}
              </span>
              {profile && profile.ride_count > 0 && (
                <span className="text-xs text-gray-500">
                  ({profile.ride_count} rides)
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Documents Link */}
      <Card className="!p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/driver/verification')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Documents</p>
              <p className="text-xs text-gray-500">
                View and manage verification documents
              </p>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Card>

      {/* Logout */}
      <div className="pt-2">
        <Button
          variant="danger"
          fullWidth
          onClick={() => setShowLogoutModal(true)}
        >
          Logout
        </Button>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Logout"
      >
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to log out? You will stop receiving ride requests.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="secondary"
              onClick={() => setShowLogoutModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleLogout}
              loading={loggingOut}
            >
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
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
