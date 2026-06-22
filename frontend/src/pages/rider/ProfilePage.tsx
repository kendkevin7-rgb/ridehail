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

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className={`w-5 h-5 ${filled ? 'text-amber-400' : 'text-surface-200'}`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

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
  const initials = displayUser.full_name
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Profile Header */}
      <div className="flex flex-col items-center py-6">
        <div className="w-24 h-24 rounded-3xl gradient-brand flex items-center justify-center mb-4 shadow-xl shadow-brand-500/20">
          <span className="text-3xl font-bold text-white font-display">{initials}</span>
        </div>
        <h2 className="text-2xl font-bold text-surface-900 font-display">{displayUser.full_name}</h2>
        <p className="text-sm text-surface-500 mt-1">{displayUser.email}</p>
        <p className="text-xs text-surface-400 mt-2">
          Member since {formatDate(displayUser.created_at)}
        </p>
        {rating > 0 && (
          <div className="flex items-center gap-1 mt-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon key={star} filled={star <= Math.round(rating)} />
            ))}
            <span className="ml-1.5 text-sm font-medium text-surface-600">({rating.toFixed(1)})</span>
          </div>
        )}
      </div>

      {riderError && (
        <div className="p-4 glass-strong rounded-2xl border border-red-200/50 bg-red-50/80 text-sm flex items-center gap-2 animate-fade-in">
          <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-700">{riderError}</span>
        </div>
      )}

      {/* Personal Info Card */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-surface-400 uppercase tracking-wider font-display">
            Personal Information
          </h3>
          {!isEditing ? (
            <button
              onClick={handleStartEdit}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-brand-50"
            >
              Edit
            </button>
          ) : (
            <button
              onClick={handleCancelEdit}
              className="text-xs font-semibold text-surface-500 hover:text-surface-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-100"
            >
              Cancel
            </button>
          )}
        </div>

        {saveError && (
          <div className="p-3 glass-strong rounded-xl border border-red-200/50 bg-red-50/80 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700">{saveError}</span>
          </div>
        )}

        {isEditing ? (
          <div className="space-y-4">
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
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-surface-100">
              <span className="text-sm text-surface-500">Full Name</span>
              <span className="text-sm font-semibold text-surface-900">{displayUser.full_name}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-surface-100">
              <span className="text-sm text-surface-500">Email</span>
              <span className="text-sm font-semibold text-surface-900">{displayUser.email}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-surface-100">
              <span className="text-sm text-surface-500">Phone</span>
              <span className="text-sm font-semibold text-surface-900">{displayUser.phone || 'Not set'}</span>
            </div>
            {profile && (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-surface-500">Total Rides</span>
                <span className="text-sm font-semibold text-surface-900">{profile.ride_count}</span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Payment Methods Link */}
      <Card hoverable onClick={() => navigate('/rider/payments')} className="flex items-center justify-between group">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 flex items-center justify-center shadow-md shadow-orange-500/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-surface-900 font-display">Payment Methods</p>
            <p className="text-xs text-surface-400">Manage your payment options</p>
          </div>
        </div>
        <svg className="w-5 h-5 text-surface-300 group-hover:text-surface-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Card>

      {/* Logout Button */}
      <button
        onClick={() => setShowLogoutModal(true)}
        className="w-full p-4 glass rounded-3xl flex items-center justify-center gap-3 text-red-500 hover:text-red-600 hover:bg-red-50/50 transition-all duration-200 group"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span className="font-semibold">Logout</span>
      </button>

      {/* Logout Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Logout"
        size="sm"
      >
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <p className="text-surface-600 mb-6">
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
        </div>
      </Modal>
    </div>
  );
}
