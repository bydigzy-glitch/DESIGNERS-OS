import React, { useState } from 'react';
import { analyzeVideoConcept } from '../services/geminiService';
import { Play, TrendingUp, Hash, Quote, Sparkles } from 'lucide-react';

export const ContentLab: React.FC = () => {
  const [concept, setConcept] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      const data = await analyzeVideoConcept(concept);
      setResult(data);
    } catch (error) {
      console.error(error);
      setResult("Simulation failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full">
       
       <div className="flex items-center gap-3 mb-2">
         <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-900/20">
            <Sparkles size={24} />
         </div>
         <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Content Lab</h1>
            <p className="text-text-secondary text-sm">Predict content performance before you post.</p>
         </div>
       </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
        
        {/* INPUT SECTION */}
        <div className="flex flex-col gap-6">
          <div className="bg-card-bg border border-gray-800 rounded-4xl p-6 flex-1 flex flex-col shadow-xl">
            <label className="text-sm font-medium text-text-secondary mb-4 block">
              Describe your video concept
            </label>
            <textarea
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="e.g. Fast paced cut of hoodie details, beat drop at 3s, text overlay saying 'Sold Out'"
              className="flex-1 w-full bg-app-bg border border-gray-800 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue resize-none mb-6 placeholder:text-gray-700 transition-all"
            />
            
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !concept.trim()}
              className={`w-full py-4 rounded-full font-bold flex items-center justify-center gap-2 transition-all shadow-lg
                ${isAnalyzing 
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                  : 'bg-white text-black hover:bg-gray-200'
                }
              `}
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Play size={18} fill="currentColor" />
                  Run Simulation
                </>
              )}
            </button>
          </div>
        </div>

        {/* OUTPUT SECTION */}
        <div className="bg-card-bg border border-gray-800 rounded-4xl p-6 relative overflow-hidden min-h-[400px] flex flex-col shadow-xl">
           {!result && !isAnalyzing && (
             <div className="absolute inset-0 flex items-center justify-center flex-col text-gray-800 pointer-events-none">
                <TrendingUp size={64} strokeWidth={1} className="mb-4 opacity-20" />
                <span className="text-sm font-medium opacity-50">Waiting for input data...</span>
             </div>
           )}

           {isAnalyzing && (
             <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 bg-card-bg z-10">
                <div className="text-sm font-bold text-accent-blue animate-pulse">Calculating Viral Coefficient...</div>
                <div className="w-48 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                   <div className="h-full bg-accent-blue animate-progress rounded-full"></div>
                </div>
             </div>
           )}

           {result && !isAnalyzing && (
             <div className="flex-1 overflow-y-auto space-y-6 text-sm animate-in fade-in slide-in-from-bottom-4 duration-500 pr-2">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                   <div className="flex items-center gap-2 text-green-400">
                      <TrendingUp size={18} />
                      <span className="font-bold">Analysis Complete</span>
                   </div>
                   <span className="text-xs text-gray-500">AI Model v2.5</span>
                </div>
                
                <div className="whitespace-pre-wrap leading-relaxed text-gray-300">
                   {result}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                   <div className="p-4 rounded-2xl bg-gray-800/50 border border-gray-700/50">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-2">
                        <Quote size={12} /> CAPTIONS
                      </div>
                      <div className="h-1.5 w-12 bg-gray-700 rounded-full"></div>
                   </div>
                   <div className="p-4 rounded-2xl bg-gray-800/50 border border-gray-700/50">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-2">
                        <Hash size={12} /> TAGS
                      </div>
                      <div className="h-1.5 w-12 bg-gray-700 rounded-full"></div>
                   </div>
                </div>
             </div>
           )}
        </div>

      </div>
    </div>
  );
};