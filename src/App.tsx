import MostActiveStocksPanel from './components/MostActiveStocksPanel'
import CurrentAssetsPanel from './components/CurrentAssetsPanel'
import AssetHistoryPanel from './components/AssetHistoryPanel'
import { Layout } from 'lucide-react'

function App() {
  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-900/40">
            <Layout className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">Trader<span className="text-blue-500">Dash</span></h1>
            <p className="text-slate-500 text-xs font-bold tracking-[0.2em] uppercase">Professional Terminal v3.10</p>
          </div>
        </div>
        <div className="flex items-center gap-6 bg-slate-900/80 px-6 py-3 rounded-2xl border border-slate-800 backdrop-blur-md shadow-xl">
           <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Market Status</span>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                 <span className="text-sm font-black text-green-500 uppercase tracking-tight">OPEN</span>
              </div>
           </div>
           <div className="w-[1px] h-8 bg-slate-800"></div>
           <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Server Time</span>
              <span className="text-sm font-mono font-bold text-slate-300">{new Date().toLocaleTimeString()} HKT</span>
           </div>
        </div>
      </header>

      <main className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 order-2 xl:order-1">
          <MostActiveStocksPanel />
        </div>
        <div className="order-1 xl:order-2">
          <CurrentAssetsPanel />
        </div>
        <div className="xl:col-span-3 order-3">
          <AssetHistoryPanel />
        </div>
      </main>

      <footer className="text-center py-10 border-t border-slate-900 mt-12">
         <p className="text-slate-600 text-xs font-medium tracking-wide">
            © 2026 TRADERDASH TERMINAL • DATA PROVIDED BY MOCK API • BUILT WITH OPENCLAW
         </p>
      </footer>
    </div>
  )
}

export default App
