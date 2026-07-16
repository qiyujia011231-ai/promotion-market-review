import * as XLSX from 'xlsx';
import { RawRow, SalesRow } from './types';

const norm = (v: unknown) => String(v ?? '').trim();
const lower = (v: unknown) => norm(v).toLowerCase();

function excelDateToISO(v: unknown): string {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  if (typeof v === 'number') {
    const parsed = XLSX.SSF.parse_date_code(v);
    if (parsed) {
      const yyyy = String(parsed.y).padStart(4, '0');
      const mm = String(parsed.m).padStart(2, '0');
      const dd = String(parsed.d).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  }
  const s = norm(v).replaceAll('/', '-');
  const m = s.match(/(20\d{2})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return s;
}

function num(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const s = norm(v).replace(/[£,$,%\s]/g, '').replace(/,/g, '');
  if (!s) return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function pickKey(row: RawRow, candidates: string[]): string | undefined {
  const keys = Object.keys(row);
  for (const c of candidates) {
    const hit = keys.find(k => lower(k) === c.toLowerCase());
    if (hit) return hit;
  }
  for (const c of candidates) {
    const hit = keys.find(k => lower(k).includes(c.toLowerCase()));
    if (hit) return hit;
  }
  return undefined;
}

function parsePriceBand(priceRange: string): SalesRow['priceBand'] {
  const s = priceRange.replace(/[£$€]/g, '').trim();
  if (!s) return '未知';
  if (/160\+|160以上|>=\s*160|over\s*160/i.test(s)) return '高价位';
  const nums = [...s.matchAll(/\d+(?:\.\d+)?/g)].map(m => Number(m[0]));
  const midpoint = nums.length >= 2 ? (nums[0] + nums[1]) / 2 : nums[0];
  if (!Number.isFinite(midpoint)) return '未知';
  if (midpoint < 80) return '低价位';
  if (midpoint < 160) return '中价位';
  return '高价位';
}

export function normalizeProductForm(form: string, title = ''): string {
  const f = `${form} ${title}`.toLowerCase();
  if (/骨传导|bone|openrun|openmove|openswim/.test(f)) return '骨传导';
  if (/耳夹|clip|c30|c50|opendots/.test(f)) return '耳夹';
  if (/耳挂|hook|openfit|aerofit|v20|v30|sense|soundgear|endurance zone/.test(f)) return '耳挂';
  if (/头戴|over ear|headband|headphone/.test(f)) return '头戴式';
  if (/入耳|in-ear|earbud|buds|airpods/.test(f)) return '入耳';
  return form || '未识别';
}

export const isOpenEar = (r: SalesRow) => r.productForm === '耳夹' || r.productForm === '耳挂';
export const isBone = (r: SalesRow) => r.productForm === '骨传导';

export async function parseWorkbook(file: File): Promise<SalesRow[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json<RawRow>(ws, { defval: '' });
  if (!raw.length) return [];

  const sample = raw[0];
  const weekKey = pickKey(sample, ['week ending', 'week_ending', 'date', '日期', '周结束', 'week']);
  const brandKey = pickKey(sample, ['brand', '品牌']);
  const titleKey = pickKey(sample, ['title', 'product title', '商品标题', '标题', 'item name', 'asin title']);
  const formKey = pickKey(sample, ['product form', 'form', '品线', '产品形态', '品类', 'category']);
  const priceKey = pickKey(sample, ['price range', 'price_range', '价格段', '价位段']);
  const salesKey = pickKey(sample, ['retail sales', 'sales', '销额', '销售额']);
  const unitsKey = pickKey(sample, ['units', 'unit sales', '销量', '件数']);
  const aspKey = pickKey(sample, ['asp', 'average selling price', '均价']);

  if (!weekKey || !brandKey || !salesKey) {
    throw new Error('无法识别必要字段：需要至少包含 week ending/date、brand、retail sales。请检查源数据表头。');
  }

  return raw.map((row) => {
    const weekEnding = excelDateToISO(row[weekKey]);
    const title = titleKey ? norm(row[titleKey]) : '';
    const rawForm = formKey ? norm(row[formKey]) : '';
    const productForm = normalizeProductForm(rawForm, title);
    const priceRange = priceKey ? norm(row[priceKey]) : '未知';
    const month = weekEnding.slice(0, 7);
    const year = weekEnding.slice(0, 4);
    return {
      weekEnding,
      month,
      year,
      brand: brandKey ? norm(row[brandKey]).toUpperCase() : 'UNKNOWN',
      title,
      productForm,
      priceRange,
      priceBand: parsePriceBand(priceRange),
      retailSales: num(row[salesKey]),
      units: unitsKey ? num(row[unitsKey]) : 0,
      asp: aspKey ? num(row[aspKey]) : undefined
    };
  }).filter(r => r.weekEnding && r.brand && Number.isFinite(r.retailSales));
}
