import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { BrandMetric, PriceMixRow, ProductMetric, ReportData } from './types';

const MONEY_FMT = '£#,##0';
const PCT_FMT = '0.0%';
const COLORS = {
  blue: '2878D8',
  lightBlue: 'D8E8FB',
  orange: 'F5A623',
  green: '4CAF50',
  red: 'C94C4C',
  gray: '666666',
  border: 'D9E2F3',
  header: '1F4E78',
  pale: 'F4F8FF'
};

type Sheet = ExcelJS.Worksheet;

type ChartSeries = { name: string; values: number[]; color: string };

function safeSheetName(name: string) {
  return name.replace(/[\\/?*\[\]:]/g, '').slice(0, 31) || 'Sheet';
}

function createSheet(wb: ExcelJS.Workbook, name: string) {
  const sheetName = safeSheetName(name);
  const existing = wb.getWorksheet(sheetName);
  if (existing) wb.removeWorksheet(existing.id);
  return wb.addWorksheet(sheetName);
}

function fmtMoney(v: number) {
  if (Math.abs(v) >= 1000000) return `£${(v / 1000000).toFixed(1)}M`;
  if (Math.abs(v) >= 1000) return `£${(v / 1000).toFixed(0)}K`;
  return `£${Math.round(v)}`;
}

function fmtPct(v: number | null) {
  if (v === null) return '新增';
  return `${(v * 100).toFixed(1)}%`;
}

function fmtShare(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

function base64FromCanvas(canvas: HTMLCanvasElement) {
  return canvas.toDataURL('image/png').split(',')[1];
}

function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, opts?: { size?: number; bold?: boolean; align?: CanvasTextAlign; color?: string }) {
  ctx.fillStyle = opts?.color || '#1f2937';
  ctx.textAlign = opts?.align || 'left';
  ctx.font = `${opts?.bold ? '700' : '400'} ${opts?.size || 13}px Arial, sans-serif`;
  ctx.fillText(text, x, y);
}

function makeCanvas(width = 900, height = 520) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法创建图表画布');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  return { canvas, ctx, width, height };
}

function twoBarChart(title: string, labels: string[], v25: number[], v26: number[], options?: { percent?: boolean }) {
  const { canvas, ctx, width, height } = makeCanvas();
  drawText(ctx, title, 28, 34, { size: 20, bold: true, color: '#111827' });
  const left = 70, right = 30, top = 70, bottom = 95;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const maxVal = Math.max(...v25, ...v26, 1);
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = top + plotH - (plotH * i) / 4;
    ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(left + plotW, y); ctx.stroke();
    const val = (maxVal * i) / 4;
    drawText(ctx, options?.percent ? fmtShare(val) : fmtMoney(val), left - 8, y + 4, { size: 11, align: 'right', color: '#6B7280' });
  }
  const groupW = plotW / labels.length;
  const barW = Math.min(28, groupW * 0.28);
  labels.forEach((label, i) => {
    const cx = left + groupW * i + groupW / 2;
    const h25 = (v25[i] / maxVal) * plotH;
    const h26 = (v26[i] / maxVal) * plotH;
    ctx.fillStyle = '#8DB3E2';
    ctx.fillRect(cx - barW - 2, top + plotH - h25, barW, h25);
    ctx.fillStyle = '#F4A261';
    ctx.fillRect(cx + 2, top + plotH - h26, barW, h26);
    drawText(ctx, options?.percent ? fmtShare(v26[i]) : fmtMoney(v26[i]), cx, top + plotH - h26 - 6, { size: 10, align: 'center', color: '#333' });
    ctx.save();
    ctx.translate(cx, height - 70);
    ctx.rotate(-Math.PI / 5);
    drawText(ctx, label.slice(0, 14), 0, 0, { size: 11, align: 'right', color: '#374151' });
    ctx.restore();
  });
  ctx.fillStyle = '#8DB3E2'; ctx.fillRect(width - 190, 26, 14, 14); drawText(ctx, '25PD', width - 170, 38, { size: 12 });
  ctx.fillStyle = '#F4A261'; ctx.fillRect(width - 120, 26, 14, 14); drawText(ctx, '26PD', width - 100, 38, { size: 12 });
  return base64FromCanvas(canvas);
}

