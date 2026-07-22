import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DiagnosticErrorCard, DiagnosticErrorData } from '../components/common/DiagnosticErrorCard';

interface ErrorDiagnosticsContextType {
  showDiagnosticError: (code: string, message: string, technicalDetails?: string | any, module?: string) => void;
  clearDiagnosticError: () => void;
  currentError: DiagnosticErrorData | null;
}

const ErrorDiagnosticsContext = createContext<ErrorDiagnosticsContextType | undefined>(undefined);

export const ErrorDiagnosticsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentError, setCurrentError] = useState<DiagnosticErrorData | null>(null);

  const showDiagnosticError = (code: string, message: string, technicalDetails?: string | any, module?: string) => {
    let techStr = '';
    if (typeof technicalDetails === 'string') {
      techStr = technicalDetails;
    } else if (technicalDetails && typeof technicalDetails === 'object') {
      try {
        techStr = technicalDetails.message ? `${technicalDetails.message}\n${JSON.stringify(technicalDetails, null, 2)}` : JSON.stringify(technicalDetails, null, 2);
      } catch {
        techStr = String(technicalDetails);
      }
    }

    setCurrentError({
      code,
      message,
      technicalDetails: techStr,
      module: module || 'App',
      timestamp: new Date().toISOString(),
    });
  };

  const clearDiagnosticError = () => {
    setCurrentError(null);
  };

  return (
    <ErrorDiagnosticsContext.Provider value={{ showDiagnosticError, clearDiagnosticError, currentError }}>
      {children}
      <DiagnosticErrorCard error={currentError} onClose={clearDiagnosticError} />
    </ErrorDiagnosticsContext.Provider>
  );
};

export const useErrorDiagnostics = () => {
  const context = useContext(ErrorDiagnosticsContext);
  if (!context) {
    throw new Error('useErrorDiagnostics debe ser usado dentro de un ErrorDiagnosticsProvider');
  }
  return context;
};
