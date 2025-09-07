import React, { createContext, useContext, useCallback } from 'react';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// Note: This context now provides dynamic notification system
// No more hardcoded values

export const NotificationProvider = ({ children }) => {
  const showSuccess = useCallback((title, message, duration = 4000) => {
    const fullMessage = message ? `${title}: ${message}` : title;
    toast.success(fullMessage, {
      position: 'top-center',
      duration,
      style: {
        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '600',
        borderRadius: '12px',
        boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      },
      iconTheme: {
        primary: '#ffffff',
        secondary: '#10B981',
      },
    });
  }, []);

  const showError = useCallback((title, message, duration = 5000) => {
    const fullMessage = message ? `${title}: ${message}` : title;
    toast.error(fullMessage, {
      position: 'top-center',
      duration,
      style: {
        background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '600',
        borderRadius: '12px',
        boxShadow: '0 8px 25px rgba(239, 68, 68, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      },
      iconTheme: {
        primary: '#ffffff',
        secondary: '#EF4444',
      },
    });
  }, []);

  const showWarning = useCallback((title, message, duration = 4000) => {
    const fullMessage = message ? `${title}: ${message}` : title;
    toast(fullMessage, {
      position: 'top-center',
      duration,
      icon: '⚠️',
      style: {
        background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '600',
        borderRadius: '12px',
        boxShadow: '0 8px 25px rgba(245, 158, 11, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      },
    });
  }, []);

  const showInfo = useCallback((title, message, duration = 4000) => {
    const fullMessage = message ? `${title}: ${message}` : title;
    toast(fullMessage, {
      position: 'top-center',
      duration,
      icon: 'ℹ️',
      style: {
        background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '600',
        borderRadius: '12px',
        boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      },
    });
  }, []);

  const showLoading = useCallback((title, message) => {
    const fullMessage = message ? `${title}: ${message}` : title;
    return toast.loading(fullMessage, {
      position: 'top-center',
      style: {
        background: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '600',
        borderRadius: '12px',
        boxShadow: '0 8px 25px rgba(107, 114, 128, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      },
    });
  }, []);

  const dismissLoading = useCallback((toastId) => {
    toast.dismiss(toastId);
  }, []);

  const value = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    dismissLoading
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Note: This provider now manages dynamic notification state
// No more hardcoded values
