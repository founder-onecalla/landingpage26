import { forwardRef } from 'react';
import type { InputHTMLAttributes, TextareaHTMLAttributes, ButtonHTMLAttributes } from 'react';

// Layout wrapper
export function ScreenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="screen-layout">
      <div className="card">
        {children}
      </div>
    </div>
  );
}

// Step indicator - top right
export function StepIndicator({ text }: { text: string }) {
  return (
    <div className="fixed top-6 right-6 step-indicator">
      {text}
    </div>
  );
}

// Title
export function Title({ children }: { children: React.ReactNode }) {
  return <h1 className="title">{children}</h1>;
}

// Subtitle
export function Subtitle({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return <p className="subtitle">{children}</p>;
}

// Helper text
export function Helper({ children }: { children: React.ReactNode }) {
  return <p className="helper">{children}</p>;
}

// Section label
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="section-label">{children}</p>;
}

// Text input
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`input ${error ? 'error' : ''} ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

// Textarea
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className = '', ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`textarea ${error ? 'error' : ''} ${className}`}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

// Primary button
interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export function PrimaryButton({ children, loading, disabled, ...props }: PrimaryButtonProps) {
  return (
    <button
      className="btn-primary"
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Please wait...' : children}
    </button>
  );
}

// Secondary button
export function SecondaryButton({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className="btn-secondary" {...props}>
      {children}
    </button>
  );
}

// Link
export function Link({ children, onClick, href }: { children: React.ReactNode; onClick?: () => void; href?: string }) {
  if (href) {
    return <a className="link" href={href}>{children}</a>;
  }
  return (
    <button type="button" className="link" onClick={onClick}>
      {children}
    </button>
  );
}

// Suggestion item (lightweight text, not a button)
interface SuggestionProps {
  text: string;
  onClick: () => void;
}

export function Suggestion({ text, onClick }: SuggestionProps) {
  return (
    <button type="button" className="suggestion-tag" onClick={onClick}>
      {text}
    </button>
  );
}

// Suggestions container
export function Suggestions({ children }: { children: React.ReactNode }) {
  return <div className="suggestions">{children}</div>;
}

// Error message
export function ErrorText({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return <p className="error-text">{children}</p>;
}

// Keyboard hint
export function KeyboardHint({ text }: { text: string }) {
  return <p className="keyboard-hint">{text}</p>;
}

// Back button
export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="back-btn" onClick={onClick}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Back
    </button>
  );
}

// Tabs
interface TabProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function Tab({ label, active, onClick }: TabProps) {
  return (
    <button
      type="button"
      className={`tab ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function Tabs({ children }: { children: React.ReactNode }) {
  return <div className="tabs">{children}</div>;
}
