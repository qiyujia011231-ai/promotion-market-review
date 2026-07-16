import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { ReportData } from './types';

function aoaSheet(wb: XLSX.WorkBook, name: string, rows: unknown[][]) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = rows[0]?.map((_, i) => ({ wch: i === 0 ? 24 : 14 })) || [];
  XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
}

export function exportReport(report: ReportData) {
  const wb = XLSX.utils.book_new();
  const brandHead = ['Brand', '25PD Sales', '26PD Sales', 'Diff', 'YOY', '25PD Share', '26PD Share', 'Share Change pp'];
  const brandRows = (arr: typeof report.brandAll) => [brandHead, ...arr.map(r => [r.brand, r.sales25, r.sales26, r.diff, r.yoy, r.share25, r.share26, r.shareChangePp])];

  aoaSheet(wb, '说明', [
    ['PD大盘复盘自动输出'],
    ['25PD', report.config.pd25],
    ['26PD', report.config.pd26],
    ['重点品牌', report.config.brand],
    ['价位段', '低价位=0-80；中价位=80-160；高价位=160+'],
    ['开耳口径', '耳夹 + 耳挂'],
    ['指标', 'Retail Sales']
  ]);
  aoaSheet(wb, '大盘品牌市占变化', brandRows(report.brandAll));
  aoaSheet(wb, '开耳品牌市占变化', brandRows(report.brandOpenEar));
  aoaSheet(wb, '耳机价位段分布', [['Period', '低价位', '中价位', '高价位'], ...report.priceMixAll.map(r => [r.period, r.低价位, r.中价位, r.高价位])]);
  aoaSheet(wb, '开耳价位段分布', [['Period', '低价位', '中价位', '高价位'], ...report.priceMixOpenEar.map(r => [r.period, r.低价位, r.中价位, r.高价位])]);
  aoaSheet(wb, '耳机价格月度占比', [['Month', '低价位', '中价位', '高价位'], ...report.monthlyMixAll.map(r => [r.period, r.低价位, r.中价位, r.高价位])]);
  aoaSheet(wb, '开耳价格月度占比', [['Month', '低价位', '中价位', '高价位'], ...report.monthlyMixOpenEar.map(r => [r.period, r.低价位, r.中价位, r.高价位])]);
  aoaSheet(wb, 'SHOKZ骨传导市占', [
    ['Metric', '25PD', '26PD', 'Change'],
    ['Category Sales', report.boneShokz.category25, report.boneShokz.category26, report.boneShokz.category26 - report.boneShokz.category25],
    ['SHOKZ Sales', report.boneShokz.sales25, report.boneShokz.sales26, report.boneShokz.sales26 - report.boneShokz.sales25],
    ['SHOKZ Share', report.boneShokz.share25, report.boneShokz.share26, report.boneShokz.share26 - report.boneShokz.share25]
  ]);
  aoaSheet(wb, `${report.config.brand}开耳产品`, [['Product', '25PD Sales', '26PD Sales', 'Diff', 'YOY'], ...report.soundcoreOpenProducts.map(r => [r.product, r.sales25, r.sales26, r.diff, r.yoy])]);

  const absRows = [['Product Form', ...report.ranges], ...report.forms.map(f => [f, ...report.ranges.map(r => report.soundcoreFormPriceAbs[f]?.[r] || 0)])];
  const yoyRows = [['Product Form', ...report.ranges], ...report.forms.map(f => [f, ...report.ranges.map(r => report.soundcoreFormPriceYoy[f]?.[r] ?? '新增')])];
  aoaSheet(wb, `${report.config.brand}品线价位绝对变化`, absRows);
  aoaSheet(wb, `${report.config.brand}品线价位同比`, yoyRows);

  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'PD大盘复盘输出.xlsx');
}
