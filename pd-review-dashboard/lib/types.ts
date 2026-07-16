export type RawRow = Record<string, unknown>;

export type SalesRow = {
  weekEnding: string;
  month: string;
  year: string;
  brand: string;
  title: string;
  productForm: string;
  priceRange: string;
  priceBand: '低价位' | '中价位' | '高价位' | '未知';
  retailSales: number;
  units: number;
  asp?: number;
};

export type PDConfig = {
  pd25: string;
  pd26: string;
  brand: string;
};

export type BrandMetric = {
  brand: string;
  sales25: number;
  sales26: number;
  share25: number;
  share26: number;
  shareChangePp: number;
  yoy: number | null;
  diff: number;
};

export type PriceMixRow = {
  period: string;
  低价位: number;
  中价位: number;
  高价位: number;
};

export type ProductMetric = {
  product: string;
  sales25: number;
  sales26: number;
  diff: number;
  yoy: number | null;
};

export type ReportData = {
  rows: SalesRow[];
  config: PDConfig;
  total: { sales25: number; sales26: number; yoy: number | null; diff: number };
  openEarTotal: { sales25: number; sales26: number; yoy: number | null; diff: number };
  boneShokz: { share25: number; share26: number; sales25: number; sales26: number; category25: number; category26: number };
  brandAll: BrandMetric[];
  brandOpenEar: BrandMetric[];
  priceMixAll: PriceMixRow[];
  priceMixOpenEar: PriceMixRow[];
  monthlyMixAll: PriceMixRow[];
  monthlyMixOpenEar: PriceMixRow[];
  soundcoreOpenProducts: ProductMetric[];
  soundcoreFormPriceAbs: Record<string, Record<string, number>>;
  soundcoreFormPriceYoy: Record<string, Record<string, number | null>>;
  forms: string[];
  ranges: string[];
};
