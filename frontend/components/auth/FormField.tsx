"use client";

import { useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EyeIcon, EyeOffIcon } from "./icons";

/**
 * Migrated to the shared primitives in phase 1 of ADR-104. The exported API,
 * the DOM and the rendered pixels are unchanged — this file is imported by
 * twenty others, so a change in its shape would not have been a pilot, it
 * would have been the whole migration at once.
 *
 * What is gone is `fieldClasses`: the field styling now lives once, in
 * `components/ui/input.tsx`, instead of here and in whatever the next form
 * copied it into.
 */

type FormFieldProps = {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: ReactNode;
  error?: string;
  autoComplete?: string;
  /** The field's form name — what password managers and `FormData` identify it by (e.g. "username", "password"). */
  name?: string;
  id?: string;
};

/** The leading-icon inset. `Input`'s own `px-4` covers the right-hand side. */
const ICON_INSET = "pl-10";

export function FormField({ label, type = "text", value, onChange, placeholder, icon, error, autoComplete, id, name }: FormFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;

  return (
    <div>
      <Label htmlFor={fieldId} className="mb-1.5 block">
        {label}
      </Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted">{icon}</span>
        <Input
          id={fieldId}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={ICON_INSET}
        />
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

type CodeFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  id?: string;
};

/** A 6-digit email/SMS verification code (ADR-021) — large, spaced-out digits rather than {@link FormField}'s plain text style. */
export function CodeField({ label, value, onChange, error, id }: CodeFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;

  return (
    <div>
      <Label htmlFor={fieldId} className="mb-1.5 block">
        {label}
      </Label>
      <Input
        id={fieldId}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="000000"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="text-center text-2xl font-semibold tracking-[0.5em] placeholder:text-muted/40"
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

type PasswordFieldProps = Omit<FormFieldProps, "type" | "icon"> & { icon: ReactNode };

export function PasswordField({ label, value, onChange, placeholder, icon, error, autoComplete, id, name }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;

  return (
    <div>
      <Label htmlFor={fieldId} className="mb-1.5 block">
        {label}
      </Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted">{icon}</span>
        <Input
          id={fieldId}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`${ICON_INSET} pr-10`}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute right-3 top-1/2 -translate-y-1/2 focus-visible:ring-offset-0"
        >
          {visible ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </Button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
