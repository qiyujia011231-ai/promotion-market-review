# PD Review Dashboard

这是一个可部署到 Vercel 的 Next.js 项目，用于上传大盘源数据并自动生成“促销大盘复盘模板版 Excel”。

## 已实现

- 上传源数据 Excel
- 自动识别字段：week ending / brand / retail sales / product form / price range / title
- PD日期下拉选项直接来自源数据的 `week ending` 字段
- 生成模板版 Excel，包含图片和表格
- 内置固定模板：`public/templates/促销大盘复盘模板.xlsx`
- 价位段口径：低价位=0-80，中价位=80-160，高价位=160+
- 开耳口径：耳夹 + 耳挂

## 输出内容

- 说明与摘要
- 大盘品牌市占变化
- 大盘品牌销额变化
- 开耳品牌市占变化
- 开耳品牌销额变化
- 耳机价位段分布
- 开耳价位段分布
- 耳机价格月度占比
- 开耳价格月度占比
- SHOKZ骨传导市占
- 重点品牌开耳产品表现
- 重点品牌品线/价位段绝对变化
- 重点品牌品线/价位段同比变化

## 本地运行

```bash
npm install
npm run dev
```

打开：

```text
http://localhost:3000
```

## Vercel 部署设置

| 配置项 | 设置 |
|---|---|
| Framework Preset | Next.js |
| Root Directory | ./ |
| Install Command | npm install |
| Build Command | npm run build |
| Output Directory | 留空 |

## GitHub 上传注意

仓库根目录必须直接看到：

```text
app/
components/
lib/
public/
package.json
next.config.mjs
tsconfig.json
vercel.json
```

不要只上传 zip 文件本身，也不要让这些文件夹被拆散。

## 说明

当前版本在浏览器端完成 Excel 解析、图表图片生成、模板读取和 Excel 导出。这样可以避免 Vercel 服务端上传大文件限制，更适合 20MB+ 的大盘源数据。