function stackedPctChart(title: string, rows: PriceMixRow[], monthly = false) {
  const { canvas, ctx, width, height } = makeCanvas(monthly ? 1100 : 760, 480);
  drawText(ctx, title, 28, 34, { size: 20, bold: true, color: '#111827' });
  const left = 55, right = 30, top = 70, bottom = monthly ? 100 : 70;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const colors = ['#8DB3E2', '#F4A261', '#A8D08D'];
  const keys: Array<'低价位' | '中价位' | '高价位'> = ['低价位', '中价位', '高价位'];
  for (let i = 0; i <= 4; i++) {
    const y = top + plotH - (plotH * i) / 4;
    ctx.strokeStyle = '#E5E7EB'; ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(left + plotW, y); ctx.stroke();
    drawText(ctx, `${i * 25}%`, left - 8, y + 4, { size: 11, align: 'right', color: '#6B7280' });
  }
  const groupW = plotW / rows.length;
  const barW = Math.min(monthly ? 38 : 86, groupW * 0.62);
  rows.forEach((row, i) => {
    const x = left + groupW * i + groupW / 2 - barW / 2;
    let y = top + plotH;
    keys.forEach((k, idx) => {
      const h = row[k] * plotH;
      ctx.fillStyle = colors[idx];
      ctx.fillRect(x, y - h, barW, h);
      if (h > 24) drawText(ctx, `${(row[k] * 100).toFixed(0)}%`, x + barW / 2, y - h / 2 + 4, { size: 11, align: 'center', color: '#111827' });
      y -= h;
    });
    if (monthly) {
      ctx.save(); ctx.translate(x + barW / 2, height - 64); ctx.rotate(-Math.PI / 5); drawText(ctx, row.period, 0, 0, { size: 11, align: 'right' }); ctx.restore();
    } else {
      drawText(ctx, row.period, x + barW / 2, height - 42, { size: 12, align: 'center' });
    }
  });
  keys.forEach((k, idx) => { ctx.fillStyle = colors[idx]; ctx.fillRect(width - 250 + idx * 78, 26, 14, 14); drawText(ctx, k, width - 232 + idx * 78, 38, { size: 12 }); });
  return base64FromCanvas(canvas);
}

function productChart(title: string, rows: ProductMetric[]) {
  const top = rows.slice(0, 10);
  return twoBarChart(title, top.map(r => r.product), top.map(r => r.sales25), top.map(r => r.sales26));
}

function setTitle(ws: Sheet, title: string, subtitle?: string) {
  ws.mergeCells('A1:H1');
  ws.getCell('A1').value = title;
  ws.getCell('A1').font = { bold: true, size: 18, color: { argb: COLORS.header } };
  ws.getCell('A1').alignment = { vertical: 'middle' };
  ws.getRow(1).height = 28;
  if (subtitle) {
    ws.mergeCells('A2:H2');
    ws.getCell('A2').value = subtitle;
    ws.getCell('A2').font = { size: 11, color: { argb: COLORS.gray } };
  }
}

function styleSheet(ws: Sheet) {
  ws.views = [{ showGridLines: false }];
  ws.columns.forEach((c, idx) => { c.width = idx === 0 ? 22 : 15; });
}

function writeTable(ws: Sheet, startRow: number, headers: string[], rows: unknown[][], numberCols: number[] = [], pctCols: number[] = []) {
  const headerRow = ws.getRow(startRow);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.header } };
    cell.alignment = { horizontal: 'center' };
    cell.border = { top: { style: 'thin', color: { argb: COLORS.border } }, bottom: { style: 'thin', color: { argb: COLORS.border } }, left: { style: 'thin', color: { argb: COLORS.border } }, right: { style: 'thin', color: { argb: COLORS.border } } };
  });
  rows.forEach((r, ri) => {
    const row = ws.getRow(startRow + 1 + ri);
    r.forEach((v, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = v as ExcelJS.CellValue;
      cell.border = { top: { style: 'thin', color: { argb: COLORS.border } }, bottom: { style: 'thin', color: { argb: COLORS.border } }, left: { style: 'thin', color: { argb: COLORS.border } }, right: { style: 'thin', color: { argb: COLORS.border } } };
      if (numberCols.includes(ci + 1)) cell.numFmt = MONEY_FMT;
      if (pctCols.includes(ci + 1)) cell.numFmt = PCT_FMT;
      if (typeof v === 'number' && v < 0) cell.font = { color: { argb: COLORS.red } };
    });
  });
}

