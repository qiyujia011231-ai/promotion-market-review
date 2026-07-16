import { BrandMetric, PDConfig, PriceMixRow, ProductMetric, ReportData, SalesRow } from './types';
import { isBone, isOpenEar } from './parseExcel';

const sum = (rows: SalesRow[]) => rows.reduce((a, r) => a + r.retailSales, 0);
const yoy = (sales25: number, sales26: number) => sales25 === 0 ? (sales26 > 0 ? null : 0) : sales26 / sales25 - 1;
const groupBy = <T,>(rows: T[], keyFn: (r: T) => string) => rows.reduce<Record<string, T[]>>((acc, r) => {
  const k = keyFn(r) || '未知';
  acc[k] = acc[k] || [];
  acc[k].push(r);
  return acc;
}, {});

function pdRows(rows: SalesRow[], date: string) {
  return rows.filter(r => r.weekEnding === date);
}

function brandMetrics(rows25: SalesRow[], rows26: SalesRow[], topN = 10): BrandMetric[] {
  const total25 = sum(rows25);
  const total26 = sum(rows26);
  const brands = Array.from(new Set([...rows25, ...rows26].map(r => r.brand)));
  const metrics = brands.map(brand => {
    const sales25 = sum(rows25.filter(r => r.brand === brand));
    const sales26 = sum(rows26.filter(r => r.brand === brand));
    return {
      brand,
      sales25,
      sales26,
      share25: total25 ? sales25 / total25 : 0,
      share26: total26 ? sales26 / total26 : 0,
      shareChangePp: total26 ? sales26 / total26 : 0,
      yoy: yoy(sales25, sales26),
      diff: sales26 - sales25
    };
  }).map(m => ({ ...m, shareChangePp: m.share26 - m.share25 }))
    .sort((a, b) => b.sales26 - a.sales26)
    .slice(0, topN);
  return metrics;
}

function priceMix(rows25: SalesRow[], rows26: SalesRow[]): PriceMixRow[] {
  const bands: Array<'低价位' | '中价位' | '高价位'> = ['低价位', '中价位', '高价位'];
  return [
    { period: '25PD', ...mix(rows25) },
    { period: '26PD', ...mix(rows26) }
  ];
  function mix(rows: SalesRow[]) {
    const total = sum(rows);
    return Object.fromEntries(bands.map(b => [b, total ? sum(rows.filter(r => r.priceBand === b)) / total : 0])) as Omit<PriceMixRow, 'period'>;
  }
}

function monthlyMix(rows: SalesRow[]): PriceMixRow[] {
  const groups = groupBy(rows, r => r.month);
  return Object.keys(groups).sort().map(month => {
    const rs = groups[month];
    const total = sum(rs);
    return {
      period: month,
      低价位: total ? sum(rs.filter(r => r.priceBand === '低价位')) / total : 0,
      中价位: total ? sum(rs.filter(r => r.priceBand === '中价位')) / total : 0,
      高价位: total ? sum(rs.filter(r => r.priceBand === '高价位')) / total : 0
    };
  });
}

function shortTitle(title: string): string {
  const cleaned = title.replace(/soundcore|anker|shokz|bluetooth|wireless|headphones|earbuds|open[- ]?ear/ig, ' ');
  const known = ['AeroClip', 'AeroFit 2', 'AeroFit Pro', 'AeroFit', 'V20i', 'V30i', 'C30i', 'C50i', 'OpenFit Air', 'OpenFit 2+', 'OpenFit 2', 'OpenFit', 'OpenDots ONE', 'OpenRun Pro 2', 'OpenRun Pro', 'OpenRun', 'OpenMove'];
  const hit = known.find(k => title.toLowerCase().includes(k.toLowerCase()));
  if (hit) return hit;
  const words = cleaned.split(/[^A-Za-z0-9+]+/).filter(Boolean).slice(0, 4);
  return words.join(' ') || title.slice(0, 26);
}

