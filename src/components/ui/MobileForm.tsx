'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mobile Input Component
interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
}

export function MobileInput({
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  variant = 'default',
  className,
  type,
  ...props
}: MobileInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const variants = {
    default: 'bg-slate-800/50 border-slate-600 focus:border-blue-500',
    filled: 'bg-slate-700 border-transparent focus:border-blue-500',
    outlined: 'bg-transparent border-slate-600 focus:border-blue-500'
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        {label}
      </label>
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}
        
        <input
          type={inputType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            'w-full px-4 py-3 rounded-lg border text-white placeholder-gray-400 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/20',
            leftIcon && 'pl-10',
            (rightIcon || isPassword) && 'pr-10',
            variants[variant],
            isFocused && 'transform scale-[1.02]',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        />
        
        {/* Password Toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
        
        {/* Right Icon */}
        {rightIcon && !isPassword && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      
      {/* Helper/Error Text */}
      <AnimatePresence>
        {(error || helper) && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              'text-sm',
              error ? 'text-red-400' : 'text-gray-400'
            )}
          >
            {error || helper}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// Mobile Textarea Component
interface MobileTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helper?: string;
  resizable?: boolean;
}

export function MobileTextarea({
  label,
  error,
  helper,
  resizable = true,
  className,
  ...props
}: MobileTextareaProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        {label}
      </label>
      
      <textarea
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          'w-full px-4 py-3 rounded-lg border bg-slate-800/50 border-slate-600 text-white placeholder-gray-400 transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
          isFocused && 'transform scale-[1.02]',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
          !resizable && 'resize-none',
          className
        )}
        {...props}
      />
      
      <AnimatePresence>
        {(error || helper) && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              'text-sm',
              error ? 'text-red-400' : 'text-gray-400'
            )}
          >
            {error || helper}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// Mobile Select Component
interface MobileSelectProps {
  label: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  helper?: string;
  className?: string;
}

export function MobileSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  error,
  helper,
  className
}: MobileSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        {label}
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full px-4 py-3 rounded-lg border bg-slate-800/50 border-slate-600 text-left transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn(
              selectedOption ? 'text-white' : 'text-gray-400'
            )}>
              {selectedOption?.label || placeholder}
            </span>
            <ChevronDown className={cn(
              'w-5 h-5 text-gray-400 transition-transform',
              isOpen && 'transform rotate-180'
            )} />
          </div>
        </button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 z-50 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-60 overflow-y-auto"
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  disabled={option.disabled}
                  className={cn(
                    'w-full px-4 py-3 text-left transition-colors',
                    'hover:bg-slate-700 focus:bg-slate-700 focus:outline-none',
                    option.value === value && 'bg-blue-600 text-white',
                    option.disabled && 'opacity-50 cursor-not-allowed',
                    option.disabled ? 'text-gray-500' : 'text-white'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <AnimatePresence>
        {(error || helper) && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              'text-sm',
              error ? 'text-red-400' : 'text-gray-400'
            )}
          >
            {error || helper}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// Mobile Checkbox Component
interface MobileCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  error?: string;
  className?: string;
}

export function MobileCheckbox({
  label,
  checked,
  onChange,
  description,
  error,
  className
}: MobileCheckboxProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="flex items-start space-x-3 cursor-pointer">
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only"
          />
          <div className={cn(
            'w-5 h-5 rounded border-2 transition-all duration-200',
            checked 
              ? 'bg-blue-600 border-blue-600' 
              : 'bg-transparent border-slate-600',
            error && 'border-red-500'
          )}>
            {checked && (
              <motion.svg
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-3 h-3 text-white absolute top-0.5 left-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </motion.svg>
            )}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium">{label}</p>
          {description && (
            <p className="text-gray-400 text-sm">{description}</p>
          )}
        </div>
      </label>
      
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// Mobile Radio Group Component
interface MobileRadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface MobileRadioGroupProps {
  label: string;
  options: MobileRadioOption[];
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}

export function MobileRadioGroup({
  label,
  options,
  value,
  onChange,
  error,
  className
}: MobileRadioGroupProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <label className="block text-sm font-medium text-gray-300">
        {label}
      </label>
      
      <div className="space-y-3">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'flex items-start space-x-3 cursor-pointer',
              option.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div className="relative flex-shrink-0 mt-0.5">
              <input
                type="radio"
                name={label}
                value={option.value}
                checked={value === option.value}
                onChange={() => !option.disabled && onChange(option.value)}
                disabled={option.disabled}
                className="sr-only"
              />
              <div className={cn(
                'w-5 h-5 rounded-full border-2 transition-all duration-200',
                value === option.value
                  ? 'bg-blue-600 border-blue-600'
                  : 'bg-transparent border-slate-600',
                error && 'border-red-500'
              )}>
                {value === option.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  />
                )}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium">{option.label}</p>
              {option.description && (
                <p className="text-gray-400 text-sm">{option.description}</p>
              )}
            </div>
          </label>
        ))}
      </div>
      
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// Mobile Form Container
interface MobileFormProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
}

export function MobileForm({
  children,
  title,
  description,
  onSubmit,
  className
}: MobileFormProps) {
  return (
    <form onSubmit={onSubmit} className={cn('space-y-6', className)}>
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <h2 className="text-2xl font-bold text-white">{title}</h2>
          )}
          {description && (
            <p className="text-gray-400">{description}</p>
          )}
        </div>
      )}
      
      <div className="space-y-4">
        {children}
      </div>
    </form>
  );
}