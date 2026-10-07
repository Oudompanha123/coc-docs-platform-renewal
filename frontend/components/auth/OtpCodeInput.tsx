"use client";

import { forwardRef, useState } from "react";

const LENGTH = 6;

/**
 * A 6-digit code as six boxes, the way authenticator apps show it.
 *
 * <p>One real input underneath, not six: it spans the boxes with its text and
 * caret made transparent, so everything a single field does still works —
 * pasting a whole code, the phone's `one-time-code` autofill, the label for
 * screen readers and tests — while the boxes only draw what it holds. The box
 * the next digit goes into is highlighted while the field has focus.
 *
 * <p>Digits only; anything else typed or pasted is dropped. {@link onComplete}
 * fires when the sixth digit arrives, so the caller can submit straight away.
 */
export const OtpCodeInput = forwardRef<
  HTMLInputElement,
  {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    /** Called with the full code when the sixth digit is entered or pasted. */
    onComplete?: (code: string) => void;
    /** Draws the boxes in the error colour; the message itself is the caller's. */
    invalid?: boolean;
    disabled?: boolean;
    /** The id of the element describing an error, for aria-describedby. */
    describedBy?: string;
  }
>(function OtpCodeInput({ id, label, value, onChange, onComplete, invalid, disabled, describedBy }, ref) {
  const [focused, setFocused] = useState(false);
  const activeIndex = Math.min(value.length, LENGTH - 1);

  function handle(raw: string) {
    let digits = raw.replace(/\D/g, "");
    // A full code is already in (say, one just rejected) and more digits
    // arrive after it: they start the next code. Cutting to the first six
    // would keep the old code and silently drop every new keystroke.
    if (value.length === LENGTH && digits.length > LENGTH && digits.startsWith(value)) {
      digits = digits.slice(LENGTH);
    }
    digits = digits.slice(0, LENGTH);
    onChange(digits);
    if (digits.length === LENGTH && digits !== value) onComplete?.(digits);
  }

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-ink">
        {label}
      </label>
      <div className="relative">
        <div aria-hidden="true" className="grid grid-cols-6 gap-2 sm:gap-3">
          {Array.from({ length: LENGTH }, (_, i) => {
            const digit = value[i] ?? "";
            const isActive = focused && !disabled && i === activeIndex && value.length < LENGTH;
            const filled = digit !== "";
            return (
              <div
                key={i}
                className={`flex h-14 items-center justify-center rounded-xl border-2 text-2xl font-bold tabular-nums transition-all duration-150 sm:h-16 ${
                  invalid
                    ? "border-red-300 bg-red-50 text-red-700"
                    : isActive
                      ? "border-brand-purple bg-white text-ink shadow-[0_0_0_4px_rgba(109,60,224,0.15)]"
                      : filled
                        ? "border-brand-purple/40 bg-brand-purple/5 text-ink"
                        : "border-border bg-white text-ink"
                } ${disabled ? "opacity-60" : ""}`}
              >
                {filled ? digit : isActive ? <span className="h-6 w-0.5 animate-pulse rounded-full bg-brand-purple" /> : null}
              </div>
            );
          })}
        </div>
        <input
          ref={ref}
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          // No maxLength: it would cut a pasted "123 456" to "123 45" before
          // the non-digits could be dropped. handle() keeps six digits itself.
          value={value}
          disabled={disabled}
          onChange={(e) => handle(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={describedBy}
          // Spans the boxes so a click anywhere on them focuses it; its own
          // text and caret are invisible — the boxes are what is seen.
          // otp-code-input: exempts it from the global focus border in
          // globals.css, which would otherwise frame all six boxes.
          className="otp-code-input absolute inset-0 h-full w-full cursor-text border-0 bg-transparent text-base text-transparent caret-transparent outline-none selection:bg-transparent disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
});
