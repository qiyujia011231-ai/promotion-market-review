import Uploader from '@/components/Uploader';

export default function Home() {
  return <main>
    <div className="hero">
      <div>
        <h1>PD大盘复盘 Dashboard</h1>
        <p>上传大盘源数据，按固定促销大盘复盘模板自动生成图表、表格和Excel输出。</p>
      </div>
      <span className="badge">Vercel / Next.js / Excel 自动分析</span>
    </div>
    <Uploader />
  </main>;
}
