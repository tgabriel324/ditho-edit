
import React, { useState } from 'react';
import { Project } from '../types';

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
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 1200px; margin: 80px auto; padding: 0 20px; }
    .card { background: #0a0a0a; border: 1px solid #222; padding: 40px; border-radius: 24px; text-align: left; }
    .card:hover { border-color: #6366f1; }
    .icon { width: 48px; height: 48px; background: #111; border-radius: 12px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
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
  
  <div class="grid">
    <div class="card">
      <div class="icon">⚡️</div>
      <h3 style="font-size: 24px; margin: 0 0 10px 0;">Instant Deploy</h3>
      <p style="color: #666; font-size: 16px; margin: 0;">Push to production in seconds with our global edge network.</p>
    </div>
    <div class="card">
      <div class="icon">🛡️</div>
      <h3 style="font-size: 24px; margin: 0 0 10px 0;">Enterprise Safe</h3>
      <p style="color: #666; font-size: 16px; margin: 0;">SOC2 compliant security protocols built directly into the core.</p>
    </div>
    <div class="card">
      <div class="icon">🎨</div>
      <h3 style="font-size: 24px; margin: 0 0 10px 0;">Pixel Perfect</h3>
      <p style="color: #666; font-size: 16px; margin: 0;">What you see is exactly what you get. No layout shifts.</p>
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
}

export const DashboardView: React.FC<DashboardViewProps> = ({ projects, onOpenProject, onCreateNew, onDeleteProject, isLoading }) => {
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
            <p className="text-zinc-500 text-xl font-medium">Inicie com um blueprint otimizado ou cole seu código legado.</p>
          </div>
          <button 
            onClick={() => onCreateNew(DEMO_HTML)}
            className="group relative h-80 bg-[#0a0a0a] rounded-[40px] border border-white/10 hover:border-indigo-500/50 transition-all overflow-hidden flex flex-col items-center justify-center shadow-2xl active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-20 h-20 rounded-3xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-bolt text-4xl"></i>
            </div>
            <span className="text-2xl font-bold text-white">Launch SaaS Template</span>
            <span className="text-sm text-zinc-500 mt-2 font-medium">Layout validado de alta conversão</span>
          </button>
          <div className="h-80 bg-[#0a0a0a] rounded-[40px] border border-white/10 p-10 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                Custom HTML
              </span>
              <i className="fa-solid fa-code text-zinc-700"></i>
            </div>
            <textarea 
              id="manual-input-v2"
              className="flex-1 bg-black/40 rounded-2xl border border-white/5 p-6 text-[11px] font-mono text-zinc-400 resize-none outline-none focus:border-indigo-500/50 transition-all shadow-inner leading-relaxed"
              placeholder="Cole seu código <html> aqui..."
            ></textarea>
            <button 
              onClick={() => {
                const val = (document.getElementById('manual-input-v2') as HTMLTextAreaElement).value;
                if(val) onCreateNew(val);
              }}
              className="mt-6 py-4 bg-white/5 hover:bg-white text-zinc-400 hover:text-black rounded-2xl font-bold transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              Load Code <i className="fa-solid fa-arrow-right text-xs"></i>
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
            <h1 className="text-5xl font-extrabold tracking-tighter text-white mb-4">Bem-vindo, Designer</h1>
            <p className="text-zinc-500 text-lg">Seus projetos ativos e blueprints de alta conversão.</p>
          </div>
          <button 
            onClick={() => setShowCreationFlow(true)}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-2xl shadow-indigo-600/30 transition-all flex items-center gap-3 active:scale-95"
          >
            <i className="fa-solid fa-plus"></i> Novo Site
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            <div className="col-span-full py-40 flex flex-col items-center justify-center text-zinc-600">
               <i className="fa-solid fa-spinner fa-spin text-4xl mb-4 text-indigo-500"></i>
               <p className="font-bold">Sincronizando com a nuvem...</p>
            </div>
          ) : projects.length === 0 ? (
            <div onClick={() => setShowCreationFlow(true)} className="col-span-full py-40 border border-dashed border-white/10 rounded-[40px] flex flex-col items-center justify-center text-zinc-600 hover:border-indigo-500/50 hover:bg-white/5 cursor-pointer transition-all group">
              <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <i className="fa-regular fa-folder-open text-4xl"></i>
              </div>
              <p className="text-2xl font-bold text-zinc-400">Nenhum site criado ainda.</p>
              <span className="text-sm mt-2 text-zinc-600">Clique para iniciar sua primeira masterpiece.</span>
            </div>
          ) : (
            projects.map(p => (
              <div key={p.id} className="group glass-panel rounded-[32px] border border-white/5 overflow-hidden hover:border-indigo-500/50 transition-all cursor-pointer relative shadow-2xl bg-zinc-900/20" onClick={() => onOpenProject(p)}>
                <div className="aspect-video bg-zinc-950 relative flex items-center justify-center overflow-hidden">
                  <i className="fa-solid fa-image text-4xl opacity-5"></i>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <span className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xl">Abrir Editor</span>
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{p.name}</h3>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  </div>
                  <div className="text-xs text-zinc-500 font-mono mb-6 truncate">{p.subdomain}.nexus.ai</div>
                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest"><i className="fa-regular fa-clock mr-2"></i> {new Date(p.lastUpdated).toLocaleDateString()}</span>
                    <button onClick={(e) => onDeleteProject(p.id, e)} className="text-zinc-600 hover:text-red-500 transition-colors p-2">
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
