'use client';

import { BrandMetric, ReportData } from '@/lib/types';
import { fmtMoney, fmtPct, fmtPp, fmtShare } from '@/lib/format';

export function BrandTable({ data }: { data: BrandMetric[] }) {
  return <div className="tableWrap"><table><thead><tr><th>品牌</th><th>25PD销额</th><th>26PD销额</th><th>YOY</th><th>25PD份额</th><th>26PD份额</th><th>份额变化</th></tr></thead><tbody>
    {data.map(r => <tr key={r.brand}><td>{r.brand}</td><td>{fmtMoney(r.sales25)}</td><td>{fmtMoney(r.sales26)}</td><td className={r.yoy !== null && r.yoy >= 0 ? 'positive' : 'negative'}>{fmtPct(r.yoy)}</td><td>{fmtShare(r.share25)}</td><td>{fmtShare(r.share26)}</td><td className={r.shareChangePp >= 0 ? 'positive' : 'negative'}>{fmtPp(r.shareChangePp)}</td></tr>)}
  </tbody></table></div>;
}

export function ProductTable({ report }: { report: ReportData }) {
  return <div className="tableWrap"><table><thead><tr><th>产品</th><th>25PD销额</th><th>26PD销额</th><th>变化</th><th>YOY</th></tr></thead><tbody>
    {report.soundcoreOpenProducts.map(r => <tr key={r.product}><td>{r.product}</td><td>{fmtMoney(r.sales25)}</td><td>{fmtMoney(r.sales26)}</td><td className={r.diff >= 0 ? 'positive' : 'negative'}>{fmtMoney(r.diff)}</td><td className={r.yoy !== null && r.yoy >= 0 ? 'positive' : 'negative'}>{fmtPct(r.yoy)}</td></tr>)}
  </tbody></table></div>;
}

export function MatrixTable({ report, type }: { report: ReportData; type: 'abs' | 'yoy' }) {
  const data = type === 'abs' ? report.soundcoreFormPriceAbs : report.soundcoreFormPriceYoy;
  return <div className="tableWrap"><table><thead><tr><th>品线 / 价位段</th>{report.ranges.map(r => <th key={r}>{r}</th>)}</tr></thead><tbody>
    {report.forms.map(f => <tr key={f}><td>{f}</td>{report.ranges.map(r => {
      const v = data[f]?.[r];
      const n = typeof v === 'number' ? v : null;
      return <td key={r} className={n !== null && n >= 0 ? 'positive' : 'negative'}>{type === 'abs' ? fmtMoney(Number(v || 0)) : (n === null ? '新增' : fmtPct(n))}</td>;
    })}</tr>)}
  </tbody></table></div>;
}
