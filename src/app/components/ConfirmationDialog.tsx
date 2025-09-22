'use client';

import React, { useState } from 'react';
import { ExclamationTriangleIcon, InformationCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (comments?: string) => void;
  onClose: () => void;
  confirmButtonClass?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  showComments?: boolean;
  commentsLabel?: string;
  commentsPlaceholder?: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onClose,
  confirmButtonClass,
  variant = 'warning',
  showComments = false,
  commentsLabel = 'Comments (optional)',
  commentsPlaceholder = 'Add your comments...'
}) => {
  const [comments, setComments] = useState('');
  
  if (!isOpen) {
    return null;
  }
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: 'text-red-600 dark:text-red-400',
          iconBg: 'bg-red-100 dark:bg-red-900/20',
          confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 dark:bg-red-600 dark:hover:bg-red-700 text-white',
          IconComponent: ExclamationTriangleIcon
        };
      case 'success':
        return {
          icon: 'text-green-600 dark:text-green-400',
          iconBg: 'bg-green-100 dark:bg-green-900/20',
          confirmButton: 'bg-green-600 hover:bg-green-700 focus:ring-green-500 dark:bg-green-600 dark:hover:bg-green-700 text-white',
          IconComponent: InformationCircleIcon
        };
      case 'warning':
        return {
          icon: 'text-yellow-600 dark:text-yellow-400',
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/20',
          confirmButton: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white',
          IconComponent: ExclamationCircleIcon
        };
      case 'info':
        return {
          icon: 'text-blue-600 dark:text-blue-400',
          iconBg: 'bg-blue-100 dark:bg-blue-900/20',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700 text-white',
          IconComponent: InformationCircleIcon
        };
      default:
        return {
          icon: 'text-yellow-600 dark:text-yellow-400',
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/20',
          confirmButton: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white',
          IconComponent: ExclamationCircleIcon
        };
    }
  };
  
  const styles = getVariantStyles();
  const { IconComponent } = styles;

  const handleConfirm = () => {
    onConfirm(showComments ? comments : undefined);
    setComments(''); // Reset comments after confirm
  };

  const handleClose = () => {
    setComments(''); // Reset comments on close
    onClose();
  };
  
  return (
    <div 
      className="fixed inset-0 z-[9999] overflow-y-auto transition-opacity duration-300"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)' }}
      onClick={handleClose}
    >
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
        <div 
          className="relative inline-block align-middle bg-white dark:bg-gray-800 rounded-xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-2xl transform transition-all max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sm:flex sm:items-start">
            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${styles.iconBg} sm:mx-0 sm:h-10 sm:w-10`}>
              <IconComponent className={`h-6 w-6 ${styles.icon}`} aria-hidden="true" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
              <h3 className="text-lg leading-6 font-semibold text-gray-900 dark:text-white mb-2">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>
          </div>
          
          {showComments && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {commentsLabel}
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                style={{
                  focusRingColor: variant === 'success' ? '#10b981' : variant === 'danger' ? '#ef4444' : '#6366f1'
                }}
                placeholder={commentsPlaceholder}
              />
            </div>
          )}
          
          <div className="mt-6 sm:mt-6 sm:flex sm:flex-row-reverse gap-3">
            <button
              type="button"
              className={`w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 text-sm font-medium transition-all duration-200 ${confirmButtonClass || styles.confirmButton} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 sm:w-auto hover:shadow-lg transform hover:scale-105`}
              onClick={handleConfirm}
            >
              {confirmText}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2.5 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:ring-offset-white dark:focus:ring-offset-gray-800 sm:mt-0 sm:w-auto transition-all duration-200 hover:shadow-md"
              onClick={handleClose}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;