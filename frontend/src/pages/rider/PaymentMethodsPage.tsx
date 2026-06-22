import { useEffect, useState } from 'react';
import { usePayment } from '../../contexts/PaymentContext';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Modal } from '../../components/ui/Modal';
import { getErrorMessage } from '../../services/api';

const CARD_BRAND_ICONS: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  discover: 'Discover',
};

export function PaymentMethodsPage() {
  const { methods, isLoading, fetchMethods, addMethod, removeMethod, setDefaultMethod } = usePayment();
  const { showToast } = useToast();

  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addingMethod, setAddingMethod] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [defaultingId, setDefaultingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        await fetchMethods();
      } catch (e) {
        setError(getErrorMessage(e, 'Failed to load payment methods'));
      } finally {
        setInitialLoad(false);
      }
    };
    load();
  }, [fetchMethods]);

  const validateCardForm = (): boolean => {
    if (!cardNumber.replace(/\s/g, '').match(/^\d{13,19}$/)) {
      setAddError('Invalid card number');
      return false;
    }
    if (!expiry.match(/^\d{2}\/\d{2}$/)) {
      setAddError('Invalid expiry (MM/YY)');
      return false;
    }
    if (!cvc.match(/^\d{3,4}$/)) {
      setAddError('Invalid CVC');
      return false;
    }
    return true;
  };

  const handleAddMethod = async () => {
    if (!validateCardForm()) return;
    setAddingMethod(true);
    setAddError(null);
    try {
      const last4 = cardNumber.replace(/\s/g, '').slice(-4);
      const brand = detectCardBrand(cardNumber.replace(/\s/g, ''));
      const mockPaymentMethodId = `pm_mock_${Date.now()}`;
      await addMethod(mockPaymentMethodId);
      showToast(`${brand} ending in ${last4} added`, 'success');
      setShowAddModal(false);
      setCardNumber('');
      setExpiry('');
      setCvc('');
    } catch (e) {
      setAddError(getErrorMessage(e, 'Failed to add payment method'));
    } finally {
      setAddingMethod(false);
    }
  };

  const detectCardBrand = (num: string): string => {
    if (/^4/.test(num)) return 'visa';
    if (/^5[1-5]/.test(num)) return 'mastercard';
    if (/^3[47]/.test(num)) return 'amex';
    if (/^6011|^65/.test(num)) return 'discover';
    return 'card';
  };

  const handleDeleteClick = (methodId: string) => {
    setDeleteTargetId(methodId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    const method = methods.find((m) => m.id === deleteTargetId);
    if (!method) return;

    if (method.is_default && methods.length <= 1) {
      showToast('Add another payment method before removing the default', 'warning');
      setShowDeleteModal(false);
      setDeleteTargetId(null);
      return;
    }

    setDeleting(true);
    try {
      await removeMethod(deleteTargetId);
      showToast('Payment method removed', 'success');
      setShowDeleteModal(false);
      setDeleteTargetId(null);
    } catch (e) {
      showToast(getErrorMessage(e, 'Failed to remove payment method'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    setDefaultingId(methodId);
    try {
      await setDefaultMethod(methodId);
      showToast('Default payment method updated', 'success');
    } catch (e) {
      showToast(getErrorMessage(e, 'Failed to update default'), 'error');
    } finally {
      setDefaultingId(null);
    }
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setAddError(null);
    setCardNumber('');
    setExpiry('');
    setCvc('');
  };

  const formatCardNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  if (initialLoad && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && methods.length === 0) {
    return <ErrorState message={error} onRetry={fetchMethods} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
          <p className="text-sm text-gray-500 mt-1">Manage how you pay for rides</p>
        </div>
      </div>

      {error && methods.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      {methods.length > 0 ? (
        <div className="space-y-3">
          {methods.map((method) => (
            <Card key={method.id} className="flex items-center gap-4">
              <div className="w-12 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-gray-500 uppercase">
                  {CARD_BRAND_ICONS[method.card_brand] || method.card_brand.slice(0, 4)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 capitalize">
                    {method.card_brand || 'Card'}
                  </p>
                  {method.is_default && (
                    <span className="text-[10px] font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  &bull;&bull;&bull;&bull; {method.card_last4}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!method.is_default && (
                  <button
                    onClick={() => handleSetDefault(method.id)}
                    disabled={defaultingId === method.id}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium px-2 py-1 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50"
                  >
                    {defaultingId === method.id ? '...' : 'Set Default'}
                  </button>
                )}
                <button
                  onClick={() => handleDeleteClick(method.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                  aria-label="Remove payment method"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        !initialLoad && (
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            }
            title="No payment methods"
            description="Add a payment method to start booking rides."
            action={{
              label: 'Add Payment Method',
              onClick: () => setShowAddModal(true),
            }}
          />
        )
      )}

      <Button
        variant="primary"
        size="md"
        fullWidth
        onClick={() => setShowAddModal(true)}
        disabled={initialLoad && isLoading}
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Payment Method
      </Button>

      <Modal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        title="Add Payment Method"
        size="md"
      >
        <div className="space-y-4">
          {addError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {addError}
            </div>
          )}
          <Input
            label="Card Number"
            value={cardNumber}
            onChange={(e) => { setCardNumber(formatCardNumber(e.target.value)); setAddError(null); }}
            placeholder="1234 5678 9012 3456"
            fullWidth
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Expiry (MM/YY)"
              value={expiry}
              onChange={(e) => { setExpiry(formatExpiry(e.target.value)); setAddError(null); }}
              placeholder="MM/YY"
              fullWidth
            />
            <Input
              label="CVC"
              value={cvc}
              onChange={(e) => { setCvc(e.target.value.replace(/\D/g, '').slice(0, 4)); setAddError(null); }}
              placeholder="123"
              fullWidth
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={handleCloseAddModal}>
              Cancel
            </Button>
            <Button variant="primary" fullWidth loading={addingMethod} onClick={handleAddMethod}>
              Add
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteTargetId(null); }}
        title="Remove Payment Method"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to remove this payment method?
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => { setShowDeleteModal(false); setDeleteTargetId(null); }}>
            Keep
          </Button>
          <Button variant="danger" fullWidth loading={deleting} onClick={handleConfirmDelete}>
            Remove
          </Button>
        </div>
      </Modal>
    </div>
  );
}
