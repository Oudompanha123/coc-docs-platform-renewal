"use client";

import { useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EyeIcon, EyeOffIcon } from "./icons";

/**
 * The auth forms' fields, rebuilt on the shadcn primitives (ADR-104 r2.0).
 *
 * The `icon` prop is still accepted and still required by twenty call sites,
 * but it is no longer rendered. shadcn's field is a label above a plain box;
 * a glyph sitting inside the input is the older design's idiom and it fights
 * a 36px control. Keeping the prop means no caller had to change — dropping
 * it is a separate, mechanical sweep.
 */

type FormFieldProps = {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Accepted for call-site compatibility; no longer rendered — see above. */
  icon?: ReactNode;
  error?: string;
  autoComplete?: string;
  /** The field's form name — what password managers and `FormData` identify it by (e.g. "username", "password"). */
  name?: string;
  id?: string;
};

export function FormField({ label, type = "text", value, onChange, placeholder, error, autoComplete, id, name }: FormFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;

  return (
    <div className="grid gap-2">
      <Label htmlFor={fieldId}>{label}</Label>
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
      />
      {error && (
        <p id={errorId} role="alert" className="text-destructive text-xs">
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
    <div className="grid gap-2">
      <Label htmlFor={fieldId}>{label}</Label>
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
        className="h-11 text-center text-lg font-semibold tracking-[0.4em] md:text-lg"
      />
      {error && (
        <p id={errorId} role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}

type PasswordFieldProps = Omit<FormFieldProps, "type">;

export function PasswordField({ label, value, onChange, placeholder, error, autoComplete, id, name }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;

  return (
    <div className="grid gap-2">
      <Label htmlFor={fieldId}>{label}</Label>
      <div className="relative">
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
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="text-muted-foreground absolute top-0 right-0 size-10 hover:bg-transparent"
        >
          {visible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
        </Button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
