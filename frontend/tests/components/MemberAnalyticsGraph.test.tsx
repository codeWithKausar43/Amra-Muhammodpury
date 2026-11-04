import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemberAnalyticsGraph } from '@/features/organization/components/MemberAnalyticsGraph';
import type { AdminMemberSummaryCounts } from '@/features/organization/types';

describe('MemberAnalyticsGraph', () => {
  const mockSummary: AdminMemberSummaryCounts = {
    totalRegistered: 5,
    totalActive: 5,
    pendingApps: 1,
    approvedPaymentPending: 0,
    paidThisMonth: 1,
    unpaidThisMonth: 4,
    overdueCount: 4,
    suspendedCount: 0,
    archivedCount: 0,
  };

  it('renders dynamic counts and labels from database summary correctly', () => {
    render(<MemberAnalyticsGraph summary={mockSummary} />);

    expect(screen.getByText('সদস্য লাইভ অ্যানালিটিক্স')).toBeInTheDocument();
    expect(screen.getByText('ডাটাবেজ সিঙ্কড')).toBeInTheDocument();

    // Check dynamic numbers
    expect(screen.getAllByText(/সক্রিয় সদস্য/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/সক্রিয়: ১০০%/)).toBeInTheDocument();
    expect(screen.getByText(/আদায়: ২০%/)).toBeInTheDocument();
  });

  it('switches views dynamically between all, payment, and status modes', () => {
    render(<MemberAnalyticsGraph summary={mockSummary} />);

    const paymentBtn = screen.getByText('চাঁদা আদায়');
    fireEvent.click(paymentBtn);
    expect(paymentBtn).toHaveClass('text-brand-emerald');

    const statusBtn = screen.getByText('সদস্যপদ স্ট্যাটাস');
    fireEvent.click(statusBtn);
    expect(statusBtn).toHaveClass('text-brand-emerald');
  });

  it('invokes onSelectFilter when an interactive bar is clicked', () => {
    const onSelectFilter = vi.fn();
    render(
      <MemberAnalyticsGraph
        summary={mockSummary}
        onSelectFilter={onSelectFilter}
      />
    );

    // Click on active member row
    const activeLabel = screen.getByText('সক্রিয় সদস্য');
    fireEvent.click(activeLabel.closest('div[class*="group"]')!);

    expect(onSelectFilter).toHaveBeenCalledWith('status', 'ACTIVE');
  });
});
