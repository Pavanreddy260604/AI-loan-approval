import { useRef, useEffect, useState, useCallback } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  error?: boolean;
}

/**
 * OtpInput - 6-digit OTP input with auto-focus progression
 */
export function OtpInput({ value, onChange, length = 6, disabled, error }: OtpInputProps) {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync external value with internal state
  useEffect(() => {
    const chars = value.split('').slice(0, length);
    const padded = [...chars, ...Array(length - chars.length).fill('')];
    setOtp(padded);
  }, [value, length]);

  const handleChange = useCallback((index: number, inputValue: string) => {
    // Only allow single digit or empty
    const digit = inputValue.slice(-1);
    if (digit && !/^\d$/.test(digit)) return;

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    onChange(newOtp.join(''));

    // Auto-focus next input if current has a value
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [otp, onChange, length]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    // Handle backspace - move to previous if empty
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [otp, length]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    const newOtp = [...otp];
    pasted.split('').forEach((digit, i) => {
      if (i < length) newOtp[i] = digit;
    });
    setOtp(newOtp);
    onChange(newOtp.join(''));
    // Focus the next empty slot or last input
    const focusIndex = Math.min(pasted.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
  }, [otp, onChange, length]);

  return (
    <div className="flex items-center justify-center gap-2">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={el => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className={`
            w-10 h-12 sm:w-12 sm:h-14 
            text-center text-lg sm:text-xl font-bold
            bg-base-950 border rounded-lg
            focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20
            transition-all duration-150
            ${error ? 'border-danger text-danger' : 'border-base-800 text-base-50'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />
      ))}
    </div>
  );
}

interface ResendButtonProps {
  onResend: () => void;
  cooldown?: number;
  disabled?: boolean;
}

/**
 * ResendButton - Button with countdown timer for resending OTP
 */
export function ResendButton({ onResend, cooldown = 60, disabled }: ResendButtonProps) {
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown === 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleClick = () => {
    if (countdown > 0 || disabled) return;
    onResend();
    setCountdown(cooldown);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={countdown > 0 || disabled}
      className={`
        text-xs font-medium transition-colors
        ${countdown > 0 || disabled 
          ? 'text-base-600 cursor-not-allowed' 
          : 'text-primary hover:text-primary/80'}
      `}
    >
      {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
    </button>
  );
}
