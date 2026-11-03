import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FinancialAnalyticsChart } from '@/features/organization/components/FinancialAnalyticsChart';
import { FinancialTrends } from '@/features/organization/types';

describe('FinancialAnalyticsChart', () => {
  const mockTrends: FinancialTrends = {
    weekly: {
      subtitle: '৭ দিনের জমা বনাম খরচ লেনদেন চিত্র',
      points: [
        { label: 'শনি', fullDate: '৩১ অক্টোবর', income: 0, expense: 0, net: 0 },
        { label: 'রবি', fullDate: '১ নভেম্বর', income: 10000, expense: 2000, net: 8000 },
        { label: 'সোম', fullDate: '২ নভেম্বর', income: 50000, expense: 15000, net: 35000 },
        { label: 'মঙ্গল', fullDate: '৩ নভেম্বর', income: 0, expense: 0, net: 0 },
        { label: 'বুধ', fullDate: '৪ নভেম্বর', income: 0, expense: 0, net: 0 },
        { label: 'বৃহ', fullDate: '৫ নভেম্বর', income: 0, expense: 0, net: 0 },
        { label: 'আজ', fullDate: '৬ নভেম্বর (আজ)', income: 25000, expense: 5000, net: 20000, isToday: true },
      ],
      totalIncome: 85000,
      totalExpense: 22000,
      netSurplus: 63000,
    },
    monthly: {
      subtitle: 'মাসভিত্তিক জমা বনাম খরচ লেনদেন চিত্র',
      points: [
        { label: '১ম সপ্তাহ', fullDate: '১-৭ নভেম্বর', income: 85000, expense: 22000, net: 63000 },
        { label: '২য় সপ্তাহ', fullDate: '৮-১৪ নভেম্বর', income: 0, expense: 0, net: 0 },
        { label: '৩য় সপ্তাহ', fullDate: '১৫-২১ নভেম্বর', income: 0, expense: 0, net: 0 },
        { label: '৪র্থ সপ্তাহ', fullDate: '২২-৩০ নভেম্বর', income: 0, expense: 0, net: 0 },
      ],
      totalIncome: 85000,
      totalExpense: 22000,
      netSurplus: 63000,
    },
    yearly: {
      subtitle: '১২ মাসের আয়-ব্যয় লেনদেন ট্রেন্ড',
      points: [
        { label: 'জানু', fullDate: 'জানুয়ারি ২০২৬', income: 50000, expense: 12000, net: 38000 },
        { label: 'ফেব্রু', fullDate: 'ফেব্রুয়ারি ২০২৬', income: 0, expense: 15000, net: -15000 },
        { label: 'মার্চ', fullDate: 'মার্চ ২০২৬', income: 0, expense: 0, net: 0 },
        { label: 'এপ্রিল', fullDate: 'এপ্রিল ২০২৬', income: 0, expense: 0, net: 0 },
        { label: 'মে', fullDate: 'মে ২০২৬', income: 0, expense: 0, net: 0 },
        { label: 'জুন', fullDate: 'জুন ২০২৬', income: 0, expense: 0, net: 0 },
        { label: 'জুলাই', fullDate: 'জুলাই ২০২৬', income: 0, expense: 0, net: 0 },
        { label: 'আগস্ট', fullDate: 'আগস্ট ২০২৬', income: 0, expense: 0, net: 0 },
        { label: 'সেপ্টে', fullDate: 'সেপ্টেম্বর ২০২৬', income: 0, expense: 0, net: 0 },
        { label: 'অক্টো', fullDate: 'অক্টোবর ২০২৬', income: 0, expense: 0, net: 0 },
        { label: 'নভে', fullDate: 'নভেম্বর ২০২৬', income: 85000, expense: 22000, net: 63000 },
        { label: 'ডিসে', fullDate: 'ডিসেম্বর ২০২৬', income: 0, expense: 0, net: 0 },
      ],
      totalIncome: 135000,
      totalExpense: 49000,
      netSurplus: 86000,
    },
    fundAllocation: {
      fundCount: 4,
      isAudited: true,
      totalBalance: 10340150,
      funds: [
        { id: '1', name: 'শিক্ষা ও মেধা কল্যাণ তহবিল', code: 'EDUCATION', shortName: 'শিক্ষা', balance: 10065000, percentage: 97.3, color: '#10B981' },
        { id: '2', name: 'সাধারণ পরিচালন তহবিল', code: 'GENERAL', shortName: 'সাধারণ', balance: 150150, percentage: 1.5, color: '#06B6D4' },
        { id: '3', name: 'চিকিৎসা ও স্বাস্থ্যসেবা তহবিল', code: 'MEDICAL', shortName: 'চিকিৎসা', balance: 80000, percentage: 0.8, color: '#F59E0B' },
        { id: '4', name: 'জরুরি ত্রাণ ও দুর্যোগ কল্যাণ তহবিল', code: 'EMERGENCY', shortName: 'ত্রাণ', balance: 45000, percentage: 0.4, color: '#8B5CF6' },
      ],
    },
  };

  it('renders the header title and default weekly subtitle', () => {
    render(<FinancialAnalyticsChart trends={mockTrends} />);
    expect(screen.getByText('লাইভ আর্থিক অ্যানালিটিক্স ও ট্রেন্ড')).toBeInTheDocument();
    expect(screen.getByText('৭ দিনের জমা বনাম খরচ লেনদেন চিত্র')).toBeInTheDocument();
  });

  it('renders period filter buttons and switches between periods', () => {
    render(<FinancialAnalyticsChart trends={mockTrends} />);
    const monthlyBtn = screen.getByRole('button', { name: 'মাসিক' });
    fireEvent.click(monthlyBtn);

    expect(screen.getByText('মাসভিত্তিক জমা বনাম খরচ লেনদেন চিত্র')).toBeInTheDocument();

    const yearlyBtn = screen.getByRole('button', { name: 'বাৎসরিক' });
    fireEvent.click(yearlyBtn);

    expect(screen.getByText('১২ মাসের আয়-ব্যয় লেনদেন ট্রেন্ড')).toBeInTheDocument();
  });

  it('displays the dynamic net surplus badge and fund allocation percentages', () => {
    render(<FinancialAnalyticsChart trends={mockTrends} />);
    expect(screen.getByText(/নেট সারপ্লাস:/i)).toBeInTheDocument();
    expect(screen.getByText('৪টি কল্যাণ তহবিল বরাদ্দ অনুপাত:')).toBeInTheDocument();
    expect(screen.getByText('১০০% নিরীক্ষিত')).toBeInTheDocument();
    expect(screen.getByText(/শিক্ষা/i)).toBeInTheDocument();
    expect(screen.getByText(/সাধারণ/i)).toBeInTheDocument();
    expect(screen.getByText(/চিকিৎসা/i)).toBeInTheDocument();
    expect(screen.getByText(/ত্রাণ/i)).toBeInTheDocument();
  });
});

