
import React, { useState } from 'react';
import { VisualCanvas } from '../components/VisualCanvas';
import { PropertiesPanel } from '../components/PropertiesPanel';
import { Project, ViewMode } from '../types';

interface EditorViewProps {
  activeProject: Project;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  zoom: number;
  setZoom: (z: number) => void;
  selectedElement: HTMLElement | null;
  selectedId: string | null;
  handleSelect: (el: HTMLElement) => void;
  updateTrigger: number;
  isAnalyzing: boolean;
  onSave: () => void;
  onUpdateProject: (updated: Project) => void;
  onForceUpdate: () => void;
  onVariableUpdate: (varName: string, newVal: string) => void;
  lastSaved?: string;
}

export const EditorView: React.FC<EditorViewProps> = ({
  activeProject, viewMode, setViewMode, zoom, setZoom,
  selectedElement, selectedId, handleSelect, updateTrigger,
  isAnalyzing, onSave, onForceUpdate, onVariableUpdate, lastSaved
}) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);

  const handlePublish = async () => {
    setIsPublishing(true);
    // Simulando tempo de deployment
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsPublishing(false);
    setShowPublishModal(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full animate-fadeIn relative">
      <header className="h-20 glass-panel border-b border-white/5 flex items-center justify-between px-10 shrink-0 shadow-2xl z-50">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <i className="fa-solid fa-file-signature"></i>
            </div>
            <div>
              <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-0.5">Editor Mode</div>
              <div className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                {activeProject.name}
                <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                <span className="text-[10px] text-zinc-500 font-mono font-normal">{activeProject.subdomain}.nexus.ai</span>
              </div>
            </div>
          </div>
          
          <div className="h-10 w-px bg-white/5"></div>
          
          <div className="flex gap-1.5 bg-black/40 p-1.5 rounded-xl border border-white/5 shadow-inner">
             {[
               { mode: ViewMode.DESKTOP, icon: 'fa-desktop' },
               { mode: ViewMode.TABLET, icon: 'fa-tablet-screen-button' },
               { mode: ViewMode.MOBILE, icon: 'fa-mobile-screen' }
             ].map((device) => (
                <button
                  key={device.mode}
                  onClick={() => setViewMode(device.mode)}
                  className={`w-11 h-10 rounded-lg flex items-center justify-center transition-all ${
                    viewMode === device.mode ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  <i className={`fa-solid ${device.icon} text-sm`}></i>
                </button>
             ))}
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 bg-black/30 px-5 py-2.5 rounded-xl border border-white/5">
             <i className="fa-solid fa-magnifying-glass text-[10px]"></i>
             <input type="range" min="0.5" max="1.5" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-28 accent-indigo-500" />
             <span className="text-white font-bold">{Math.round(zoom * 100)}%</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="hidden xl:flex flex-col items-end">
             <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Auto-Save Status</div>
             <div className="text-[10px] text-emerald-500 font-bold flex items-center gap-1.5">
               <i className="fa-solid fa-check-double text-[8px]"></i> {lastSaved ? `Synced ${lastSaved}` : 'Waiting changes...'}
             </div>
           </div>

           {isAnalyzing && (
              <div className="flex items-center gap-3 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl animate-pulse">
                 <i className="fa-solid fa-sparkles text-indigo-400 text-xs"></i>
                 <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">AI Core Active</span>
              </div>
           )}

           <div className="flex items-center gap-2">
              <button onClick={onSave} className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-400 hover:text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all active:scale-95">
                Save
              </button>
              <button 
                onClick={handlePublish}
                disabled={isPublishing}
                className={`px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center gap-2 ${
                  isPublishing ? 'bg-zinc-800 text-zinc-500' : 'bg-white text-black hover:bg-zinc-200'
                }`}
              >
                {isPublishing ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-rocket text-[10px]"></i>}
                {isPublishing ? 'Deploying...' : 'Publish'}
              </button>
           </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto bg-[#050505] relative flex flex-col items-center no-scrollbar bg-grid-tech">
           <VisualCanvas 
            initialHtml={activeProject.html} 
            cssVariables={activeProject.designSystem.variables}
            onSelectElement={handleSelect}
            selectedId={selectedId}
            triggerUpdate={updateTrigger}
            viewMode={viewMode}
            zoom={zoom}
          />
        </div>
        <PropertiesPanel 
          element={selectedElement} 
          designSystem={activeProject.designSystem}
          onUpdate={onForceUpdate}
          onUpdateVariable={onVariableUpdate}
        />
      </div>

      {/* Publish Success Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full glass-panel p-10 rounded-[40px] border-indigo-500/30 text-center shadow-[0_0_100px_rgba(99,102,241,0.2)]">
             <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-4xl mx-auto mb-8 shadow-2xl">
                <i className="fa-solid fa-circle-check"></i>
             </div>
             <h2 className="text-3xl font-extrabold text-white mb-2">Seu site está no ar!</h2>
             <p className="text-zinc-500 mb-8 font-medium">O deployment foi concluído com sucesso e seu site já está disponível globalmente.</p>
             
             <div className="bg-black/40 border border-white/10 rounded-2xl p-4 mb-8 flex items-center justify-between">
                <span className="text-xs font-mono text-indigo-400 truncate mr-4">{activeProject.subdomain}.nexus.ai</span>
                <button 
                  onClick={() => window.open(`https://${activeProject.subdomain}.nexus.ai`, '_blank')}
                  className="px-4 py-2 bg-indigo-500 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-indigo-400 transition-colors shrink-0"
                >
                  Visitar Site
                </button>
             </div>

             <button 
               onClick={() => setShowPublishModal(false)}
               className="w-full py-4 text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
             >
               Fechar e continuar editando
             </button>
          </div>
        </div>
      )}
    </div>
  );
};
