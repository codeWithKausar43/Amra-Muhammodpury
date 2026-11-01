import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PasswordStrength } from '@/features/auth/components/PasswordStrength';

describe('PasswordStrength Component', () => {
  it('does not render anything when password is empty', () => {
    const { container } = render(<PasswordStrength password="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders weak for short password', () => {
    render(<PasswordStrength password="abc" />);
    expect(screen.getByText('দুর্বল')).toBeInTheDocument();
  });

  it('renders strong when all conditions are fulfilled', () => {
    render(<PasswordStrength password="StrongPass123" />);
    expect(screen.getByText('শক্তিশালী')).toBeInTheDocument();
  });
});
