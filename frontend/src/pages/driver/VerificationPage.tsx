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
    [DocumentStatus.PENDING]:
      'bg-yellow-100 text-yellow-800',
    [DocumentStatus.APPROVED]:
      'bg-green-100 text-green-800',
    [DocumentStatus.REJECTED]:
      'bg-red-100 text-red-800',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function VerificationPage() {
  const { profile, documents, isLoading: driverLoading, fetchProfile, uploadDocument } = useDriver();
  const { showToast } = useToast();

  const [pageError, setPageError] = useState<string | null>(null);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
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

  if (documents.length === 0) {
    return (
      <div className="space-y-6 p-4 md:p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">Verification</h1>
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          }
          title="No documents uploaded"
          description="Upload your documents below to start the verification process."
        />
        <div className="space-y-4">
          {REQUIRED_DOCUMENTS.map((doc) => (
            <DocumentCard
              key={doc.type}
              label={doc.label}
              type={doc.type}
              document={getLatestDocument(documents, doc.type)}
              uploading={uploadingType === doc.type}
              onUpload={handleUploadClick}
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

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">Verification</h1>

      {allApproved ? (
        <Card className="!p-6 border-l-4 border-l-green-500 bg-green-50">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-green-800">Verification Complete</h3>
              <p className="text-sm text-green-700">
                All documents have been approved. You can now accept rides.
              </p>
            </div>
          </div>
        </Card>
      ) : anyRejected ? (
        <Card className="!p-6 border-l-4 border-l-red-500 bg-red-50">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-red-800">Documents Require Attention</h3>
              <p className="text-sm text-red-700">
                Some documents were rejected. Please review and re-upload.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="!p-6 border-l-4 border-l-yellow-500 bg-yellow-50">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-yellow-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-yellow-800">Verification Pending</h3>
              <p className="text-sm text-yellow-700">
                Your documents are being reviewed. This usually takes 1-2 business days.
              </p>
            </div>
          </div>
        </Card>
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
}: {
  label: string;
  type: string;
  document?: DriverDocument;
  uploading: boolean;
  onUpload: (type: string) => void;
}) {
  return (
    <Card className="!p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{label}</p>
            {doc ? (
              <p className="text-xs text-gray-500 mt-0.5">
                Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-0.5">Not uploaded</p>
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
          >
            {doc ? 'Re-upload' : 'Upload'}
          </Button>
        </div>
      </div>
      {doc?.status === DocumentStatus.REJECTED && (
        <p className="mt-2 text-xs text-red-600 ml-[52px]">
          Your document was rejected. Please upload a new version.
        </p>
      )}
    </Card>
  );
}
