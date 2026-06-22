import { useEffect, useState, useRef, useCallback } from 'react';
import { DocumentStatus } from '../../types';
import type { DriverDocument } from '../../types';
import { useDriver } from '../../contexts/DriverContext';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';

const REQUIRED_DOCUMENTS = [
  { type: 'drivers_license', label: "Driver's License" },
  { type: 'vehicle_registration', label: 'Vehicle Registration' },
  { type: 'insurance', label: 'Insurance' },
];

function getLatestDocument(
  documents: DriverDocument[],
  type: string,
): DriverDocument | undefined {
  return documents
    .filter((d) => d.type === type)
    .sort(
      (a, b) =>
        new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime(),
    )[0];
}

function StatusBadge({ status }: { status: DocumentStatus }) {
  const styles: Record<DocumentStatus, string> = {
    [DocumentStatus.PENDING]: 'badge badge-warning',
    [DocumentStatus.APPROVED]: 'badge badge-success',
    [DocumentStatus.REJECTED]: 'badge badge-error',
  };

  return <span className={styles[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

function DocumentIcon({ type }: { type: string }) {
  if (type === 'drivers_license') {
    return (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
      </svg>
    );
  }
  if (type === 'vehicle_registration') {
    return (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10m10 0h-3m3 0h3m-3 0V8h3l3 4v4" />
      </svg>
    );
  }
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

export default function VerificationPage() {
  const { profile, documents, isLoading: driverLoading, fetchProfile, uploadDocument } = useDriver();
  const { showToast } = useToast();

  const [pageError, setPageError] = useState<string | null>(null);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFileType, setPendingFileType] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await fetchProfile();
      } catch {
        setPageError('Failed to load verification data');
      }
    };
    init();
  }, []);

  const handleUploadClick = useCallback((type: string) => {
    setPendingFileType(type);
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !pendingFileType) return;

      setUploadingType(pendingFileType);
      try {
        await uploadDocument(pendingFileType, file);
        showToast('Document uploaded successfully', 'success');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to upload document';
        showToast(message, 'error');
      } finally {
        setUploadingType(null);
        setPendingFileType(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [pendingFileType, uploadDocument, showToast],
  );

  const handleDragOver = useCallback((e: React.DragEvent, type: string) => {
    e.preventDefault();
    setDragOver(type);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(null);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, type: string) => {
      e.preventDefault();
      setDragOver(null);
      const file = e.dataTransfer.files?.[0];
      if (!file) return;

      setUploadingType(type);
      try {
        await uploadDocument(type, file);
        showToast('Document uploaded successfully', 'success');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to upload document';
        showToast(message, 'error');
      } finally {
        setUploadingType(null);
      }
    },
    [uploadDocument, showToast],
  );

  const isLoading = driverLoading && !profile;

  const allApproved = REQUIRED_DOCUMENTS.every((doc) => {
    const d = getLatestDocument(documents, doc.type);
    return d?.status === DocumentStatus.APPROVED;
  });

  const anyRejected = REQUIRED_DOCUMENTS.some((doc) => {
    const d = getLatestDocument(documents, doc.type);
    return d?.status === DocumentStatus.REJECTED;
  });

  const anyPending = REQUIRED_DOCUMENTS.some((doc) => {
    const d = getLatestDocument(documents, doc.type);
    return d?.status === DocumentStatus.PENDING || !d;
  });

  if (isLoading) {
    return (
      <div className="animate-fade-up space-y-4 p-4 max-w-2xl mx-auto">
        <div className="skeleton h-10 w-40 rounded-lg" />
        <div className="skeleton h-32 w-full rounded-2xl" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-20 w-full rounded-2xl" />
        ))}
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

  return (
    <div className="animate-fade-up space-y-5 p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-white">Verification</h1>

      {allApproved ? (
        <div className="rounded-2xl p-5 gradient-success">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-display font-semibold text-white">Verification Complete</h3>
              <p className="text-sm text-white/80">All documents approved. You can now accept rides.</p>
            </div>
          </div>
        </div>
      ) : anyRejected ? (
        <div className="rounded-2xl p-5 gradient-warm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-display font-semibold text-white">Documents Require Attention</h3>
              <p className="text-sm text-white/80">Some documents were rejected. Please review and re-upload.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl p-5 gradient-brand">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-display font-semibold text-white">Verification Pending</h3>
              <p className="text-sm text-white/80">Your documents are being reviewed. This usually takes 1-2 business days.</p>
            </div>
          </div>
        </div>
      )}

      {documents.length === 0 && (
        <EmptyState
          icon={
            <svg className="w-12 h-12 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          title="No documents uploaded"
          description="Upload your documents below to start the verification process."
        />
      )}

      <div className="space-y-4">
        {REQUIRED_DOCUMENTS.map((doc) => (
          <DocumentCard
            key={doc.type}
            label={doc.label}
            type={doc.type}
            document={getLatestDocument(documents, doc.type)}
            uploading={uploadingType === doc.type}
            onUpload={handleUploadClick}
            dragOver={dragOver === doc.type}
            onDragOver={(e) => handleDragOver(e, doc.type)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, doc.type)}
          />
        ))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

function DocumentCard({
  label,
  type,
  document: doc,
  uploading,
  onUpload,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  label: string;
  type: string;
  document?: DriverDocument;
  uploading: boolean;
  onUpload: (type: string) => void;
  dragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const status = doc?.status;

  return (
    <Card
      className={clsx(
        '!p-5 transition-all duration-200',
        dragOver && 'border-2 border-brand-500 border-dashed',
      )}
    >
      <div
        className="flex items-center justify-between"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div
            className={clsx(
              'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
              status === DocumentStatus.APPROVED
                ? 'bg-emerald-500/20 text-emerald-400'
                : status === DocumentStatus.REJECTED
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-surface-700 text-surface-400',
            )}
          >
            <DocumentIcon type={type} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{label}</p>
            {doc ? (
              <p className="text-xs text-surface-400 mt-0.5">
                Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
              </p>
            ) : (
              <p className="text-xs text-surface-500 mt-0.5">Not uploaded</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {doc && <StatusBadge status={doc.status} />}
          <Button
            variant={doc ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => onUpload(type)}
            loading={uploading}
            className={clsx(uploading && 'opacity-70')}
          >
            {uploading ? 'Uploading...' : doc ? 'Re-upload' : 'Upload'}
          </Button>
        </div>
      </div>
      {doc?.status === DocumentStatus.REJECTED && (
        <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-red-400 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Your document was rejected. Please upload a new version.
          </p>
        </div>
      )}
      {!doc && (
        <div
          className="mt-3 p-4 rounded-xl border-2 border-dashed border-surface-600 text-center cursor-pointer hover:border-brand-500/50 transition-colors"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => onUpload(type)}
        >
          <p className="text-xs text-surface-400">
            <span className="text-brand-400 font-medium">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-surface-500 mt-1">PDF, PNG, JPG up to 10MB</p>
        </div>
      )}
    </Card>
  );
}
