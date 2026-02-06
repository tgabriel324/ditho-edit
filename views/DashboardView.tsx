
import React, { useState } from 'react';
import { Project } from '../types.ts';

const DEMO_HTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');
    body { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; background: #000; color: white; -webkit-font-smoothing: antialiased; }
    .hero-bg {
      background: radial-gradient(circle at 50% 0%, #2e1065 0%, #000 70%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 0 20px;
    }
    .badge {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.1);
      padding: 8px 16px;
      border-radius: 100px;
      font-size: 14px;
      margin-bottom: 24px;
      color: #c4b5fd;
      display: inline-block;
    }
    h1 { font-size: 80px; font-weight: 800; letter-spacing: -2px; line-height: 1.1; margin: 0 0 24px 0; background: linear-gradient(to right, #fff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    p { font-size: 20px; color: #94a3b8; max-width: 600px; margin: 0 auto 40px auto; line-height: 1.6; }
    .btn { padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; cursor: pointer; border: none; transition: transform 0.2s; }
    .btn-primary { background: #6366f1; color: white; box-shadow: 0 0 30px rgba(99,102,241,0.4); }
    .btn-primary:hover { transform: scale(1.05); }
  </style>
</head>
<body>
  <div class="hero-bg">
    <div class="badge">Nexus AI 2.0</div>
    <h1>Design at the<br>speed of thought.</h1>
    <p>The first visual editor that understands your intent. Built for high-performance teams who demand perfection.</p>
    <div>
      <button class="btn btn-primary">Start Building Free</button>
    </div>
  </div>
</body>
</html>
`;

interface DashboardViewProps {
  projects: Project[];
  onOpenProject: (p: Project) => void;
  onCreateNew: (html: string) => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
  isLoading: boolean;
  syncStatus?: 'local' | 'synced' | 'error';
}

export const DashboardView: React.FC<DashboardViewProps> = ({ projects, onOpenProject, onCreateNew, onDeleteProject, isLoading, syncStatus }) => {
  const [showCreationFlow, setShowCreationFlow] = useState(false);

  if (showCreationFlow) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center animate-fadeIn relative p-12 bg-grid-tech">
        <button onClick={() => setShowCreationFlow(false)} className="absolute top-12 left-12 text-zinc-500 hover:text-white transition-colors flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]">
          <i className="fa-solid fa-arrow-left"></i> Voltar ao Dashboard
        </button>
        <div className="max-w-4xl w-full z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="col-span-1 md:col-span-2 text-center mb-12">
            <h1 className="text-7xl font-extrabold tracking-tighter mb-4 text-white">Start your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">masterpiece.</span></h1>
            <p className="text-zinc-500 text-xl font-medium">Inicie com um blueprint ou cole seu código.</p>
          </div>
          <button 
            onClick={() => onCreateNew(DEMO_HTML)}
            className="group relative h-80 bg-[#0a0a0a] rounded-[40px] border border-white/10 hover:border-indigo-500/50 transition-all overflow-hidden flex flex-col items-center justify-center shadow-2xl active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-20 h-20 rounded-3xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-bolt text-4xl"></i>
            </div>
            <span className="text-2xl font-bold text-white">SaaS Template</span>
          </button>
          <div className="h-80 bg-[#0a0a0a] rounded-[40px] border border-white/10 p-10 flex flex-col shadow-2xl">
            <textarea 
              id="manual-input-v3"
              className="flex-1 bg-black/40 rounded-2xl border border-white/5 p-6 text-[11px] font-mono text-zinc-400 resize-none outline-none focus:border-indigo-500/50 transition-all"
              placeholder="Cole seu <html> aqui..."
            ></textarea>
            <button 
              onClick={() => {
                const val = (document.getElementById('manual-input-v3') as HTMLTextAreaElement).value;
                if(val) onCreateNew(val);
              }}
              className="mt-6 py-4 bg-white/5 hover:bg-white text-zinc-400 hover:text-black rounded-2xl font-bold transition-all"
            >
              Launch Project
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-12 overflow-y-auto bg-grid-tech">
      <div className="max-w-7xl mx-auto w-full animate-fadeIn">
        <div className="flex justify-between items-end mb-16">
          <div>
            <h1 className="text-5xl font-extrabold tracking-tighter text-white mb-2">Nexus Workspace</h1>
            <div className="flex items-center gap-3">
               <div className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`}></div>
               <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">
                 {syncStatus === 'synced' ? 'Cloud Synced' : syncStatus === 'error' ? 'Cloud Offline (Local Mode)' : 'Syncing...'}
               </p>
            </div>
          </div>
          <button onClick={() => setShowCreationFlow(true)} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-2xl transition-all active:scale-95">
            <i className="fa-solid fa-plus mr-2"></i> Criar Novo Site
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map(p => (
            <div key={p.id} className="group glass-panel rounded-[32px] border border-white/5 overflow-hidden hover:border-indigo-500/50 transition-all cursor-pointer relative bg-zinc-900/20" onClick={() => onOpenProject(p)}>
              <div className="aspect-video bg-zinc-950 flex items-center justify-center relative">
                <i className="fa-solid fa-code text-4xl opacity-10"></i>
                <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 rounded-full text-[9px] font-bold text-zinc-400 border border-white/10">
                   {p.subdomain}.nexus.ai
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-xl font-bold text-white mb-6">{p.name}</h3>
                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest"><i className="fa-regular fa-calendar mr-2"></i> {new Date(p.lastUpdated).toLocaleDateString()}</span>
                  <button onClick={(e) => onDeleteProject(p.id, e)} className="text-zinc-600 hover:text-red-500 transition-colors">
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
          {projects.length === 0 && !isLoading && (
            <div className="col-span-full py-40 border border-dashed border-white/10 rounded-[40px] flex flex-col items-center justify-center text-zinc-600">
               <p className="text-xl font-bold">Workspace vazio</p>
               <span className="text-sm mt-2">Clique em "Criar Novo Site" para começar.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
