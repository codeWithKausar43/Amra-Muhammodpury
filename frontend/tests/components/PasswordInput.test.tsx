import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PasswordInput } from '@/features/auth/components/PasswordInput';

describe('PasswordInput Component', () => {
  it('renders with password type by default', () => {
    render(<PasswordInput label="পাসওয়ার্ড" placeholder="••••••••" />);

    const input = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
    expect(input.type).toBe('password');
  });

  it('toggles password visibility when eye button is clicked', () => {
    render(<PasswordInput label="পাসওয়ার্ড" placeholder="••••••••" />);

    const input = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
    const toggleButton = screen.getByLabelText('পাসওয়ার্ড দেখুন');

    fireEvent.click(toggleButton);
    expect(input.type).toBe('text');

    fireEvent.click(screen.getByLabelText('পাসওয়ার্ড লুকান'));
    expect(input.type).toBe('password');
  });

  it('displays error message when error prop is provided', () => {
    render(<PasswordInput error="পাসওয়ার্ড আবশ্যক" placeholder="••••••••" />);

    expect(screen.getByText('পাসওয়ার্ড আবশ্যক')).toBeInTheDocument();
  });
});
