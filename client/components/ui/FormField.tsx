'use client';

import { motion } from 'framer-motion';
import { ReactNode, useState } from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  icon?: ReactNode;
  helperText?: string;
  options?: { value: string; label: string }[];
  rows?: number;
  min?: string;
  max?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  delay?: number;
}

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
  disabled = false,
  icon,
  helperText,
  options,
  rows,
  min,
  max,
  minLength,
  maxLength,
  pattern,
  delay = 0,
}: FormFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && value.length > 0;
  const isFloating = isFocused || hasValue;

  const inputClasses = `
    w-full px-4 ${icon ? 'pl-11' : ''} py-3 
    border-2 rounded-xl
    transition-all duration-300
    ${error 
      ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:border-red-500 dark:focus:border-red-400 dark:focus:ring-red-900/30' 
      : 'border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-gray-600 dark:focus:border-blue-400 dark:focus:ring-blue-900/30'
    }
    ${disabled ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : 'bg-white dark:bg-gray-800'}
    outline-none
    text-gray-900 dark:text-gray-100
    placeholder-transparent
  `;

  const labelClasses = `
    absolute left-4 ${icon ? 'left-11' : ''}
    transition-all duration-300 pointer-events-none
    ${isFloating 
      ? '-top-2.5 left-3 text-xs bg-white dark:bg-gray-800 px-2' 
      : 'top-3 text-base'
    }
    ${error 
      ? 'text-red-600 dark:text-red-400' 
      : isFocused 
        ? 'text-blue-600 dark:text-blue-400 font-medium' 
        : 'text-gray-500 dark:text-gray-400'
    }
  `;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="relative"
    >
      {/* Icon */}
      {icon && (
        <motion.div
          animate={{
            scale: isFocused ? 1.1 : 1,
            rotate: isFocused ? 5 : 0,
          }}
          className={`absolute left-3 top-3 z-10 transition-colors ${
            error ? 'text-red-500' : isFocused ? 'text-blue-500' : 'text-gray-400'
          }`}
        >
          {icon}
        </motion.div>
      )}

      {/* Input Field */}
      <div className="relative">
        {type === 'select' && options ? (
          <>
            <select
              name={name}
              value={value}
              onChange={onChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={disabled}
              required={required}
              className={inputClasses}
            >
              <option value="" disabled></option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <label className={labelClasses}>
              {label} {required && <span className="text-red-500">*</span>}
            </label>
          </>
        ) : type === 'textarea' ? (
          <>
            <textarea
              name={name}
              value={value}
              onChange={onChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={disabled}
              required={required}
              placeholder={placeholder || label}
              rows={rows || 4}
              minLength={minLength}
              maxLength={maxLength}
              className={inputClasses + ' resize-none'}
            />
            <label className={labelClasses}>
              {label} {required && <span className="text-red-500">*</span>}
            </label>
          </>
        ) : (
          <>
            <input
              type={type}
              name={name}
              value={value}
              onChange={onChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={disabled}
              required={required}
              placeholder={placeholder || label}
              min={min}
              max={max}
              minLength={minLength}
              maxLength={maxLength}
              pattern={pattern}
              className={inputClasses}
            />
            <label className={labelClasses}>
              {label} {required && <span className="text-red-500">*</span>}
            </label>
          </>
        )}
      </div>

      {/* Helper Text or Error */}
      {(helperText || error) && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-1.5 text-xs ${error ? 'text-red-600' : 'text-gray-500'} flex items-center gap-1`}
        >
          {error || helperText}
        </motion.p>
      )}

      {/* Animated Border Bottom */}
      <motion.div
        className={`absolute bottom-0 left-0 h-0.5 ${
          error ? 'bg-gradient-to-r from-red-500 to-pink-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
        }`}
        initial={{ width: 0 }}
        animate={{ width: isFocused ? '100%' : '0%' }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}
