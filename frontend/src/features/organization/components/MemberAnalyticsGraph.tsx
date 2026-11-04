'use client';

import * as React from 'react';
import {
  BarChart3,
  RotateCcw,
  LineChart,
} from 'lucide-react';
import type { AdminMemberSummaryCounts } from '../types';

function toBengaliNumber(num: number | string | undefined | null): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return Number(num || 0)
    .toLocaleString('en-US')
    .replace(/[0-9]/g, (d) => bengaliDigits[+d] || d);
}

// Generate smooth cubic bezier spline SVG path
function getSplinePath(points: { x: number; y: number }[], maxY?: number): string {
  if (points.length === 0) return '';
  const first = points[0];
  if (!first) return '';
  if (points.length === 1) return `M ${first.x} ${first.y}`;
  const second = points[1];
  if (points.length === 2 && second) {
    return `M ${first.x} ${first.y} L ${second.x} ${second.y}`;
  }

  let d = `M ${first.x} ${first.y}`;
  const tension = 0.22;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = (i > 0 ? points[i - 1] : points[i]) ?? first;
    const p1 = points[i] ?? first;
    const p2 = points[i + 1] ?? first;
    const p3 = (i < points.length - 2 ? points[i + 2] : p2) ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    let cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    let cp2y = p2.y - (p3.y - p1.y) * tension;

    if (typeof maxY === 'number') {
      cp1y = Math.min(maxY, cp1y);
      cp2y = Math.min(maxY, cp2y);
    }

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return d;
}

export interface MemberAnalyticsGraphProps {
  summary?: AdminMemberSummaryCounts;
  currentStatusFilter?: string;
  currentPaymentFilter?: string;
  defaultChartStyle?: ChartStyle;
  onSelectFilter?: (type: 'status' | 'payment', val: string) => void;
  onResetFilters?: () => void;
}

type ChartView = 'ALL' | 'PAYMENT' | 'STATUS';
type ChartStyle = 'BARS' | 'CURVE';

interface DataPoint {
  id: string;
  shortLabel: string;
  compactLabel: string;
  fullLabel: string;
  value: number;
  color: string;
  filterType: 'status' | 'payment' | null;
  filterValue: string | null;
  unit: string;
}

