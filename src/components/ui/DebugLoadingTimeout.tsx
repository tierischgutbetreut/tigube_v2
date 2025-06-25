import { useState, useEffect } from 'react';

interface DebugLoadingTimeoutProps {
  isLoading: boolean;
  timeoutMs?: number;
  componentName: string;
  debugInfo?: any;
  children: React.ReactNode;
}

function DebugLoadingTimeout({ 
  isLoading, 
  timeoutMs = 5000, 
  componentName,
  debugInfo,
  children 
}: DebugLoadingTimeoutProps) {
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        console.warn(`⚠️ ${componentName} is still loading after ${timeoutMs}ms. Debug info:`, debugInfo);
        setShowTimeout(true);
      }, timeoutMs);

      return () => clearTimeout(timer);
    } else {
      setShowTimeout(false);
    }
  }, [isLoading, timeoutMs, componentName, debugInfo]);

  if (isLoading && showTimeout) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-sm p-6 max-w-md w-full text-center">
          <div className="text-yellow-600 mb-4">⚠️</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Loading Timeout
          </h2>
          <p className="text-gray-600 mb-4">
            {componentName} ist noch am Laden. Dies könnte auf ein Problem hinweisen.
          </p>
          {debugInfo && (
            <details className="text-left text-sm text-gray-500 mb-4">
              <summary className="cursor-pointer">Debug Information</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            className="btn-primary text-sm"
          >
            Seite neu laden
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default DebugLoadingTimeout; 