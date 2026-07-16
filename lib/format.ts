export const fmtMoney = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1000000) return `£${(n / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `£${(n / 1000).toFixed(0)}K`;
  return `£${Math.round(n).toLocaleString('en-GB')}`;
};

export const fmtPct = (n: number | null, digits = 1) => {
  if (n === null || Number.isNaN(n)) return '新增';
  return `${(n * 100).toFixed(digits)}%`;
};

export const fmtShare = (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`;
export const fmtPp = (n: number, digits = 1) => `${n >= 0 ? '+' : ''}${(n * 100).toFixed(digits)}pp`;

export const signed = (n: number) => `${n >= 0 ? '+' : ''}${n.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;
