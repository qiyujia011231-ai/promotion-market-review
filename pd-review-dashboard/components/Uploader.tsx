'use client';

import { useMemo, useState } from 'react';
import { parseWorkbook } from '@/lib/parseExcel';
import { buildReport } from '@/lib/analysis';
import { ReportData, SalesRow } from '@/lib/types';
import { exportReport } from '@/lib/exportReport';
import { fmtMoney, fmtPct, fmtPp, fmtShare } from '@/lib/format';
import { BrandShareChart, ChartCard, MonthlyMixChart, PriceMixChart, ProductSalesChart, SalesChart } from './Charts';
import { BrandTable, MatrixTable, ProductTable } from './DataTables';

const defaultConfig = { pd25: '2025-07-12', pd26: '2026-06-27', brand: 'SOUNDCORE' };

export default function Uploader() {
  const [rows, setRows] = useState<SalesRow[]>([]);
  const [config, setConfig] = useState(defaultConfig);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const report: ReportData | null = useMemo(() => rows.length ? buildReport(rows, config) : null, [rows, config]);

  async function handleFile(file?: File) {
    setError('');
    if (!file) return;
    try {
      setFileName(file.name);
      const parsed = await parseWorkbook(file);
      if (!parsed.length) throw new Error('没有读取到有效数据。');
      setRows(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : '读取失败');
      setRows([]);
    }
  }

  const availableDates = useMemo(() => Array.from(new Set(rows.map(r => r.weekEnding))).sort(), [rows]);

  return <div className="grid">
    <section className="card">
      <div className="upload">
        <input type="file" accept=".xlsx,.xls,.csv" onChange={e => handleFile(e.target.files?.[0])} />
        <button className="secondary" onClick={() => report && exportReport(report)} disabled={!report}>导出Excel报告</button>
        <a className="linkButton secondary" href="/templates/促销大盘复盘模板.xlsx" download>下载固定模板</a>
        {fileName ? <span className="badge">已读取：{fileName}</span> : null}
      </div>
      <div className="controls">
        <label>25PD日期
          <input value={config.pd25} list="dates" onChange={e => setConfig({ ...config, pd25: e.target.value })} />
        </label>
        <label>26PD日期
          <input value={config.pd26} list="dates" onChange={e => setConfig({ ...config, pd26: e.target.value })} />
        </label>
        <label>重点品牌
          <input value={config.brand} onChange={e => setConfig({ ...config, brand: e.target.value.toUpperCase() })} />
        </label>
        <datalist id="dates">{availableDates.map(d => <option key={d} value={d} />)}</datalist>
      </div>
      {error ? <p className="warn" style={{ marginTop: 14 }}>{error}</p> : <p className="footerNote">字段会自动识别：week ending / brand / retail sales / product form / price range / title。价位段：0-80、80-160、160+；开耳：耳夹+耳挂。</p>}
    </section>

    {!report ? <section className="card"><h2>开始使用</h2><p>上传“大盘源数据”Excel，即可自动生成品牌市占、销额变化、价格段分布、月度价格结构、SHOKZ骨传导市占、Soundcore开耳产品拆解等图表。代码已经按 Vercel + Next.js 结构生成。</p></section> : <Dashboard report={report} />}
  </div>;
}

function Dashboard({ report }: { report: ReportData }) {
  return <>
    <section className="grid three">
      <div className="card kpi"><span className="label">耳机大盘销额 YOY</span><span className="value">{fmtPct(report.total.yoy)}</span><span className={report.total.diff >= 0 ? 'delta positive' : 'delta negative'}>{fmtMoney(report.total.sales25)} → {fmtMoney(report.total.sales26)}</span></div>
      <div className="card kpi"><span className="label">开耳销额 YOY</span><span className="value">{fmtPct(report.openEarTotal.yoy)}</span><span className={report.openEarTotal.diff >= 0 ? 'delta positive' : 'delta negative'}>{fmtMoney(report.openEarTotal.sales25)} → {fmtMoney(report.openEarTotal.sales26)}</span></div>
      <div className="card kpi"><span className="label">SHOKZ骨传导市占变化</span><span className="value">{fmtShare(report.boneShokz.share26)}</span><span className={report.boneShokz.share26 - report.boneShokz.share25 >= 0 ? 'delta positive' : 'delta negative'}>{fmtShare(report.boneShokz.share25)} → {fmtShare(report.boneShokz.share26)}（{fmtPp(report.boneShokz.share26 - report.boneShokz.share25)}）</span></div>
    </section>

    <section className="grid two">
      <ChartCard title="耳机品牌市占变化" subtitle="Top10 by 26PD Retail Sales"><BrandShareChart data={report.brandAll} /></ChartCard>
      <ChartCard title="耳机品牌销额变化" subtitle="Retail Sales"><SalesChart data={report.brandAll} /></ChartCard>
      <ChartCard title="开耳品牌市占变化" subtitle="耳夹 + 耳挂"><BrandShareChart data={report.brandOpenEar} /></ChartCard>
      <ChartCard title="开耳品牌销额变化" subtitle="Retail Sales"><SalesChart data={report.brandOpenEar} /></ChartCard>
      <ChartCard title="耳机价位段对比" subtitle="低价位0-80 / 中价位80-160 / 高价位160+"><PriceMixChart data={report.priceMixAll} /></ChartCard>
      <ChartCard title="开耳价位段对比" subtitle="低价位0-80 / 中价位80-160 / 高价位160+"><PriceMixChart data={report.priceMixOpenEar} /></ChartCard>
      <ChartCard title="耳机价格月度占比变化" subtitle="100%堆积柱形图"><MonthlyMixChart data={report.monthlyMixAll} /></ChartCard>
      <ChartCard title="开耳价格月度占比变化" subtitle="100%堆积柱形图"><MonthlyMixChart data={report.monthlyMixOpenEar} /></ChartCard>
      <ChartCard title={`${report.config.brand} 开耳产品销额表现`} subtitle="按标题简写，销额从大到小"><ProductSalesChart data={report.soundcoreOpenProducts} /></ChartCard>
      <ChartCard title="SHOKZ骨传导品类市占" subtitle="25PD vs 26PD"><PriceMixChart data={[{ period: '25PD', 低价位: report.boneShokz.share25, 中价位: 1 - report.boneShokz.share25, 高价位: 0 }, { period: '26PD', 低价位: report.boneShokz.share26, 中价位: 1 - report.boneShokz.share26, 高价位: 0 }]} /></ChartCard>
    </section>

    <section className="grid two">
      <div className="card"><div className="chartTitle"><h2>耳机品牌明细</h2><span>市占 / YOY</span></div><BrandTable data={report.brandAll} /></div>
      <div className="card"><div className="chartTitle"><h2>开耳品牌明细</h2><span>市占 / YOY</span></div><BrandTable data={report.brandOpenEar} /></div>
      <div className="card"><div className="chartTitle"><h2>{report.config.brand} 开耳产品明细</h2><span>销额小于£1k自动忽略</span></div><ProductTable report={report} /></div>
      <div className="card"><div className="chartTitle"><h2>{report.config.brand} 品线/价位段绝对变化</h2><span>26PD - 25PD</span></div><MatrixTable report={report} type="abs" /></div>
      <div className="card"><div className="chartTitle"><h2>{report.config.brand} 品线/价位段同比</h2><span>每个单元格 26PD ÷ 25PD - 1</span></div><MatrixTable report={report} type="yoy" /></div>
    </section>
  </>;
}
