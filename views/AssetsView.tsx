
import React from 'react';
import { Project } from '../types.ts';

interface AssetsViewProps {
  activeProject: Project;
}

export const AssetsView: React.FC<AssetsViewProps> = ({ activeProject }) => {
  return (
    <div className="flex-1 p-12 overflow-y-auto bg-grid-tech animate-fadeIn">
      <div className="max-w-6xl mx-auto">
        <header className="mb-16">
          <h1 className="text-5xl font-extrabold tracking-tighter text-white mb-2">Media Library</h1>
          <p className="text-zinc-500 font-medium text-lg uppercase tracking-widest text-[10px]">Assets for {activeProject.name}</p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          <button className="aspect-square rounded-[32px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-zinc-600 hover:text-indigo-400 hover:border-indigo-500/50 transition-all group">
            <i className="fa-solid fa-cloud-arrow-up text-3xl mb-3 group-hover:scale-110 transition-transform"></i>
            <span className="text-[10px] font-bold uppercase tracking-widest">Upload Asset</span>
          </button>
          
          {/* Placeholder Assets */}
          {[1,2,3,4,5].map(i => (
            <div key={i} className="aspect-square rounded-[32px] glass-panel border border-white/5 overflow-hidden group relative cursor-pointer">
              <div className="absolute inset-0 bg-zinc-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                 <button className="w-10 h-10 bg-white rounded-full text-black flex items-center justify-center">
                    <i className="fa-solid fa-link text-xs"></i>
                 </button>
              </div>
              <img 
                src={`https://images.unsplash.com/photo-${1550745165 + i}-9bc0b252726f?auto=format&fit=crop&w=300`} 
                className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-all"
              />
            </div>
          ))}
        </div>
        
        <div className="mt-20 p-12 border border-white/5 rounded-[40px] bg-zinc-900/10 text-center">
           <i className="fa-solid fa-info-circle text-zinc-700 text-3xl mb-4"></i>
           <p className="text-zinc-500 text-sm max-w-md mx-auto">
             Your media library stores all images, icons and illustrations used in this project for quick access.
           </p>
        </div>
      </div>
    </div>
  );
};