function addImage(ws: Sheet, wb: ExcelJS.Workbook, base64: string, cell = 'A4', width = 760, height = 430) {
  const imageId = wb.addImage({ base64, extension: 'png' });
  ws.addImage(imageId, { tl: { col: cell.match(/[A-Z]+/)![0].charCodeAt(0) - 65, row: Number(cell.match(/\d+/)![0]) - 1 }, ext: { width, height } });
}

function addBrandSheet(wb: ExcelJS.Workbook, name: string, title: string, data: BrandMetric[], type: 'share' | 'sales') {
  const ws = createSheet(wb, name);
  styleSheet(ws);
  setTitle(ws, title, '25PD vs 26PD；指标：Retail Sales');
  const chart = type === 'share'
    ? twoBarChart(title, data.map(d => d.brand), data.map(d => d.share25), data.map(d => d.share26), { percent: true })
    : twoBarChart(title, data.map(d => d.brand), data.map(d => d.sales25), data.map(d => d.sales26));
  addImage(ws, wb, chart, 'A4', 820, 470);
  const rows = data.map(d => [d.brand, d.sales25, d.sales26, d.diff, d.yoy === null ? '新增' : d.yoy, d.share25, d.share26, d.shareChangePp]);
  writeTable(ws, 31, ['Brand', '25PD Sales', '26PD Sales', 'Diff', 'YOY', '25PD Share', '26PD Share', 'Share Change'], rows, [2,3,4], [5,6,7,8]);
  return ws;
}

function addPriceSheet(wb: ExcelJS.Workbook, name: string, title: string, data: PriceMixRow[], monthly = false) {
  const ws = createSheet(wb, name);
  styleSheet(ws);
  setTitle(ws, title, '低价位=0-80；中价位=80-160；高价位=160+；每期合计=100%');
  addImage(ws, wb, stackedPctChart(title, data, monthly), 'A4', monthly ? 900 : 760, 420);
  writeTable(ws, 29, [monthly ? 'Month' : 'Period', '低价位', '中价位', '高价位'], data.map(d => [d.period, d.低价位, d.中价位, d.高价位]), [], [2,3,4]);
}

function addProductSheet(wb: ExcelJS.Workbook, report: ReportData) {
  const ws = createSheet(wb, `${report.config.brand}开耳产品`);
  styleSheet(ws);
  setTitle(ws, `${report.config.brand}开耳产品销额表现`, '耳夹+耳挂；按标题自动简写；销额小于£1k自动忽略');
  addImage(ws, wb, productChart(`${report.config.brand}开耳产品销额表现`, report.soundcoreOpenProducts), 'A4', 820, 470);
  writeTable(ws, 31, ['Product', '25PD Sales', '26PD Sales', 'Diff', 'YOY'], report.soundcoreOpenProducts.map(p => [p.product, p.sales25, p.sales26, p.diff, p.yoy === null ? '新增' : p.yoy]), [2,3,4], [5]);
}

function addMatrixSheet(wb: ExcelJS.Workbook, report: ReportData, type: 'abs' | 'yoy') {
  const ws = createSheet(wb, `${report.config.brand}品线价位${type === 'abs' ? '绝对变化' : '同比'}`);
  styleSheet(ws);
  setTitle(ws, `${report.config.brand}品线/价位段${type === 'abs' ? '销额绝对值变化' : '同比变化'}`, type === 'abs' ? '表内数值=26PD销额-25PD销额' : '表内数值=26PD销额÷25PD销额-1；25PD为0显示新增');
  const data = type === 'abs' ? report.soundcoreFormPriceAbs : report.soundcoreFormPriceYoy;
  const rows = report.forms.map(f => [f, ...report.ranges.map(r => {
    const v = data[f]?.[r];
    if (type === 'yoy' && v === null) return '新增';
    return (v ?? 0) as number;
  })]);
  writeTable(ws, 4, ['Product Form', ...report.ranges], rows, type === 'abs' ? report.ranges.map((_, i) => i + 2) : [], type === 'yoy' ? report.ranges.map((_, i) => i + 2) : []);
  ws.columns.forEach((c, idx) => { c.width = idx === 0 ? 16 : 13; });
}

