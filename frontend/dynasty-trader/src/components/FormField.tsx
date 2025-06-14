import React from 'react';
import { cn } from '../utils/cn';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required = false,
  children,
  className
}) => {
  return (
    <div className={cn('space-y-1', className)}>
      <label className="block text-sm font-medium text-gray-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <div className="relative">
        {children}
      </div>
      {error && (
        <p className="text-sm text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ error, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full px-4 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400',
          'focus:outline-none focus:ring-2 transition-colors',
          error 
            ? 'border-red-500 focus:ring-red-500' 
            : 'border-gray-600 focus:ring-blue-500 focus:border-transparent',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full px-4 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400',
          'focus:outline-none focus:ring-2 transition-colors resize-none',
          error 
            ? 'border-red-500 focus:ring-red-500' 
            : 'border-gray-600 focus:ring-blue-500 focus:border-transparent',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

// Password strength indicator component
interface PasswordStrengthProps {
  strength: 'weak' | 'medium' | 'strong';
  show: boolean;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ strength, show }) => {
  if (!show) return null;
  
  const getStrengthColor = () => {
    switch (strength) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
    }
  };
  
  const getStrengthWidth = () => {
    switch (strength) {
      case 'weak': return 'w-1/3';
      case 'medium': return 'w-2/3';
      case 'strong': return 'w-full';
    }
  };
  
  return (
    <div className="mt-1">
      <div className="h-1 bg-gray-600 rounded-full overflow-hidden">
        <div 
          className={cn(
            'h-full transition-all duration-300',
            getStrengthColor(),
            getStrengthWidth()
          )}
        />
      </div>
      <p className={cn('text-xs mt-1', {
        'text-red-400': strength === 'weak',
        'text-yellow-400': strength === 'medium',
        'text-green-400': strength === 'strong',
      })}>
        Password strength: {strength}
      </p>
    </div>
  );
};