function productMetrics(rows25: SalesRow[], rows26: SalesRow[], brand: string): ProductMetric[] {
  const target25 = rows25.filter(r => r.brand.toLowerCase() === brand.toLowerCase() && isOpenEar(r));
  const target26 = rows26.filter(r => r.brand.toLowerCase() === brand.toLowerCase() && isOpenEar(r));
  const p25 = groupBy(target25, r => shortTitle(r.title));
  const p26 = groupBy(target26, r => shortTitle(r.title));
  return Array.from(new Set([...Object.keys(p25), ...Object.keys(p26)])).map(product => {
    const sales25 = sum(p25[product] || []);
    const sales26 = sum(p26[product] || []);
    return { product, sales25, sales26, diff: sales26 - sales25, yoy: yoy(sales25, sales26) };
  }).filter(r => Math.max(r.sales25, r.sales26) >= 1000)
    .sort((a, b) => b.sales26 - a.sales26);
}

function formPriceMatrix(rows25: SalesRow[], rows26: SalesRow[], brand: string) {
  const target25 = rows25.filter(r => r.brand.toLowerCase() === brand.toLowerCase());
  const target26 = rows26.filter(r => r.brand.toLowerCase() === brand.toLowerCase());
  const forms = Array.from(new Set([...target25, ...target26].map(r => r.productForm))).sort();
  const ranges = Array.from(new Set([...target25, ...target26].map(r => r.priceRange))).sort((a, b) => {
    const an = Number(a.match(/\d+/)?.[0] || 9999);
    const bn = Number(b.match(/\d+/)?.[0] || 9999);
    return an - bn;
  });
  const abs: Record<string, Record<string, number>> = {};
  const yr: Record<string, Record<string, number | null>> = {};
  forms.forEach(f => {
    abs[f] = {};
    yr[f] = {};
    ranges.forEach(pr => {
      const s25 = sum(target25.filter(r => r.productForm === f && r.priceRange === pr));
      const s26 = sum(target26.filter(r => r.productForm === f && r.priceRange === pr));
      abs[f][pr] = s26 - s25;
      yr[f][pr] = yoy(s25, s26);
    });
  });
  return { forms, ranges, abs, yr };
}

export function buildReport(rows: SalesRow[], config: PDConfig): ReportData {
  const rows25 = pdRows(rows, config.pd25);
  const rows26 = pdRows(rows, config.pd26);
  const open25 = rows25.filter(isOpenEar);
  const open26 = rows26.filter(isOpenEar);
  const bone25 = rows25.filter(isBone);
  const bone26 = rows26.filter(isBone);
  const brand = config.brand || 'SOUNDCORE';
  const boneShokz25 = sum(bone25.filter(r => r.brand === 'SHOKZ'));
  const boneShokz26 = sum(bone26.filter(r => r.brand === 'SHOKZ'));
  const matrix = formPriceMatrix(rows25, rows26, brand);
  const sales25 = sum(rows25);
  const sales26 = sum(rows26);
  const openSales25 = sum(open25);
  const openSales26 = sum(open26);
  return {
    rows,
    config,
    total: { sales25, sales26, diff: sales26 - sales25, yoy: yoy(sales25, sales26) },
    openEarTotal: { sales25: openSales25, sales26: openSales26, diff: openSales26 - openSales25, yoy: yoy(openSales25, openSales26) },
    boneShokz: {
      share25: sum(bone25) ? boneShokz25 / sum(bone25) : 0,
      share26: sum(bone26) ? boneShokz26 / sum(bone26) : 0,
      sales25: boneShokz25,
      sales26: boneShokz26,
      category25: sum(bone25),
      category26: sum(bone26)
    },
    brandAll: brandMetrics(rows25, rows26),
    brandOpenEar: brandMetrics(open25, open26),
    priceMixAll: priceMix(rows25, rows26),
    priceMixOpenEar: priceMix(open25, open26),
    monthlyMixAll: monthlyMix(rows),
    monthlyMixOpenEar: monthlyMix(rows.filter(isOpenEar)),
    soundcoreOpenProducts: productMetrics(rows25, rows26, brand),
    soundcoreFormPriceAbs: matrix.abs,
    soundcoreFormPriceYoy: matrix.yr,
    forms: matrix.forms,
    ranges: matrix.ranges
  };
}
