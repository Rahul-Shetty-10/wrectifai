'use client';

import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

type OTPInputProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  className?: string;
};

export function OTPInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  className,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value.replace(/\D/g, '');
    if (!newVal) return;

    const char = newVal.slice(-1);
    const valueArray = value.split('').slice(0, length);
    // Ensure the array has enough slots
    while(valueArray.length < length) valueArray.push('');
    
    valueArray[index] = char;
    const combinedValue = valueArray.join('');
    onChange(combinedValue);

    // Focus next box if a character was entered and we're not at the end
    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        const valueArray = value.split('');
        valueArray[index - 1] = '';
        onChange(valueArray.join(''));
        inputRefs.current[index - 1]?.focus();
      } else {
        const valueArray = value.split('');
        valueArray[index] = '';
        onChange(valueArray.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      const nextIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className={cn("flex justify-between gap-2", className)}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            "w-full h-14 text-center text-xl font-bold rounded-xl border border-input bg-background outline-none ring-offset-background transition-all focus:ring-2 focus:ring-ring focus:border-ring disabled:opacity-50",
            value[i] && "border-primary bg-primary/5"
          )}
        />
      ))}
    </div>
  );
}
