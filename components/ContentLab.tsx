
import React, { useState } from 'react';
import { analyzeVideoConcept } from '../services/geminiService';
import { Play, TrendingUp, Hash, Quote, Sparkles, Lock, Eye, Music, Zap, Brain, CheckCircle2 } from 'lucide-react';
import { FadeIn, CountUp } from './common/AnimatedComponents';

interface ContentLabProps {
    userTokens?: number;
    onUseToken?: (amount: number) => void;
}

export const ContentLab: React.FC<ContentLabProps> = ({ userTokens = 0, onUseToken }) => {
  const [concept, setConcept] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const TOKEN_COST = 0.20;
  const hasTokens = userTokens >= TOKEN_COST;

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim() || isAnalyzing) return;
    
    if (!hasTokens) {
        alert("Insufficient tokens.");
        return;
    }

    if (onUseToken) onUseToken(TOKEN_COST);

    setIsAnalyzing(true);
    try {
      // Prepend a directive to ensure structure for parsing
      const structuredPrompt = `Analyze this concept. Structure your response with these exact headers: ### SCORE (give a number 0-100), ### THE HOOK, ### VISUALS, ### AUDIO, ### VERDICT. Content: ${concept}`;
      const data = await analyzeVideoConcept(structuredPrompt);
      setResult(data);
    } catch (error) {
      console.error(error);
      setResult("Simulation failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper to extract content between headers
  const extractSection = (text: string, header: string, nextHeader?: string) => {
      const startIndex = text.indexOf(header);
      if (startIndex === -1) return null;
      
      const contentStart = startIndex + header.length;
      let contentEnd = text.length;
      
      if (nextHeader) {
          const nextIndex = text.indexOf(nextHeader, contentStart);
          if (nextIndex !== -1) contentEnd = nextIndex;
      } else {
          // If no next header, look for any next '###'
          const nextIndex = text.indexOf('###', contentStart);
          if (nextIndex !== -1) contentEnd = nextIndex;
      }
      
      return text.slice(contentStart, contentEnd).trim();
  };

  const parseResult = (text: string) => {
      if (!text) return null;
      const scoreStr = extractSection(text, '### SCORE');
      const score = scoreStr ? parseInt(scoreStr.replace(/[^0-9]/g, '')) || 85 : 0; // Fallback
      
      return {
          score: Math.min(100, Math.max(0, score)),
          hook: extractSection(text, '### THE HOOK'),
          visuals: extractSection(text, '### VISUALS'),
          audio: extractSection(text, '### AUDIO'),
          verdict: extractSection(text, '### VERDICT') || text // Fallback to full text if parsing fails totally
      };
  };

  const parsedData = result ? parseResult(result) : null;

  return (
    <FadeIn className="flex flex-col h-full overflow-y-auto p-6 md:p-8 space-y-8 max-w-6xl mx-auto w-full scrollbar-hide">
       
       <div className="flex items-center gap-4">
         <div className="p-4 rounded-3xl bg-gradient-to-br from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/20">
            <Sparkles size={28} />
         </div>
         <div>
            <h1 className="text-4xl font-bold text-foreground tracking-tight">Content Lab</h1>
            <p className="text-muted-foreground text-sm font-medium">Viral prediction engine v2.5</p>
         </div>
       </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        
        {/* INPUT SECTION */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-card border border-border rounded-[2rem] p-8 flex-1 flex flex-col shadow-soft h-full">
            <div className="flex items-center gap-2 mb-6">
                <Brain size={20} className="text-primary" />
                <h3 className="text-lg font-bold text-foreground">Input Concept</h3>
            </div>
            
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
              Video Description
            </label>
            <textarea
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Describe your video idea in detail...&#10;e.g. 'A 7-second looping video showing the texture of the hoodie, beat drops exactly when the logo is revealed. Text overlay says: Don't sleep on this drop.'"
              className="flex-1 w-full bg-secondary/30 border border-border rounded-2xl p-5 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none mb-6 placeholder:text-muted-foreground/50 transition-all leading-relaxed"
            />
            
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !concept.trim() || !hasTokens}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-glow
                ${isAnalyzing 
                  ? 'bg-secondary text-muted-foreground cursor-not-allowed' 
                  : (!hasTokens ? 'bg-secondary text-muted-foreground cursor-not-allowed' : 'bg-primary text-primary-foreground hover:scale-[1.02] active:scale-95')
                }
              `}
            >
              {isAnalyzing ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Running Simulation...</span>
                </>
              ) : !hasTokens ? (
                <>
                    <Lock size={18} /> Locked (Need {TOKEN_COST} Tokens)
                </>
              ) : (
                <>
                  <Play size={18} fill="currentColor" />
                  Predict Performance <span className="opacity-70 text-xs ml-1">({TOKEN_COST} Tokens)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* OUTPUT SECTION */}
        <div className="lg:col-span-7 flex flex-col gap-6">
           
           {!result && !isAnalyzing && (
             <div className="bg-card border border-border border-dashed rounded-[2rem] h-full flex flex-col items-center justify-center text-muted-foreground p-12 text-center opacity-50">
                <TrendingUp size={64} strokeWidth={1} className="mb-6 opacity-20" />
                <h3 className="text-lg font-bold mb-2">Ready to Simulate</h3>
                <p className="text-sm max-w-xs">Enter your concept to generate a viral coefficient score and actionable improvements.</p>
             </div>
           )}

           {isAnalyzing && (
             <div className="bg-card border border-border rounded-[2rem] h-full flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent animate-pulse"></div>
                <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="w-20 h-20 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <div className="text-center">
                        <div className="text-xl font-bold text-foreground mb-1">Analyzing Potential</div>
                        <div className="text-sm text-muted-foreground">Calculating retention hooks...</div>
                    </div>
                </div>
             </div>
           )}

           {result && parsedData && !isAnalyzing && (
             <FadeIn className="h-full flex flex-col gap-6">
                
                {/* Score Card */}
                <div className="bg-card border border-border rounded-[2rem] p-8 flex items-center justify-between shadow-soft relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-primary">
                            <Zap size={20} fill="currentColor" />
                            <span className="text-xs font-bold uppercase tracking-wider">Viral Score</span>
                        </div>
                        <div className="text-6xl font-bold text-foreground tracking-tighter">
                            <CountUp value={parsedData.score} duration={2} />
                            <span className="text-2xl text-muted-foreground font-medium">/100</span>
                        </div>
                    </div>
                    <div className="relative w-24 h-24 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-secondary" />
                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * parsedData.score) / 100} className="text-primary transition-all duration-1000 ease-out" />
                        </svg>
                        <div className="absolute text-2xl font-bold text-foreground">{parsedData.score}</div>
                    </div>
                </div>

                {/* Analysis Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                    {/* Hook */}
                    <div className="bg-secondary/30 border border-border p-6 rounded-[1.5rem] hover:bg-secondary/50 transition-colors">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl"><CheckCircle2 size={18} /></div>
                            <span className="font-bold text-foreground text-sm">The Hook</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{parsedData.hook || "Analysis pending..."}</p>
                    </div>

                    {/* Visuals */}
                    <div className="bg-secondary/30 border border-border p-6 rounded-[1.5rem] hover:bg-secondary/50 transition-colors">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl"><Eye size={18} /></div>
                            <span className="font-bold text-foreground text-sm">Visual Direction</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{parsedData.visuals || "Analysis pending..."}</p>
                    </div>

                    {/* Audio */}
                    <div className="bg-secondary/30 border border-border p-6 rounded-[1.5rem] hover:bg-secondary/50 transition-colors">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-pink-500/10 text-pink-500 rounded-xl"><Music size={18} /></div>
                            <span className="font-bold text-foreground text-sm">Audio Strategy</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{parsedData.audio || "Analysis pending..."}</p>
                    </div>

                    {/* Verdict */}
                    <div className="bg-secondary/30 border border-border p-6 rounded-[1.5rem] hover:bg-secondary/50 transition-colors">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-green-500/10 text-green-500 rounded-xl"><TrendingUp size={18} /></div>
                            <span className="font-bold text-foreground text-sm">Final Verdict</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{parsedData.verdict || "Analysis pending..."}</p>
                    </div>
                </div>

                {/* Tags & Captions Chips */}
                <div className="flex flex-wrap gap-2">
                    <div className="px-4 py-2 bg-card border border-border rounded-full text-xs font-bold text-muted-foreground flex items-center gap-2">
                        <Quote size={12} /> Generated Captions Available
                    </div>
                    <div className="px-4 py-2 bg-card border border-border rounded-full text-xs font-bold text-muted-foreground flex items-center gap-2">
                        <Hash size={12} /> Optimized Hashtags Ready
                    </div>
                </div>

             </FadeIn>
           )}
        </div>

      </div>
    </FadeIn>
  );
};
