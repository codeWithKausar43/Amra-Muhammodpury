import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminDrawer } from '@/features/organization/components/AdminDrawer';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => '/organization/admin',
}));

describe('AdminDrawer', () => {
  it('is hidden when isOpen is false', () => {
    const { container } = render(
      <AdminDrawer
        isOpen={false}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
    expect(container.firstChild).toHaveClass('invisible');
  });

  it('renders all admin navigation items when isOpen is true', () => {
    render(
      <AdminDrawer
        isOpen={true}
        onClose={vi.fn()}
        fundsCount={4}
        noticesCount={3}
      />
    );

    expect(screen.getByText('অ্যাডমিন কন্ট্রোল মেনু')).toBeInTheDocument();
    expect(screen.getAllByText('ড্যাশবোর্ড ওভারভিউ').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('সদস্য ব্যবস্থাপনা').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('সদস্য আবেদন')).toBeInTheDocument();
    expect(screen.getByText('চাঁদা ট্র্যাকিং ও তাগিদ')).toBeInTheDocument();
    expect(screen.getByText('লেনদেন ও চাঁদা')).toBeInTheDocument();
    expect(screen.getByText('ক্যাম্পেইন ও দান অনুদান')).toBeInTheDocument();
    expect(screen.getByText('কমিটি ও পদবি')).toBeInTheDocument();
    expect(screen.getByText('বিজ্ঞপ্তি ব্যবস্থাপনা')).toBeInTheDocument();
    expect(screen.getByText('ডিজিটাল নির্বাচন')).toBeInTheDocument();

    // Check badges
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('triggers router.push and onClose when an item is clicked', () => {
    const handleClose = vi.fn();

    render(
      <AdminDrawer
        isOpen={true}
        onClose={handleClose}
      />
    );

    const applicationsBtn = screen.getByText('সদস্য আবেদন').closest('button');
    expect(applicationsBtn).toBeInTheDocument();
    fireEvent.click(applicationsBtn!);

    expect(handleClose).toHaveBeenCalled();
  });
});
