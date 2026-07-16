# PD大盘复盘 Dashboard

这是一个可直接部署到 Vercel 的 Next.js 网页项目，用于上传大盘源数据 Excel，并按固定的促销大盘复盘模板自动生成 Dashboard 和 Excel 输出。

## 已包含功能

- 上传 `.xlsx / .xls / .csv` 大盘源数据
- 自动识别字段：`week ending / brand / retail sales / product form / price range / title`
- 固定 PD 对比：默认 `25PD = 2025-07-12`，`26PD = 2026-06-27`，可在页面修改
- 自动输出：
  - 耳机品牌市占变化
  - 耳机品牌销额变化
  - 开耳品牌市占变化
  - 开耳品牌销额变化
  - 耳机价位段对比
  - 开耳价位段对比
  - 耳机价格月度占比变化
  - 开耳价格月度占比变化
  - SHOKZ 骨传导品类市占变化
  - Soundcore 开耳产品销额表现
  - Soundcore 品线 / 价位段绝对变化与同比变化
- 支持导出 Excel 报告
- 已内置 `public/templates/促销大盘复盘模板.xlsx`

## 本地运行

```bash
npm install
npm run dev
```

然后打开：

```text
http://localhost:3000
```

## 部署到 Vercel

1. 在 GitHub 新建仓库，例如 `pd-review-dashboard`
2. 将本项目文件上传到 GitHub
3. 登录 Vercel，点击 `Add New -> Project`
4. 选择该 GitHub 仓库并导入
5. Framework Preset 选择 `Next.js`
6. 点击 `Deploy`

## 数据字段建议

源数据建议包含以下字段，字段名可以是英文或中文，系统会做模糊识别：

| 维度 | 推荐字段名 |
|---|---|
| 日期 | week ending / date / 日期 |
| 品牌 | brand / 品牌 |
| 销额 | retail sales / sales / 销额 / 销售额 |
| 标题 | title / product title / 商品标题 / 标题 |
| 品线 | product form / 品线 / 产品形态 / 品类 |
| 价位段 | price range / 价格段 / 价位段 |

## 固定口径

- 开耳 = 耳夹 + 耳挂
- 低价位 = 0-80
- 中价位 = 80-160
- 高价位 = 160+
- 核心指标 = Retail Sales
- 品牌图默认展示 26PD 销额 Top 10
