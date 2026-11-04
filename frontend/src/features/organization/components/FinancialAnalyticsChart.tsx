'use client';

import React, { useState, useMemo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { FinancialTrends, FinancialTrendPeriodData, OrgAdminStats } from '../types';

interface FinancialAnalyticsChartProps {
  trends?: FinancialTrends;
  funds?: OrgAdminStats['funds']['fundList'];
  className?: string;
}

type PeriodType = 'weekly' | 'monthly' | 'yearly';

function toBengaliNumber(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return Number(num || 0)
    .toLocaleString('en-US')
    .replace(/[0-9]/g, (d) => bengaliDigits[+d] || d);
}

function toBengaliDigits(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bengaliDigits[+d] || d);
}

// Generate smooth cubic bezier spline SVG path from point array
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

export function FinancialAnalyticsChart({
  trends,
  funds,
  className = '',
}: FinancialAnalyticsChartProps) {
  const [period, setPeriod] = useState<PeriodType>('weekly');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Active period data
  const currentData: FinancialTrendPeriodData | undefined = trends?.[period];

  // Dynamic points
  const points = useMemo(() => {
    return currentData?.points || [];
  }, [currentData]);

  // Coordinate math for SVG
  const svgWidth = 500;
  const svgHeight = 175;
  const padX = 24;
  const padTop = 22;
  const padBottom = 32;
  const usableWidth = svgWidth - padX * 2;
  const usableHeight = svgHeight - padTop - padBottom;

  // Compute maximum value for scaling
  const maxValue = useMemo(() => {
    if (points.length === 0) return 1000;
    const max = Math.max(
      ...points.map((p) => Math.max(p.income || 0, p.expense || 0)),
      1
    );
    return max;
  }, [points]);

  // Map data points to SVG coordinates
  const mappedPoints = useMemo(() => {
    if (points.length === 0) return { incomeCoords: [], expenseCoords: [] };
    const n = points.length;

    const incomeCoords = points.map((p, idx) => {
      const x = padX + (idx / Math.max(1, n - 1)) * usableWidth;
      const ratio = p.income > 0 ? p.income / maxValue : 0;
      const y = padTop + usableHeight - ratio * usableHeight;
      return { x, y };
    });

    const expenseCoords = points.map((p, idx) => {
      const x = padX + (idx / Math.max(1, n - 1)) * usableWidth;
      const ratio = p.expense > 0 ? p.expense / maxValue : 0;
      const y = padTop + usableHeight - ratio * usableHeight;
      return { x, y };
    });

    return { incomeCoords, expenseCoords };
  }, [points, maxValue, usableWidth, usableHeight, padX, padTop]);

  // Smooth spline paths
  const baseLineY = padTop + usableHeight;
  const incomeLinePath = useMemo(
    () => getSplinePath(mappedPoints.incomeCoords, baseLineY),
    [mappedPoints.incomeCoords, baseLineY]
  );
  const expenseLinePath = useMemo(
    () => getSplinePath(mappedPoints.expenseCoords, baseLineY),
    [mappedPoints.expenseCoords, baseLineY]
  );

  // Closed area paths for gradient fill
  const incomeAreaPath = useMemo(() => {
    if (mappedPoints.incomeCoords.length === 0) return '';
    const baseLineY = padTop + usableHeight;
    const first = mappedPoints.incomeCoords[0];
    const last = mappedPoints.incomeCoords[mappedPoints.incomeCoords.length - 1];
    if (!first || !last) return '';
    return `${incomeLinePath} L ${last.x} ${baseLineY} L ${first.x} ${baseLineY} Z`;
  }, [incomeLinePath, mappedPoints.incomeCoords, padTop, usableHeight]);

  const expenseAreaPath = useMemo(() => {
    if (mappedPoints.expenseCoords.length === 0) return '';
    const baseLineY = padTop + usableHeight;
    const first = mappedPoints.expenseCoords[0];
    const last = mappedPoints.expenseCoords[mappedPoints.expenseCoords.length - 1];
    if (!first || !last) return '';
    return `${expenseLinePath} L ${last.x} ${baseLineY} L ${first.x} ${baseLineY} Z`;
  }, [expenseLinePath, mappedPoints.expenseCoords, padTop, usableHeight]);

  // Net surplus calculation
  const netSurplus = currentData ? currentData.totalIncome - currentData.totalExpense : 0;
  const isSurplusPositive = netSurplus >= 0;

  // Fund allocation fallback if not in trends
  const fundAllocations = useMemo(() => {
    if (trends?.fundAllocation?.funds && trends.fundAllocation.funds.length > 0) {
      return trends.fundAllocation.funds;
    }
    if (funds && funds.length > 0) {
      const total = funds.reduce((acc, f) => acc + Math.max(0, f.currentBalance), 0);
      const shortMap: Record<string, string> = {
        MEDICAL: 'চিকিৎসা',
        EDUCATION: 'শিক্ষা',
        EMERGENCY: 'ত্রাণ',
        GENERAL: 'সাধারণ',
      };
      const colors = ['#10B981', '#06B6D4', '#F59E0B', '#8B5CF6'];
      return funds.map((f, i) => {
        const bal = Math.max(0, f.currentBalance);
        const percentage = total > 0 ? Number(((bal / total) * 100).toFixed(1)) : 0;
        return {
          id: f.id,
          name: f.name,
          code: f.code,
          shortName: shortMap[f.code] || f.name.split(' ')[0],
          balance: bal,
          percentage,
          color: colors[i % colors.length],
        };
      });
    }
    return [];
  }, [trends, funds]);

  const fundCount = trends?.fundAllocation?.fundCount || fundAllocations.length || 4;

  // Active point for tooltip
  const activeHover = hoveredIdx !== null && points[hoveredIdx] ? points[hoveredIdx] : null;
  const activeCoord = hoveredIdx !== null && mappedPoints.incomeCoords[hoveredIdx]
    ? mappedPoints.incomeCoords[hoveredIdx]
    : null;

  return (
    <div
      className={`space-y-4 py-2 px-1 text-slate-900 dark:text-white transition-all duration-300 relative ${className}`}
    >
      {/* Background glow overlay */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* =========================================================================
          1. Header: Title, Subtitle, Status Dot & Period Switcher
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>লাইভ আর্থিক অ্যানালিটিক্স ও ট্রেন্ড</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {currentData?.subtitle || 'জমা বনাম খরচ লেনদেন চিত্র'}
          </p>
        </div>

        {/* Right side: Pulse Indicator & Period Tabs */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Glowing Green Status Dot */}
          <div className="relative flex items-center justify-center w-3 h-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </div>

          {/* Period Switcher Capsule */}
          <div className="bg-slate-100 dark:bg-white/5 p-1 rounded-xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setPeriod('weekly');
                setHoveredIdx(null);
              }}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                period === 'weekly'
                  ? 'bg-brand-emerald text-white dark:bg-emerald-500 dark:text-slate-950 shadow-sm shadow-emerald-500/30'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              সাপ্তাহিক
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriod('monthly');
                setHoveredIdx(null);
              }}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                period === 'monthly'
                  ? 'bg-brand-emerald text-white dark:bg-emerald-500 dark:text-slate-950 shadow-sm shadow-emerald-500/30'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              মাসিক
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriod('yearly');
                setHoveredIdx(null);
              }}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                period === 'yearly'
                  ? 'bg-brand-emerald text-white dark:bg-emerald-500 dark:text-slate-950 shadow-sm shadow-emerald-500/30'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              বাৎসরিক
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. Dual Spline Wave Chart (SVG Area Chart)
         ========================================================================= */}
      <div className="relative mt-4 w-full">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-44 sm:h-52 overflow-visible select-none"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Income Green Area Gradient */}
            <linearGradient id="incomeWaveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.32" />
              <stop offset="60%" stopColor="#10B981" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>

            {/* Expense Coral Area Gradient */}
            <linearGradient id="expenseWaveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#F43F5E" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.0" />
            </linearGradient>

            {/* Glowing filter for today dot */}
            <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Dotted Horizontal Guidelines */}
          <line
            x1={padX}
            y1={padTop + usableHeight * 0.25}
            x2={svgWidth - padX}
            y2={padTop + usableHeight * 0.25}
            className="stroke-slate-200/80 dark:stroke-white/[0.07]"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <line
            x1={padX}
            y1={padTop + usableHeight * 0.5}
            x2={svgWidth - padX}
            y2={padTop + usableHeight * 0.5}
            className="stroke-slate-200/80 dark:stroke-white/[0.07]"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <line
            x1={padX}
            y1={padTop + usableHeight * 0.75}
            x2={svgWidth - padX}
            y2={padTop + usableHeight * 0.75}
            className="stroke-slate-200/80 dark:stroke-white/[0.07]"
            strokeDasharray="4 4"
            strokeWidth="1"
          />

          {/* Areas (Under the curves) */}
          {expenseAreaPath && (
            <path
              d={expenseAreaPath}
              fill="url(#expenseWaveGrad)"
              className="transition-all duration-500 ease-out"
            />
          )}
          {incomeAreaPath && (
            <path
              d={incomeAreaPath}
              fill="url(#incomeWaveGrad)"
              className="transition-all duration-500 ease-out"
            />
          )}

          {/* Spline Lines */}
          {expenseLinePath && (
            <path
              d={expenseLinePath}
              fill="none"
              stroke="#F43F5E"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-500 ease-out"
            />
          )}
          {incomeLinePath && (
            <path
              d={incomeLinePath}
              fill="none"
              stroke="#10B981"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-500 ease-out"
            />
          )}

          {/* Vertical Guide Line on Hover */}
          {hoveredIdx !== null && activeCoord && (
            <line
              x1={activeCoord.x}
              y1={padTop}
              x2={activeCoord.x}
              y2={padTop + usableHeight}
              className="stroke-slate-400/60 dark:stroke-white/25"
              strokeDasharray="3 3"
              strokeWidth="1.5"
            />
          )}

          {/* Marker Dots on Curves */}
          {mappedPoints.incomeCoords.map((coord, idx) => {
            const isToday = points[idx]?.isToday;
            const isHovered = hoveredIdx === idx;
            const showMiddleDot = idx === Math.floor(points.length / 2);

            // Special highlighted dot for today or hovered
            if (isToday || isHovered) {
              return (
                <g key={`income-dot-${idx}`}>
                  {/* Outer glowing pulsing ring */}
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r={isHovered ? 9 : 8}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                    opacity={0.8}
                    filter="url(#glowGreen)"
                  />
                  {/* Inner dot */}
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r={isHovered ? 5 : 4.5}
                    fill="#10B981"
                    className="stroke-white dark:stroke-[#071317]"
                    strokeWidth="2"
                  />
                </g>
              );
            }

            // Normal mid dots
            if (showMiddleDot) {
              return (
                <circle
                  key={`income-dot-${idx}`}
                  cx={coord.x}
                  cy={coord.y}
                  r="4"
                  className="fill-white dark:fill-[#071317]"
                  stroke="#10B981"
                  strokeWidth="2.5"
                />
              );
            }

            return null;
          })}

          {/* Expense Marker Dots */}
          {mappedPoints.expenseCoords.map((coord, idx) => {
            const isHovered = hoveredIdx === idx;
            if (isHovered) {
              return (
                <g key={`expense-dot-${idx}`}>
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r={8}
                    fill="none"
                    stroke="#F43F5E"
                    strokeWidth="2"
                    opacity={0.8}
                  />
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r={4.5}
                    fill="#F43F5E"
                    className="stroke-white dark:stroke-[#071317]"
                    strokeWidth="2"
                  />
                </g>
              );
            }
            return null;
          })}

          {/* Transparent Hover Hit Boxes for smooth interactive hovering */}
          {points.map((_, idx) => {
            const n = points.length;
            const colWidth = usableWidth / Math.max(1, n - 1);
            const x = padX + (idx / Math.max(1, n - 1)) * usableWidth - colWidth / 2;
            return (
              <rect
                key={`hitbox-${idx}`}
                x={Math.max(0, x)}
                y={0}
                width={colWidth}
                height={svgHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onTouchStart={() => setHoveredIdx(idx)}
              />
            );
          })}
        </svg>

        {/* Floating Tooltip Card */}
        {activeHover && activeCoord && (
          <div
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 bg-white/95 dark:bg-[#060D10]/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-2.5 shadow-xl dark:shadow-2xl text-[11px] space-y-1 transition-all text-slate-900 dark:text-white"
            style={{
              left: `${(activeCoord.x / svgWidth) * 100}%`,
              top: '0px',
            }}
          >
            <div className="font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700/50 pb-1 flex items-center justify-between gap-3">
              <span>{activeHover.fullDate}</span>
              {activeHover.isToday && (
                <span className="text-[10px] bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-bold border border-emerald-200/60 dark:border-transparent">
                  আজ
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                জমা:
              </span>
              <span>+৳ {toBengaliNumber(activeHover.income)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-rose-600 dark:text-rose-400 font-semibold">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                খরচ:
              </span>
              <span>-৳ {toBengaliNumber(activeHover.expense)}</span>
            </div>
            <div className="pt-0.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 text-slate-700 dark:text-slate-300 font-bold">
              <span>নেট:</span>
              <span
                className={activeHover.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}
              >
                {activeHover.net >= 0 ? '+' : '-'}৳ {toBengaliNumber(Math.abs(activeHover.net))}
              </span>
            </div>
          </div>
        )}

        {/* X-Axis Labels Row */}
        <div className="flex justify-between items-center px-4 sm:px-6 mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400 select-none">
          {points.map((p, idx) => (
            <button
              key={`label-${idx}`}
              type="button"
              onClick={() => setHoveredIdx(idx)}
              className={`transition-colors cursor-pointer ${
                hoveredIdx === idx
                  ? 'text-slate-900 dark:text-white font-bold'
                  : p.isToday
                  ? 'text-brand-emerald dark:text-emerald-400 font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          3. Legend & Net Surplus Badge
         ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-200/60 dark:border-white/10">
        {/* Left: Legend Dots */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span>জমা / অনুদান</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
            <span>ব্যয় / খরচ</span>
          </div>
        </div>

        {/* Right: Net Surplus Badge */}
        <div
          className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
            isSurplusPositive
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-brand-emerald dark:text-emerald-400'
              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
          }`}
        >
          <span>
            {isSurplusPositive ? 'নেট সারপ্লাস:' : 'নেট ঘাটতি:'} {isSurplusPositive ? '+' : '-'}৳
            {toBengaliNumber(Math.abs(netSurplus))}
          </span>
        </div>
      </div>

      {/* =========================================================================
          4. Welfare Fund Allocation Ratio ("তহবিল বরাদ্দ অনুপাত")
         ========================================================================= */}
      <div className="mt-5 pt-4 border-t border-slate-200/60 dark:border-white/10 space-y-2.5">
        {/* Header Row */}
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {toBengaliDigits(fundCount)}টি কল্যাণ তহবিল বরাদ্দ অনুপাত:
          </span>
          <div className="flex items-center gap-1 text-brand-emerald dark:text-emerald-400 font-semibold text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>১০০% নিরীক্ষিত</span>
          </div>
        </div>

        {/* Multi-Segment Colored Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden flex items-stretch">
          {fundAllocations.map((fund, idx) => {
            // Guarantee at least a tiny visible segment if percentage > 0
            const widthPct = Math.max(fund.percentage, fund.balance > 0 ? 2 : 0);
            return (
              <div
                key={fund.id || fund.code || idx}
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: fund.color,
                }}
                className={`h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full ${
                  idx > 0 ? 'border-l border-white dark:border-[#071317]' : ''
                }`}
                title={`${fund.name}: ${fund.percentage}% (৳${toBengaliNumber(fund.balance)})`}
              />
            );
          })}
        </div>

        {/* Fund Percentage Tags */}
        <div className="flex flex-wrap items-center justify-between gap-y-1.5 gap-x-3 text-xs text-slate-600 dark:text-slate-400 font-medium pt-0.5">
          {fundAllocations.map((fund, idx) => (
            <div key={fund.id || fund.code || idx} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full inline-block shrink-0"
                style={{ backgroundColor: fund.color }}
              />
              <span>
                {fund.shortName} {toBengaliDigits(fund.percentage)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
