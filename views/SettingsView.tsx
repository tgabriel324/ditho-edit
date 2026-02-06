
import React, { useState } from 'react';
import { Project } from '../types.ts';

interface SettingsViewProps {
  activeProject: Project;
  onUpdateProject: (p: Project) => void;
  onDeleteProject: (id: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ activeProject, onUpdateProject, onDeleteProject }) => {
  const [name, setName] = useState(activeProject.name);
  const [subdomain, setSubdomain] = useState(activeProject.subdomain);

  const handleSave = () => {
    onUpdateProject({ ...activeProject, name, subdomain });
    alert("Configurações atualizadas!");
  };

  return (
    <div className="flex-1 p-12 overflow-y-auto bg-grid-tech animate-fadeIn">
      <div className="max-w-3xl mx-auto">
        <header className="mb-16">
          <h1 className="text-5xl font-extrabold tracking-tighter text-white mb-2">Project Settings</h1>
          <p className="text-zinc-500 font-medium uppercase tracking-widest text-[10px]">Configurações técnicas e de domínio</p>
        </header>

        <div className="space-y-12">
          {/* Informações Básicas */}
          <section className="glass-panel p-10 rounded-[40px] border-white/5">
             <h3 className="text-xl font-bold text-white mb-8">General Information</h3>
             <div className="space-y-6">
                <div>
                   <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3 block">Project Name</label>
                   <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white outline-none focus:border-indigo-500 transition-colors"
                   />
                </div>
                <div>
                   <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3 block">Subdomain (.nexus.ai)</label>
                   <div className="flex items-center bg-black/40 border border-white/10 rounded-2xl p-5 focus-within:border-indigo-500 transition-colors">
                      <input 
                        type="text" 
                        value={subdomain} 
                        onChange={e => setSubdomain(e.target.value.toLowerCase().replace(/\s/g, '-'))}
                        className="bg-transparent border-none outline-none text-white flex-1"
                      />
                      <span className="text-zinc-600 font-bold">.nexus.ai</span>
                   </div>
                </div>
             </div>
          </section>

          {/* Domínio Customizado */}
          <section className="glass-panel p-10 rounded-[40px] border-white/5 opacity-50 relative overflow-hidden">
             <div className="absolute top-4 right-10 px-3 py-1 bg-indigo-600 text-white text-[8px] font-bold uppercase rounded-full">Pro Feature</div>
             <h3 className="text-xl font-bold text-white mb-4">Custom Domain</h3>
             <p className="text-zinc-500 text-sm mb-8">Conecte seu próprio domínio (ex: www.suaempresa.com.br)</p>
             <button disabled className="w-full py-5 border border-white/10 rounded-2xl text-zinc-500 font-bold text-xs uppercase tracking-widest">
                Configure Custom Domain
             </button>
          </section>

          {/* Ações de Perigo */}
          <section className="p-10 rounded-[40px] border border-red-500/10 bg-red-500/5">
             <h3 className="text-xl font-bold text-red-500 mb-4">Danger Zone</h3>
             <p className="text-zinc-500 text-sm mb-8">Once deleted, your site and all its history will be permanently gone.</p>
             <button 
               onClick={() => { if(confirm("Tem certeza? Esta ação é irreversível.")) onDeleteProject(activeProject.id); }}
               className="px-8 py-4 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white font-bold rounded-2xl transition-all"
             >
                Delete Project
             </button>
          </section>

          <div className="pt-8 border-t border-white/5 flex justify-end">
             <button onClick={handleSave} className="px-12 py-5 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-all shadow-2xl">
                Save Settings
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
