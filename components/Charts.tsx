'use client';

import type { ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BrandMetric, PriceMixRow, ProductMetric } from '@/lib/types';
import { fmtMoney, fmtPct, fmtShare } from '@/lib/format';

const c1 = '#4f83cc';
const c2 = '#d9534f';
const c3 = '#f0ad4e';
const c4 = '#57a773';

export function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return <section className="card">
    <div className="chartTitle"><h2>{title}</h2>{subtitle ? <span>{subtitle}</span> : null}</div>
    {children}
  </section>;
}

export function BrandShareChart({ data }: { data: BrandMetric[] }) {
  const chartData = data.map(d => ({ brand: d.brand, '25PD': d.share25, '26PD': d.share26, label: `${(d.share26 * 100).toFixed(1)}%` }));
  return <ResponsiveContainer width="100%" height={360}>
    <BarChart data={chartData} margin={{ top: 24, right: 18, left: 8, bottom: 48 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="brand" angle={-35} textAnchor="end" interval={0} height={70} />
      <YAxis tickFormatter={(v) => `${(Number(v) * 100).toFixed(0)}%`} />
      <Tooltip formatter={(v: number) => fmtShare(v)} />
      <Legend />
      <Bar dataKey="25PD" fill={c1} radius={[6, 6, 0, 0]} />
      <Bar dataKey="26PD" fill={c2} radius={[6, 6, 0, 0]}>
        <LabelList dataKey="label" position="top" fontSize={11} />
      </Bar>
    </BarChart>
  </ResponsiveContainer>;
}

export function SalesChart({ data }: { data: BrandMetric[] }) {
  const chartData = data.map(d => ({ brand: d.brand, '25PD': d.sales25, '26PD': d.sales26, yoyLabel: fmtPct(d.yoy) }));
  return <ResponsiveContainer width="100%" height={360}>
    <BarChart data={chartData} margin={{ top: 24, right: 18, left: 8, bottom: 48 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="brand" angle={-35} textAnchor="end" interval={0} height={70} />
      <YAxis tickFormatter={(v) => fmtMoney(Number(v))} />
      <Tooltip formatter={(v: number) => fmtMoney(v)} />
      <Legend />
      <Bar dataKey="25PD" fill={c1} radius={[6, 6, 0, 0]} />
      <Bar dataKey="26PD" fill={c2} radius={[6, 6, 0, 0]}>
        <LabelList dataKey="yoyLabel" position="top" fontSize={11} />
      </Bar>
    </BarChart>
  </ResponsiveContainer>;
}

export function PriceMixChart({ data }: { data: PriceMixRow[] }) {
  const normalized = data.map(d => ({ ...d, 低价位: d.低价位 * 100, 中价位: d.中价位 * 100, 高价位: d.高价位 * 100 }));
  return <ResponsiveContainer width="100%" height={320}>
    <BarChart data={normalized} margin={{ top: 20, right: 18, left: 8, bottom: 10 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="period" />
      <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
      <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
      <Legend />
      <Bar dataKey="低价位" stackId="a" fill={c1}>
        <LabelList dataKey="低价位" formatter={(v: number) => `${v.toFixed(0)}%`} position="center" fill="#fff" />
      </Bar>
      <Bar dataKey="中价位" stackId="a" fill={c2}>
        <LabelList dataKey="中价位" formatter={(v: number) => `${v.toFixed(0)}%`} position="center" fill="#fff" />
      </Bar>
      <Bar dataKey="高价位" stackId="a" fill={c3} radius={[6, 6, 0, 0]}>
        <LabelList dataKey="高价位" formatter={(v: number) => `${v.toFixed(0)}%`} position="center" fill="#fff" />
      </Bar>
    </BarChart>
  </ResponsiveContainer>;
}

export function MonthlyMixChart({ data }: { data: PriceMixRow[] }) {
  const normalized = data.map(d => ({ ...d, 低价位: d.低价位 * 100, 中价位: d.中价位 * 100, 高价位: d.高价位 * 100 }));
  return <ResponsiveContainer width="100%" height={360}>
    <BarChart data={normalized} margin={{ top: 20, right: 16, left: 8, bottom: 36 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="period" angle={-35} textAnchor="end" height={60} />
      <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
      <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
      <Legend />
      <Bar dataKey="低价位" stackId="a" fill={c1} />
      <Bar dataKey="中价位" stackId="a" fill={c2} />
      <Bar dataKey="高价位" stackId="a" fill={c3} radius={[6, 6, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>;
}

export function ProductSalesChart({ data }: { data: ProductMetric[] }) {
  const chartData = data.slice(0, 12).map(d => ({ product: d.product, '25PD': d.sales25, '26PD': d.sales26, yoyLabel: fmtPct(d.yoy) }));
  return <ResponsiveContainer width="100%" height={380}>
    <BarChart data={chartData} margin={{ top: 24, right: 18, left: 8, bottom: 70 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="product" angle={-35} textAnchor="end" interval={0} height={90} />
      <YAxis tickFormatter={(v) => fmtMoney(Number(v))} />
      <Tooltip formatter={(v: number) => fmtMoney(v)} />
      <Legend />
      <Bar dataKey="25PD" fill={c1} radius={[6, 6, 0, 0]} />
      <Bar dataKey="26PD" fill={c4} radius={[6, 6, 0, 0]}>
        <LabelList dataKey="yoyLabel" position="top" fontSize={11} />
      </Bar>
    </BarChart>
  </ResponsiveContainer>;
}
