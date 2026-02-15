import React from 'react';

interface RetryLoopState {
  isActive: boolean;
  currentAttempt: number;
  maxRetries: number;
  phase: 'analyzing' | 'improving-plan' | 'regenerating' | 'validating' | 'idle';
  totalErrors: number;
  errorsHistory: Array<{
    attempt: number;
    errors: number;
    errorsFixed: number;
  }>;
  status: 'in-progress' | 'success' | 'failed' | 'idle';
}

interface RetryLoopCardProps {
  retryLoopState: RetryLoopState;
}

const RetryLoopCard: React.FC<RetryLoopCardProps> = ({ retryLoopState }) => {
  const { isActive, currentAttempt, maxRetries, phase, totalErrors, errorsHistory, status } = retryLoopState;

  // Don't show the card if retry loop has never been activated
  if (!isActive && status === 'idle' && errorsHistory.length === 0) {
    return null;
  }

  // Phase descriptions
  const phaseDescriptions = {
    'analyzing': '🤖 Analyzing errors with AI...',
    'improving-plan': '📋 Generating improved migration plan...',
    'regenerating': '⚙️ Regenerating code with fixes...',
    'validating': '🧪 Running validation tests...',
    'idle': 'Waiting...'
  };

  // Phase colors
  const phaseColors = {
    'analyzing': 'text-blue-600',
    'improving-plan': 'text-purple-600',
    'regenerating': 'text-orange-600',
    'validating': 'text-green-600',
    'idle': 'text-gray-600'
  };

  // Status badge
  const renderStatusBadge = () => {
    if (status === 'success') {
      return (
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold">Zero Errors Achieved!</span>
        </div>
      );
    } else if (status === 'failed') {
      return (
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg border border-red-200">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold">Max Retries Reached</span>
        </div>
      );
    } else if (status === 'in-progress') {
      return (
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-semibold">Retry in Progress...</span>
        </div>
      );
    }
    return null;
  };

  // Calculate error reduction percentage
  const calculateErrorReduction = () => {
    if (errorsHistory.length < 2) return null;
    const firstAttempt = errorsHistory[0];
    const lastAttempt = errorsHistory[errorsHistory.length - 1];
    if (firstAttempt.errors === 0) return null;
    const reduction = ((firstAttempt.errors - lastAttempt.errors) / firstAttempt.errors) * 100;
    return Math.round(reduction);
  };

  const errorReduction = calculateErrorReduction();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Intelligent Retry Loop</h3>
        {renderStatusBadge()}
      </div>

      {/* Current Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Attempt {currentAttempt} of {maxRetries}
          </span>
          <span className="text-sm font-medium text-gray-700">
            {totalErrors} error{totalErrors !== 1 ? 's' : ''} remaining
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div
            className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${(currentAttempt / maxRetries) * 100}%` }}
          ></div>
        </div>

        {/* Phase indicator */}
        {isActive && phase !== 'idle' && (
          <div className={`text-sm font-medium ${phaseColors[phase]} mt-2`}>
            {phaseDescriptions[phase]}
          </div>
        )}
      </div>

      {/* Error History */}
      {errorsHistory.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Error Progress</h4>
          <div className="space-y-2">
            {errorsHistory.map((history, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold">
                    {history.attempt}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {history.errors} error{history.errors !== 1 ? 's' : ''}
                    </div>
                    {history.errorsFixed > 0 && (
                      <div className="text-xs text-green-600">
                        ✓ {history.errorsFixed} fixed
                      </div>
                    )}
                  </div>
                </div>

                {/* Error count badge */}
                <div
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    history.errors === 0
                      ? 'bg-emerald-100 text-emerald-700'
                      : history.errors < 10
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {history.errors === 0 ? '✅ Zero' : history.errors}
                </div>
              </div>
            ))}
          </div>

          {/* Error reduction stat */}
          {errorReduction !== null && errorReduction > 0 && (
            <div className="mt-3 text-center p-3 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-green-700 font-semibold">
                📉 {errorReduction}% error reduction
              </span>
            </div>
          )}
        </div>
      )}

      {/* Success message */}
      {status === 'success' && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-emerald-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-semibold text-emerald-900 mb-1">
                Migration Successful!
              </h4>
              <p className="text-sm text-emerald-700">
                All validation errors have been automatically fixed through {currentAttempt} intelligent {currentAttempt === 1 ? 'retry' : 'retries'}. Your code is production-ready!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Failure message */}
      {status === 'failed' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-semibold text-red-900 mb-1">
                Manual Intervention Required
              </h4>
              <p className="text-sm text-red-700">
                After {maxRetries} retries, {totalErrors} error{totalErrors !== 1 ? 's' : ''} still remain. These may require manual fixes. Check the validation reports for details.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetryLoopCard;
