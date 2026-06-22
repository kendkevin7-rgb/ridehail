import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRider } from '../../contexts/RiderContext';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { Modal } from '../../components/ui/Modal';
import { getErrorMessage } from '../../services/api';

export function ProfilePage() {
  const { user, logout } = useAuth();
  const { profile, isLoading, error: riderError, fetchProfile, updateProfile } = useRider();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        await fetchProfile();
        setInitialLoad(false);
      } catch {
        setInitialLoad(false);
      }
    };
    load();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    } else if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
    }
  }, [profile, user]);

  const handleStartEdit = () => {
    if (profile) {
      setFullName(profile.full_name);
      setPhone(profile.phone);
    } else if (user) {
      setFullName(user.full_name);
      setPhone(user.phone);
    }
    setSaveError(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (profile) {
      setFullName(profile.full_name);
      setPhone(profile.phone);
    } else if (user) {
      setFullName(user.full_name);
      setPhone(user.phone);
    }
    setSaveError(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      setSaveError('Full name is required');
      return;
    }
    if (!phone.trim()) {
      setSaveError('Phone number is required');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await updateProfile({ full_name: fullName.trim(), phone: phone.trim() });
      showToast('Profile updated successfully', 'success');
      setIsEditing(false);
    } catch (e) {
      setSaveError(getErrorMessage(e, 'Failed to update profile'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
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
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const displayUser = profile || user;

  if (initialLoad && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (riderError && !displayUser) {
    return <ErrorState message={riderError} onRetry={fetchProfile} />;
  }

  if (!displayUser) {
    return (
      <ErrorState
        message="Unable to load profile information."
        onRetry={fetchProfile}
      />
    );
  }

  const rating = profile?.rating ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        {!isEditing ? (
          <Button variant="secondary" size="sm" onClick={handleStartEdit}>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleCancelEdit}>
              Cancel
            </Button>
          </div>
        )}
      </div>

      {riderError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {riderError}
        </div>
      )}

      <div className="flex flex-col items-center py-6">
        <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mb-4">
          <span className="text-3xl font-bold text-primary-600">
            {displayUser.full_name.charAt(0).toUpperCase()}
          </span>
        </div>
        <h2 className="text-xl font-bold text-gray-900">{displayUser.full_name}</h2>
        <div className="flex items-center gap-1 mt-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className={`w-5 h-5 ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          {rating > 0 && (
            <span className="ml-1 text-sm text-gray-500">({rating.toFixed(1)})</span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Member since {formatDate(displayUser.created_at)}
        </p>
      </div>

      <Card className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Personal Information
        </h3>

        {saveError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
            {saveError}
          </div>
        )}

        {isEditing ? (
          <>
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); setSaveError(null); }}
              placeholder="Your full name"
              fullWidth
            />
            <Input
              label="Email"
              value={displayUser.email}
              disabled
              fullWidth
              helperText="Email cannot be changed"
            />
            <Input
              label="Phone"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setSaveError(null); }}
              placeholder="Your phone number"
              fullWidth
            />
            <Button
              variant="primary"
              fullWidth
              loading={saving}
              onClick={handleSave}
            >
              Save Changes
            </Button>
          </>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Full Name</p>
              <p className="text-sm font-medium text-gray-900">{displayUser.full_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-900">{displayUser.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm font-medium text-gray-900">{displayUser.phone || 'Not set'}</p>
            </div>
            {profile && (
              <div>
                <p className="text-xs text-gray-500">Total Rides</p>
                <p className="text-sm font-medium text-gray-900">{profile.ride_count}</p>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card hoverable onClick={() => navigate('/rider/payments')} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Payment Methods</p>
            <p className="text-xs text-gray-500">Manage your payment options</p>
          </div>
        </div>
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Card>

      <Button
        variant="danger"
        size="md"
        fullWidth
        onClick={() => setShowLogoutModal(true)}
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Logout
      </Button>

      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Logout"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to log out? You'll need to sign in again to book rides.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setShowLogoutModal(false)}>
            Stay Logged In
          </Button>
          <Button variant="danger" fullWidth loading={loggingOut} onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </Modal>
    </div>
  );
}