export function MemberAnalyticsGraph({
  summary,
  currentStatusFilter = 'ALL',
  currentPaymentFilter = 'ALL',
  defaultChartStyle = 'CURVE',
  onSelectFilter,
  onResetFilters,
}: MemberAnalyticsGraphProps) {
  const [activeView, setActiveView] = React.useState<ChartView>('ALL');
  const [chartStyle, setChartStyle] = React.useState<ChartStyle>(defaultChartStyle);
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);

  // Real Database Numbers from Query
  const totalRegistered = summary?.totalRegistered ?? 0;
  const totalActive = summary?.totalActive ?? 0;
  const pendingApps = summary?.pendingApps ?? 0;
  const approvedPaymentPending = summary?.approvedPaymentPending ?? 0;
  const paidThisMonth = summary?.paidThisMonth ?? 0;
  const unpaidThisMonth = summary?.unpaidThisMonth ?? 0;
  const overdueCount = summary?.overdueCount ?? 0;
  const suspendedCount = summary?.suspendedCount ?? 0;
  const archivedCount = summary?.archivedCount ?? 0;

  // Real DB KPI calculations
  const activeRate =
    totalRegistered > 0 ? Math.round((totalActive / totalRegistered) * 100) : 0;

  const totalBillable = paidThisMonth + unpaidThisMonth;
  const collectionRate =
    totalBillable > 0 ? Math.round((paidThisMonth / totalBillable) * 100) : 0;

  // Build dynamic points based on selected view mode
  const points: DataPoint[] = React.useMemo(() => {
    if (activeView === 'PAYMENT') {
      return [
        {
          id: 'active',
          shortLabel: 'সক্রিয় সদস্য',
          compactLabel: 'সক্রিয়',
          fullLabel: 'মোট সক্রিয় সদস্য',
          value: totalActive,
          color: '#10B981',
          filterType: 'status',
          filterValue: 'ACTIVE',
          unit: 'জন',
        },
        {
          id: 'paid',
          shortLabel: 'চলতি পরিশোধ',
          compactLabel: 'পরিশোধ',
          fullLabel: 'চলতি মাস পরিশোধিত চাঁদা',
          value: paidThisMonth,
          color: '#059669',
          filterType: 'payment',
          filterValue: 'PAID',
          unit: 'জন',
        },
        {
          id: 'unpaid',
          shortLabel: 'চলতি বকেয়া',
          compactLabel: 'বকেয়া',
          fullLabel: 'চলতি মাস বকেয়া চাঁদা',
          value: unpaidThisMonth,
          color: '#F43F5E',
          filterType: 'payment',
          filterValue: 'UNPAID',
          unit: 'জন',
        },
        {
          id: 'overdue',
          shortLabel: 'মেয়াদোত্তীর্ণ',
          compactLabel: 'মেয়াদশেষ',
          fullLabel: 'দীর্ঘমেয়াদী বকেয়া তাগিদ',
          value: overdueCount,
          color: '#DC2626',
          filterType: 'payment',
          filterValue: 'OVERDUE',
          unit: 'জন',
        },
      ];
    }

    if (activeView === 'STATUS') {
      return [
        {
          id: 'active',
          shortLabel: 'সক্রিয় সদস্য',
          compactLabel: 'সক্রিয়',
          fullLabel: 'নিয়মিত সক্রিয় সদস্য',
          value: totalActive,
          color: '#10B981',
          filterType: 'status',
          filterValue: 'ACTIVE',
          unit: 'জন',
        },
        {
          id: 'pendingApps',
          shortLabel: 'নতুন আবেদন',
          compactLabel: 'আবেদন',
          fullLabel: 'নতুন সদস্যপদ আবেদন',
          value: pendingApps,
          color: '#F59E0B',
          filterType: null,
          filterValue: null,
          unit: 'টি',
        },
        {
          id: 'paymentPending',
          shortLabel: 'পেমেন্ট বাকি',
          compactLabel: 'ফি বাকি',
          fullLabel: 'অনুমোদিত ফি অপেক্ষমাণ',
          value: approvedPaymentPending,
          color: '#0284C7',
          filterType: 'status',
          filterValue: 'APPROVED_PAYMENT_PENDING',
          unit: 'জন',
        },
        {
          id: 'suspended',
          shortLabel: 'স্থগিত সদস্য',
          compactLabel: 'স্থগিত',
          fullLabel: 'সাময়িক স্থগিত সদস্যপদ',
          value: suspendedCount,
          color: '#64748B',
          filterType: 'status',
          filterValue: 'SUSPENDED',
          unit: 'জন',
        },
        {
          id: 'archived',
          shortLabel: 'আর্কাইভকৃত',
          compactLabel: 'আর্কাইভ',
          fullLabel: 'সংরক্ষিত/নিষ্ক্রিয় অ্যাকাউন্ট',
          value: archivedCount,
          color: '#475569',
          filterType: 'status',
          filterValue: 'ARCHIVED',
          unit: 'জন',
        },
      ];
    }

    // Default 'ALL' Overview
    return [
      {
        id: 'registered',
        shortLabel: 'মোট নিবন্ধিত',
        compactLabel: 'নিবন্ধিত',
        fullLabel: 'মোট নিবন্ধিত সদস্য সংখ্যা',
        value: totalRegistered,
        color: '#6366F1',
        filterType: 'status',
        filterValue: 'ALL',
        unit: 'জন',
      },
      {
        id: 'active',
        shortLabel: 'সক্রিয় সদস্য',
        compactLabel: 'সক্রিয়',
        fullLabel: 'অনুমোদিত ও সক্রিয় সদস্য',
        value: totalActive,
        color: '#10B981',
        filterType: 'status',
        filterValue: 'ACTIVE',
        unit: 'জন',
      },
      {
        id: 'paid',
        shortLabel: 'চলতি পরিশোধ',
        compactLabel: 'পরিশোধ',
        fullLabel: 'চলতি মাসে চাঁদা পরিশোধিত',
        value: paidThisMonth,
        color: '#059669',
        filterType: 'payment',
        filterValue: 'PAID',
        unit: 'জন',
      },
      {
        id: 'unpaid',
        shortLabel: 'চলতি বকেয়া',
        compactLabel: 'বকেয়া',
        fullLabel: 'চলতি মাসে চাঁদা বকেয়া রয়েছে',
        value: unpaidThisMonth,
        color: '#F43F5E',
        filterType: 'payment',
        filterValue: 'UNPAID',
        unit: 'জন',
      },
      {
        id: 'overdue',
        shortLabel: 'মেয়াদোত্তীর্ণ',
        compactLabel: 'মেয়াদশেষ',
        fullLabel: 'একাধিক মাস অনাদায়ী বকেয়া',
        value: overdueCount,
        color: '#DC2626',
        filterType: 'payment',
        filterValue: 'OVERDUE',
        unit: 'জন',
      },
      {
        id: 'pendingApps',
        shortLabel: 'নতুন আবেদন',
        compactLabel: 'আবেদন',
        fullLabel: 'পর্যালোচনার জন্য অপেক্ষমাণ',
        value: pendingApps,
        color: '#F59E0B',
        filterType: null,
        filterValue: null,
        unit: 'টি',
      },
      {
        id: 'paymentPending',
        shortLabel: 'পেমেন্ট বাকি',
        compactLabel: 'ফি বাকি',
        fullLabel: 'অনুমোদন শেষে ফি অপেক্ষমাণ',
        value: approvedPaymentPending,
        color: '#0284C7',
        filterType: 'status',
        filterValue: 'APPROVED_PAYMENT_PENDING',
        unit: 'জন',
      },
    ];
  }, [
    activeView,
    totalRegistered,
    totalActive,
    pendingApps,
    approvedPaymentPending,
    paidThisMonth,
    unpaidThisMonth,
    overdueCount,
    suspendedCount,
    archivedCount,
  ]);

  // Dynamic maximum for auto-scaling
  const maxValue = React.useMemo(() => {
    const max = Math.max(...points.map((p) => p.value), 1);
    return max;
  }, [points]);

  // Coordinate calculations for SVG Curve View
  const svgWidth = 500;
  const svgHeight = 150;
  const padX = 22;
  const padTop = 26;
  const padBottom = 16;
  const usableWidth = svgWidth - padX * 2;
  const usableHeight = svgHeight - padTop - padBottom;
  const baseLineY = padTop + usableHeight;

  const mappedPoints = React.useMemo(() => {
    const n = points.length;
    return points.map((p, idx) => {
      const x = padX + (idx / Math.max(1, n - 1)) * usableWidth;
      const ratio = maxValue > 0 ? p.value / maxValue : 0;
      const barHeight = Math.max(ratio * usableHeight, p.value > 0 ? 10 : 2);
      const y = baseLineY - barHeight;
      return {
        ...p,
        x,
        y,
        barHeight,
        ratio,
      };
    });
  }, [points, maxValue, usableWidth, usableHeight, padX, baseLineY]);

  // Extend spline from edge to edge (0 to svgWidth) to eliminate blank side spaces
  const splinePoints = React.useMemo(() => {
    if (mappedPoints.length === 0) return [];
    const first = mappedPoints[0];
    const last = mappedPoints[mappedPoints.length - 1];
    if (!first || !last) return mappedPoints;
    return [
      { x: 0, y: first.y },
      ...mappedPoints.map((p) => ({ x: p.x, y: p.y })),
      { x: svgWidth, y: last.y },
    ];
  }, [mappedPoints, svgWidth]);

  const splinePath = React.useMemo(() => {
    return getSplinePath(splinePoints, baseLineY);
  }, [splinePoints, baseLineY]);

  const areaPath = React.useMemo(() => {
    if (splinePoints.length === 0) return '';
    return `${splinePath} L ${svgWidth} ${baseLineY} L 0 ${baseLineY} Z`;
  }, [splinePath, svgWidth, baseLineY]);

  const activePoint = React.useMemo(() => {
    if (hoveredIdx !== null) return mappedPoints[hoveredIdx] ?? null;
    if (currentStatusFilter !== 'ALL') {
      return (
        mappedPoints.find(
          (p) => p.filterType === 'status' && p.filterValue === currentStatusFilter
        ) ?? null
      );
    }
    if (currentPaymentFilter !== 'ALL') {
      return (
        mappedPoints.find(
          (p) => p.filterType === 'payment' && p.filterValue === currentPaymentFilter
        ) ?? null
      );
    }
    return null;
  }, [hoveredIdx, mappedPoints, currentStatusFilter, currentPaymentFilter]);

  const hasActiveFilter =
    currentStatusFilter !== 'ALL' || currentPaymentFilter !== 'ALL';

  return (
    <div className="w-full space-y-3 py-1">
      {/* 1. Seamless Header & Mode Controls (Completely Card-less & Borderless) */}
      <div className="flex flex-col gap-2.5 pb-2.5 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-emerald shrink-0" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
              <span>সদস্য লাইভ অ্যানালিটিক্স</span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Live DB Indicator */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>ডাটাবেজ সিঙ্কড</span>
            </span>

            {/* Subtle Chart Style Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-white/5 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setChartStyle('BARS')}
                title="বার গ্রাফ"
                className={`p-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  chartStyle === 'BARS'
                    ? 'bg-white dark:bg-brand-charcoal text-brand-emerald shadow-2xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setChartStyle('CURVE')}
                title="কার্ভ ট্রেন্ড গ্রাফ"
                className={`p-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  chartStyle === 'CURVE'
                    ? 'bg-white dark:bg-brand-charcoal text-brand-emerald shadow-2xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                }`}
              >
                <LineChart className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Category View Tabs (Clean seamless pills, no nested box) */}
        <div className="flex items-center gap-1 border-b border-slate-100 dark:border-white/5 pb-1">
          <button
            type="button"
            onClick={() => setActiveView('ALL')}
            className={`py-1 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'ALL'
                ? 'text-brand-emerald bg-emerald-50 dark:bg-emerald-500/10'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            সার্বিক চিত্র
          </button>
          <button
            type="button"
            onClick={() => setActiveView('PAYMENT')}
            className={`py-1 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'PAYMENT'
                ? 'text-brand-emerald bg-emerald-50 dark:bg-emerald-500/10'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            চাঁদা আদায়
          </button>
          <button
            type="button"
            onClick={() => setActiveView('STATUS')}
            className={`py-1 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'STATUS'
                ? 'text-brand-emerald bg-emerald-50 dark:bg-emerald-500/10'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            সদস্যপদ স্ট্যাটাস
          </button>
        </div>

        {/* Seamless Visual Ratio Bar (No card container) */}
        <div className="space-y-1 pt-0.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>অনুপাত চিত্র (Visual Ratio)</span>
            <div className="flex items-center gap-2.5 font-medium">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                সক্রিয়: {toBengaliNumber(activeRate)}%
              </span>
              <span className="text-slate-300 dark:text-white/20">•</span>
              <span className="text-teal-600 dark:text-teal-400 font-bold">
                আদায়: {toBengaliNumber(collectionRate)}%
              </span>
            </div>
          </div>

          <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/10 flex overflow-hidden">
            {points.map((p) => {
              const widthPct =
                totalRegistered > 0
                  ? Math.max(3, (p.value / totalRegistered) * 100)
                  : 100 / points.length;
              if (p.value === 0) return null;
              return (
                <div
                  key={`spectrum-${p.id}`}
                  style={{ width: `${widthPct}%`, backgroundColor: p.color }}
                  title={`${p.shortLabel}: ${p.value} ${p.unit}`}
                  className="h-full transition-all duration-500"
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Main Graph Presentation (Flat, borderless rows - ZERO nested cards) */}
      {chartStyle === 'BARS' ? (
        <div className="divide-y divide-slate-100/80 dark:divide-white/5">
          {points.map((p) => {
            const isCurrentFilter =
              (p.filterType === 'status' && currentStatusFilter === p.filterValue) ||
              (p.filterType === 'payment' && currentPaymentFilter === p.filterValue);

            const percentOfMax =
              maxValue > 0 ? Math.round((p.value / maxValue) * 100) : 0;

            const percentOfTotal =
              totalRegistered > 0
                ? Math.round((p.value / totalRegistered) * 100)
                : 0;

            return (
              <div
                key={p.id}
                onClick={() => {
                  if (onSelectFilter && p.filterType && p.filterValue) {
                    if (isCurrentFilter) {
                      onResetFilters?.();
                    } else {
                      onSelectFilter(p.filterType, p.filterValue);
                    }
                  }
                }}
                className={`group py-2.5 px-2 rounded-xl transition-all cursor-pointer select-none ${
                  isCurrentFilter
                    ? 'bg-brand-emerald/5 dark:bg-emerald-500/10'
                    : 'hover:bg-slate-50/70 dark:hover:bg-white/[0.02]'
                }`}
              >
                {/* Metric Label and Real Data Digits */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                      {p.shortLabel}
                    </span>
                    {isCurrentFilter && (
                      <span className="text-[10px] font-bold text-brand-emerald bg-brand-emerald/10 px-1.5 py-0.2 rounded">
                        ফিল্টার সক্রিয়
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      {toBengaliNumber(p.value)}{' '}
                      <span className="text-[11px] font-normal text-slate-400">
                        {p.unit}
                      </span>
                    </span>

                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: `${p.color}15`,
                        color: p.color,
                      }}
                    >
                      {toBengaliNumber(percentOfTotal)}%
                    </span>
                  </div>
                </div>

                {/* Flat, Seamless Dynamic Progress Bar */}
                <div className="w-full h-1.5 sm:h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                  <div
                    style={{
                      width: `${Math.max(p.value > 0 ? 4 : 0, percentOfMax)}%`,
                      backgroundColor: p.color,
                    }}
                    className="h-full rounded-full transition-all duration-700 ease-out"
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Alternative Curve View */
        <div className="relative py-1">
          {/* Active / Selected Point Detail Pill */}
          {activePoint ? (
            <div className="flex items-center justify-between bg-slate-50 dark:bg-white/5 px-2.5 py-1.5 rounded-lg border border-slate-200/60 dark:border-white/10 text-xs mb-1.5">
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: activePoint.color }}
                />
                <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                  {activePoint.fullLabel}:
                </span>
                <span className="font-black text-brand-emerald dark:text-emerald-400 shrink-0">
                  {toBengaliNumber(activePoint.value)} {activePoint.unit}
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                {totalRegistered > 0
                  ? `${toBengaliNumber(Math.round((activePoint.value / totalRegistered) * 100))}%`
                  : ''}
              </span>
            </div>
          ) : (
            <div className="h-1" />
          )}

          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-36 sm:h-44 select-none overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="curve-area-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.28} />
                <stop offset="70%" stopColor="#10B981" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            {/* Baseline */}
            <line
              x1={0}
              y1={baseLineY}
              x2={svgWidth}
              y2={baseLineY}
              className="stroke-slate-200/80 dark:stroke-white/10"
              strokeWidth="1"
            />

            {/* Shaded Area Under Curve */}
            {areaPath && (
              <path
                d={areaPath}
                fill="url(#curve-area-grad)"
                className="transition-all duration-500 ease-out"
              />
            )}

            {/* Smooth Spline Curve Line */}
            {splinePath && (
              <path
                d={splinePath}
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-500 ease-out"
              />
            )}

            {/* Nodes, drop lines, numbers & hitboxes */}
            {mappedPoints.map((p, idx) => {
              const isHovered = hoveredIdx === idx;
              const isCurrentFilter =
                (p.filterType === 'status' && currentStatusFilter === p.filterValue) ||
                (p.filterType === 'payment' && currentPaymentFilter === p.filterValue);
              const isHighlighted = isHovered || isCurrentFilter;

              return (
                <g
                  key={p.id}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => {
                    if (onSelectFilter && p.filterType && p.filterValue) {
                      if (isCurrentFilter) {
                        onResetFilters?.();
                      } else {
                        onSelectFilter(p.filterType, p.filterValue);
                      }
                    }
                  }}
                >
                  {/* Vertical drop guideline to baseline */}
                  <line
                    x1={p.x}
                    y1={p.y}
                    x2={p.x}
                    y2={baseLineY}
                    stroke={p.color}
                    strokeWidth={isHighlighted ? 1.5 : 1}
                    strokeDasharray="2 3"
                    opacity={isHighlighted ? 0.8 : 0.25}
                  />

                  {/* Pulsing Highlight Halo */}
                  {isHighlighted && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={10}
                      fill="none"
                      stroke={p.color}
                      strokeWidth="2"
                      opacity={0.6}
                    />
                  )}

                  {/* Node Circle */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHighlighted ? 6.5 : 4.5}
                    fill="#ffffff"
                    stroke={p.color}
                    strokeWidth={isHighlighted ? 3 : 2}
                    className="transition-all duration-200"
                  />

                  {/* Bold number above node */}
                  <text
                    x={p.x}
                    y={Math.max(padTop - 8, p.y - 9)}
                    textAnchor="middle"
                    className="font-black select-none fill-slate-900 dark:fill-white text-[13px]"
                    style={{ fontSize: '13px', fontWeight: 900 }}
                  >
                    {toBengaliNumber(p.value)}
                  </text>

                  {/* Transparent Hit Box across full vertical height */}
                  <rect
                    x={idx === 0 ? 0 : p.x - usableWidth / (2 * Math.max(1, points.length - 1))}
                    y={0}
                    width={
                      idx === 0 || idx === points.length - 1
                        ? padX + usableWidth / (2 * Math.max(1, points.length - 1))
                        : usableWidth / Math.max(1, points.length - 1)
                    }
                    height={svgHeight}
                    fill="transparent"
                  />
                </g>
              );
            })}
          </svg>

          {/* High-Contrast, Perfectly Aligned Metric Columns Directly Below the Graph */}
          <div className="flex items-center justify-between gap-1 px-1 sm:px-2 pt-1.5 pb-0.5 select-none">
            {points.map((p, idx) => {
              const isCurrentFilter =
                (p.filterType === 'status' && currentStatusFilter === p.filterValue) ||
                (p.filterType === 'payment' && currentPaymentFilter === p.filterValue);
              const isSelected = hoveredIdx === idx || isCurrentFilter;

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setHoveredIdx(idx);
                    if (onSelectFilter && p.filterType && p.filterValue) {
                      if (isCurrentFilter) {
                        onResetFilters?.();
                      } else {
                        onSelectFilter(p.filterType, p.filterValue);
                      }
                    }
                  }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className={`group flex flex-col items-center justify-between py-1 px-1 rounded-lg transition-all cursor-pointer select-none text-center ${
                    isSelected
                      ? 'bg-slate-100 dark:bg-white/10 ring-1.5 ring-brand-emerald shadow-2xs'
                      : 'hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <span
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight">
                      {toBengaliNumber(p.value)}
                    </span>
                  </div>

                  <span
                    className={`text-[10.5px] sm:text-xs font-bold leading-tight block truncate ${
                      isSelected
                        ? 'text-brand-emerald dark:text-emerald-400'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                    title={p.fullLabel}
                  >
                    <span className="hidden sm:inline">{p.shortLabel}</span>
                    <span className="sm:hidden">{p.compactLabel}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Filter Reset if active */}
      {hasActiveFilter && onResetFilters && (
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-white/5 text-xs">
          <span className="text-brand-emerald dark:text-emerald-300 font-bold flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse shrink-0" />
            <span>গ্রাফ অনুযায়ী ফিল্টার সক্রিয়</span>
          </span>
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 font-bold transition-colors cursor-pointer text-xs shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>রিসেট</span>
          </button>
        </div>
      )}
    </div>
  );
}