function addSummarySheet(wb: ExcelJS.Workbook, report: ReportData) {
  const ws = createSheet(wb, '说明与摘要');
  styleSheet(ws);
  setTitle(ws, '促销大盘复盘自动输出', '基于上传源数据与固定模板生成');
  writeTable(ws, 4, ['项目', '内容'], [
    ['25PD', report.config.pd25],
    ['26PD', report.config.pd26],
    ['重点品牌', report.config.brand],
    ['指标', 'Retail Sales'],
    ['开耳口径', '耳夹 + 耳挂'],
    ['价位段', '低价位=0-80；中价位=80-160；高价位=160+']
  ]);
  writeTable(ws, 13, ['模块', '核心结果'], [
    ['耳机大盘', `销额 ${fmtMoney(report.total.sales25)} → ${fmtMoney(report.total.sales26)}，YOY ${fmtPct(report.total.yoy)}`],
    ['开耳品类', `销额 ${fmtMoney(report.openEarTotal.sales25)} → ${fmtMoney(report.openEarTotal.sales26)}，YOY ${fmtPct(report.openEarTotal.yoy)}`],
    ['SHOKZ骨传导', `市占 ${fmtShare(report.boneShokz.share25)} → ${fmtShare(report.boneShokz.share26)}，变化 ${fmtShare(report.boneShokz.share26 - report.boneShokz.share25)}`]
  ]);
  ws.getColumn(2).width = 72;
}

async function loadTemplateWorkbook() {
  const wb = new ExcelJS.Workbook();
  try {
    const res = await fetch('/templates/促销大盘复盘模板.xlsx');
    if (!res.ok) throw new Error('template not found');
    const buf = await res.arrayBuffer();
    await wb.xlsx.load(buf as any);
    return wb;
  } catch {
    return wb;
  }
}

export async function exportReport(report: ReportData) {
  const wb = await loadTemplateWorkbook();
  addSummarySheet(wb, report);
  addBrandSheet(wb, '大盘品牌市占变化', '耳机品牌市占变化', report.brandAll, 'share');
  addBrandSheet(wb, '大盘品牌销额变化', '耳机品牌销额变化', report.brandAll, 'sales');
  addBrandSheet(wb, '开耳品牌市占变化', '开耳品牌市占变化', report.brandOpenEar, 'share');
  addBrandSheet(wb, '开耳品牌销额变化', '开耳品牌销额变化', report.brandOpenEar, 'sales');
  addPriceSheet(wb, '耳机价位段分布', '耳机价位段分布', report.priceMixAll);
  addPriceSheet(wb, '开耳价位段分布', '开耳价位段分布', report.priceMixOpenEar);
  addPriceSheet(wb, '耳机价格月度占比', '耳机价格月度占比变化', report.monthlyMixAll, true);
  addPriceSheet(wb, '开耳价格月度占比', '开耳价格月度占比变化', report.monthlyMixOpenEar, true);
  addProductSheet(wb, report);
  addMatrixSheet(wb, report, 'abs');
  addMatrixSheet(wb, report, 'yoy');
  const bone = createSheet(wb, 'SHOKZ骨传导市占');
  styleSheet(bone);
  setTitle(bone, 'SHOKZ骨传导品类市占变化', '骨传导品类内市占，25PD vs 26PD');
  addImage(bone, wb, stackedPctChart('SHOKZ骨传导品类市占变化', [
    { period: '25PD', 低价位: report.boneShokz.share25, 中价位: 1 - report.boneShokz.share25, 高价位: 0 },
    { period: '26PD', 低价位: report.boneShokz.share26, 中价位: 1 - report.boneShokz.share26, 高价位: 0 }
  ]), 'A4', 760, 420);
  writeTable(bone, 29, ['Metric', '25PD', '26PD', 'Change'], [
    ['Category Sales', report.boneShokz.category25, report.boneShokz.category26, report.boneShokz.category26 - report.boneShokz.category25],
    ['SHOKZ Sales', report.boneShokz.sales25, report.boneShokz.sales26, report.boneShokz.sales26 - report.boneShokz.sales25],
    ['SHOKZ Share', report.boneShokz.share25, report.boneShokz.share26, report.boneShokz.share26 - report.boneShokz.share25]
  ], [2,3,4], [2,3,4]);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `促销大盘复盘_${report.config.pd25}_vs_${report.config.pd26}.xlsx`);
}
