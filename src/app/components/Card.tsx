'use client';

import React from 'react';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'clickable' | 'bordered';
  borderColor?: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'indigo' | 'orange';
  hover?: boolean;
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

interface CardIconProps {
  icon: ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'indigo' | 'orange';
  className?: string;
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}

interface CardArrowProps {
  className?: string;
}

const Card: React.FC<CardProps> & {
  Header: React.FC<CardHeaderProps>;
  Content: React.FC<CardContentProps>;
  Icon: React.FC<CardIconProps>;
  Title: React.FC<CardTitleProps>;
  Description: React.FC<CardDescriptionProps>;
  Arrow: React.FC<CardArrowProps>;
} = ({ 
  children, 
  className = '', 
  onClick, 
  variant = 'default',
  borderColor,
  hover = true
}) => {
  const baseClasses = 'bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-lg h-full flex flex-col';
  
  const variantClasses = {
    default: '',
    clickable: 'cursor-pointer transform transition-all duration-200',
    bordered: ''
  };

  const hoverClasses = hover && (variant === 'clickable' || onClick) 
    ? 'hover:scale-105 hover:shadow-xl' 
    : '';

  const borderClasses = borderColor ? {
    blue: 'border-l-4 border-blue-500',
    green: 'border-l-4 border-green-500',
    yellow: 'border-l-4 border-yellow-500',
    purple: 'border-l-4 border-purple-500',
    red: 'border-l-4 border-red-500',
    indigo: 'border-l-4 border-indigo-500',
    orange: 'border-l-4 border-orange-500'
  }[borderColor] : '';

  const combinedClasses = [
    baseClasses,
    variantClasses[variant],
    hoverClasses,
    borderClasses,
    className
  ].filter(Boolean).join(' ');

  const CardComponent = onClick ? 'button' : 'div';

  return (
    <CardComponent
      className={combinedClasses}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      {children}
    </CardComponent>
  );
};

const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
};

const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 flex-1 flex flex-col justify-center ${className}`}>
      {children}
    </div>
  );
};

const CardIcon: React.FC<CardIconProps> = ({ icon, color = 'blue', className = '' }) => {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
  }[color];

  return (
    <div className={`flex-shrink-0 ${className}`}>
      <div className={`w-12 h-12 ${colorClasses} rounded-lg flex items-center justify-center`}>
        {icon}
      </div>
    </div>
  );
};

const CardTitle: React.FC<CardTitleProps> = ({ children, className = '' }) => {
  return (
    <h3 className={`text-lg font-medium text-gray-900 dark:text-white ${className}`}>
      {children}
    </h3>
  );
};

const CardDescription: React.FC<CardDescriptionProps> = ({ children, className = '' }) => {
  return (
    <p className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>
      {children}
    </p>
  );
};

const CardArrow: React.FC<CardArrowProps> = ({ className = '' }) => {
  return (
    <div className={`ml-auto ${className}`}>
      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
};

// Attach sub-components
Card.Header = CardHeader;
Card.Content = CardContent;
Card.Icon = CardIcon;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Arrow = CardArrow;

export default Card;