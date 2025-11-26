import React, { useState, useRef } from 'react';
import { analyzeVideoConcept, generateMockup, extendImage } from '../services/geminiService';
import { Play, TrendingUp, Hash, Quote, Sparkles, ArrowLeft, Shirt, UploadCloud, Layers, Wand2, MonitorPlay, Download, Maximize2, Image as ImageIcon, Check } from 'lucide-react';

type AppId = 'HUB' | 'CONTENT_LAB' | 'MOCKUP_STUDIO' | 'IMAGE_RESIZER';

export const Apps: React.FC = () => {
  const [currentApp, setCurrentApp] = useState<AppId>('HUB');

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 md:p-8 max-w-7xl mx-auto w-full">
      
      {/* Header / Breadcrumbs */}
      <div className="flex items-center gap-3 mb-8">
        {currentApp !== 'HUB' && (
             <button 
               onClick={() => setCurrentApp('HUB')}
               className="p-2 bg-white/5 border border-gray-800 rounded-xl hover:bg-white/10 transition-colors"
             >
                <ArrowLeft size={20} />
             </button>
        )}
        <div>
           <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              {currentApp === 'HUB' && 'Designpreneur Apps'}
              {currentApp === 'CONTENT_LAB' && 'Content Lab'}
              {currentApp === 'MOCKUP_STUDIO' && 'Mockup Studio'}
              {currentApp === 'IMAGE_RESIZER' && 'Generative Fill'}
           </h1>
           <p className="text-text-secondary text-sm">
              {currentApp === 'HUB' && 'AI-powered tools to accelerate your brand.'}
              {currentApp === 'CONTENT_LAB' && 'Predict viral performance.'}
              {currentApp === 'MOCKUP_STUDIO' && 'AI Virtual Try-On & Merging.'}
              {currentApp === 'IMAGE_RESIZER' && 'Resize & Extend images with Nano Banana.'}
           </p>
        </div>
      </div>

      {currentApp === 'HUB' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-500">
              {/* Content Lab Card */}
              <button 
                onClick={() => setCurrentApp('CONTENT_LAB')}
                className="group relative bg-[#1C1C1E] border border-gray-800 rounded-[2.5rem] p-8 text-left hover:border-accent-blue/50 transition-all shadow-xl overflow-hidden"
              >
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                      <TrendingUp size={120} />
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-900/30">
                      <MonitorPlay className="text-white" size={28} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Content Lab</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                      Analyze video concepts, generate viral hooks, and predict retention scores before you post.
                  </p>
              </button>

              {/* Mockup Studio Card */}
              <button 
                onClick={() => setCurrentApp('MOCKUP_STUDIO')}
                className="group relative bg-[#1C1C1E] border border-gray-800 rounded-[2.5rem] p-8 text-left hover:border-accent-blue/50 transition-all shadow-xl overflow-hidden"
              >
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Shirt size={120} />
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-900/30">
                      <Layers className="text-white" size={28} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Mockup Studio</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                      Upload a model and your clothing design. AI merges them for a realistic virtual photoshoot.
                  </p>
              </button>

              {/* Image Resizer Card */}
              <button 
                onClick={() => setCurrentApp('IMAGE_RESIZER')}
                className="group relative bg-[#1C1C1E] border border-gray-800 rounded-[2.5rem] p-8 text-left hover:border-accent-blue/50 transition-all shadow-xl overflow-hidden"
              >
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Maximize2 size={120} />
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-900/30">
                      <ImageIcon className="text-white" size={28} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Generative Fill</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                      Extend images to any aspect ratio (9:16, 16:9, etc.) using Nano Banana generative AI.
                  </p>
              </button>
          </div>
      )}

      {currentApp === 'CONTENT_LAB' && <ContentLabView />}
      {currentApp === 'MOCKUP_STUDIO' && <MockupStudioView />}
      {currentApp === 'IMAGE_RESIZER' && <ImageResizerView />}

    </div>
  );
};

// --- SUB-COMPONENT: CONTENT LAB ---
const ContentLabView: React.FC = () => {
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full animate-in fade-in slide-in-from-right-8 duration-500">
          <div className="flex flex-col gap-6">
            <div className="bg-card-bg border border-gray-800 rounded-[2rem] p-6 flex-1 flex flex-col shadow-xl">
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
                  ${isAnalyzing ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-white text-black hover:bg-gray-200'}`}
              >
                {isAnalyzing ? 'Analyzing...' : <><Play size={18} fill="currentColor" /> Run Simulation</>}
              </button>
            </div>
          </div>
  
          <div className="bg-card-bg border border-gray-800 rounded-[2rem] p-6 relative overflow-hidden min-h-[400px] flex flex-col shadow-xl">
             {!result && !isAnalyzing && (
               <div className="absolute inset-0 flex items-center justify-center flex-col text-gray-800 pointer-events-none">
                  <TrendingUp size={64} strokeWidth={1} className="mb-4 opacity-20" />
                  <span className="text-sm font-medium opacity-50">Waiting for input data...</span>
               </div>
             )}
             {isAnalyzing && (
               <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 bg-card-bg z-10">
                  <div className="text-sm font-bold text-accent-blue animate-pulse">Calculating Viral Coefficient...</div>
                  <div className="w-48 h-1.5 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-accent-blue animate-progress rounded-full"></div></div>
               </div>
             )}
             {result && !isAnalyzing && (
               <div className="flex-1 overflow-y-auto space-y-6 text-sm animate-in fade-in slide-in-from-bottom-4 duration-500 pr-2">
                  <div className="whitespace-pre-wrap leading-relaxed text-gray-300">{result}</div>
                  <div className="grid grid-cols-2 gap-3 pt-4">
                     <div className="p-4 rounded-2xl bg-gray-800/50 border border-gray-700/50">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-2"><Quote size={12} /> CAPTIONS</div>
                        <div className="h-1.5 w-12 bg-gray-700 rounded-full"></div>
                     </div>
                     <div className="p-4 rounded-2xl bg-gray-800/50 border border-gray-700/50">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-2"><Hash size={12} /> TAGS</div>
                        <div className="h-1.5 w-12 bg-gray-700 rounded-full"></div>
                     </div>
                  </div>
               </div>
             )}
          </div>
        </div>
    );
};

// --- SUB-COMPONENT: MOCKUP STUDIO ---
const MockupStudioView: React.FC = () => {
    const [modelImage, setModelImage] = useState<string | null>(null);
    const [garmentImage, setGarmentImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const modelInputRef = useRef<HTMLInputElement>(null);
    const garmentInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'MODEL' | 'GARMENT') => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (type === 'MODEL') setModelImage(ev.target?.result as string);
                else setGarmentImage(ev.target?.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleGenerate = async () => {
        if (!modelImage || !garmentImage) return;
        setIsGenerating(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const result = await generateMockup(modelImage, garmentImage, prompt);
            setGeneratedImage(result);
        } catch (err) {
            console.error("Mockup Generation Error:", err);
            setError("Failed to generate image. Please try again with clear inputs.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        if (generatedImage) {
            const link = document.createElement('a');
            link.href = generatedImage;
            link.download = `mockup-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-right-8 duration-500">
            
            {/* Left Column: Inputs */}
            <div className="lg:col-span-4 space-y-6">
                {/* Step 1: Model */}
                <div className="bg-[#1C1C1E] border border-gray-800 rounded-[2rem] p-6 shadow-xl">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">1. Base Model</h3>
                        {modelImage && <button onClick={() => setModelImage(null)} className="text-xs text-red-400 hover:underline">Remove</button>}
                    </div>
                    <div 
                        onClick={() => !modelImage && modelInputRef.current?.click()}
                        className={`
                            w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-gray-800 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all
                            ${!modelImage ? 'hover:border-accent-blue hover:bg-white/5' : 'border-none'}
                        `}
                    >
                        {modelImage ? (
                            <img src={modelImage} alt="Model" className="w-full h-full object-cover" />
                        ) : (
                            <>
                                <UploadCloud className="text-gray-600 mb-2" />
                                <span className="text-xs text-gray-500 font-bold">Upload Model</span>
                            </>
                        )}
                        <input type="file" ref={modelInputRef} onChange={(e) => handleUpload(e, 'MODEL')} className="hidden" accept="image/*" />
                    </div>
                </div>

                {/* Step 2: Garment */}
                <div className="bg-[#1C1C1E] border border-gray-800 rounded-[2rem] p-6 shadow-xl">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">2. Garment Design</h3>
                        {garmentImage && <button onClick={() => setGarmentImage(null)} className="text-xs text-red-400 hover:underline">Remove</button>}
                    </div>
                    <div 
                        onClick={() => !garmentImage && garmentInputRef.current?.click()}
                        className={`
                            w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-gray-800 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all
                            ${!garmentImage ? 'hover:border-accent-blue hover:bg-white/5' : 'border-none'}
                        `}
                    >
                        {garmentImage ? (
                            <img src={garmentImage} alt="Garment" className="w-full h-full object-cover" />
                        ) : (
                            <>
                                <Shirt className="text-gray-600 mb-2" />
                                <span className="text-xs text-gray-500 font-bold">Upload Design</span>
                            </>
                        )}
                         <input type="file" ref={garmentInputRef} onChange={(e) => handleUpload(e, 'GARMENT')} className="hidden" accept="image/*" />
                    </div>
                </div>
            </div>

            {/* Right Column: Controls & Result */}
            <div className="lg:col-span-8 flex flex-col gap-6">
                 {/* Prompt & Action */}
                 <div className="bg-[#1C1C1E] border border-gray-800 rounded-[2rem] p-6 shadow-xl">
                    <label className="text-sm font-medium text-text-secondary mb-3 block">
                        Direct the AI (Optional)
                    </label>
                    <div className="flex gap-4">
                        <input 
                            type="text" 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Ex: Realistic draping, vintage film grain, studio lighting..."
                            className="flex-1 bg-[#141416] border border-gray-800 rounded-xl px-4 text-white focus:outline-none focus:border-accent-blue"
                        />
                        <button 
                            onClick={handleGenerate}
                            disabled={!modelImage || !garmentImage || isGenerating}
                            className={`px-8 rounded-xl font-bold flex items-center gap-2 transition-all
                                ${!modelImage || !garmentImage || isGenerating 
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                                    : 'bg-white text-black hover:bg-gray-200 shadow-lg shadow-white/10'}
                            `}
                        >
                            {isGenerating ? 'Merging...' : <><Wand2 size={18} /> Generate</>}
                        </button>
                    </div>
                    {error && <div className="mt-2 text-xs text-red-400 font-bold">{error}</div>}
                 </div>

                 {/* Result Area */}
                 <div className="flex-1 bg-[#141416] border border-gray-800 rounded-[2.5rem] relative overflow-hidden flex items-center justify-center shadow-2xl min-h-[500px]">
                    {!generatedImage && !isGenerating && (
                        <div className="text-center opacity-30">
                            <Sparkles size={48} className="mx-auto mb-4" />
                            <p className="font-bold">Ready to Create</p>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative w-24 h-24">
                                <div className="absolute inset-0 border-4 border-gray-800 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-t-accent-blue border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                            </div>
                            <div className="text-sm font-bold text-accent-blue animate-pulse">Running Diffusion Model...</div>
                        </div>
                    )}

                    {generatedImage && !isGenerating && (
                        <div className="relative w-full h-full group">
                            <img src={generatedImage} alt="Generated Mockup" className="w-full h-full object-contain p-4" />
                            <div className="absolute bottom-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={handleDownload} className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2">
                                    <Download size={14} /> Download
                                </button>
                                {/* Future feature: Save to assets */}
                                {/* <button className="bg-black/50 text-white backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold border border-white/10">Save to Assets</button> */}
                            </div>
                        </div>
                    )}
                 </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: IMAGE RESIZER (GENERATIVE FILL) ---
const ImageResizerView: React.FC = () => {
    const [baseImage, setBaseImage] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState<string>("9:16");
    const [isGenerating, setIsGenerating] = useState(false);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const RATIOS = ["1:1", "3:4", "4:3", "9:16", "16:9"];

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setBaseImage(ev.target?.result as string);
                setResultImage(null);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleGenerate = async () => {
        if (!baseImage) return;
        setIsGenerating(true);
        setError(null);
        setResultImage(null);

        try {
            const result = await extendImage(baseImage, aspectRatio, "Make it photorealistic and seamless.");
            setResultImage(result);
        } catch (err) {
            console.error("Generative Fill Error:", err);
            setError("Failed to extend image. Try a different aspect ratio or image.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        if (resultImage) {
            const link = document.createElement('a');
            link.href = resultImage;
            link.download = `extended-${aspectRatio.replace(':','-')}-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-right-8 duration-500">
             {/* Left Column: Input & Controls */}
             <div className="lg:col-span-4 space-y-6">
                 {/* Upload */}
                 <div className="bg-[#1C1C1E] border border-gray-800 rounded-[2rem] p-6 shadow-xl">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Source Image</h3>
                        {baseImage && <button onClick={() => setBaseImage(null)} className="text-xs text-red-400 hover:underline">Remove</button>}
                    </div>
                    <div 
                        onClick={() => !baseImage && fileInputRef.current?.click()}
                        className={`
                            w-full aspect-square rounded-2xl border-2 border-dashed border-gray-800 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all
                            ${!baseImage ? 'hover:border-emerald-500 hover:bg-white/5' : 'border-none'}
                        `}
                    >
                        {baseImage ? (
                            <img src={baseImage} alt="Base" className="w-full h-full object-contain" />
                        ) : (
                            <>
                                <UploadCloud className="text-gray-600 mb-2" />
                                <span className="text-xs text-gray-500 font-bold">Upload Image</span>
                            </>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*" />
                    </div>
                </div>

                {/* Aspect Ratio Selection */}
                <div className="bg-[#1C1C1E] border border-gray-800 rounded-[2rem] p-6 shadow-xl">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Target Aspect Ratio</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {RATIOS.map(r => (
                            <button
                                key={r}
                                onClick={() => setAspectRatio(r)}
                                className={`py-3 rounded-xl text-sm font-bold border transition-all
                                    ${aspectRatio === r 
                                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/50' 
                                        : 'bg-[#141416] border-gray-800 text-gray-500 hover:border-gray-600 hover:text-white'}
                                `}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Generate Button */}
                 <button 
                    onClick={handleGenerate}
                    disabled={!baseImage || isGenerating}
                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl
                        ${!baseImage || isGenerating 
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                            : 'bg-white text-black hover:bg-gray-200 shadow-emerald-900/20'}
                    `}
                >
                    {isGenerating ? 'Extending...' : <><Maximize2 size={18} /> Generative Fill</>}
                </button>
                {error && <div className="text-center text-xs text-red-400 font-bold">{error}</div>}
             </div>

             {/* Right Column: Result */}
             <div className="lg:col-span-8">
                 <div className="bg-[#141416] border border-gray-800 rounded-[2.5rem] relative overflow-hidden flex items-center justify-center shadow-2xl h-[600px] w-full">
                    {!resultImage && !isGenerating && (
                        <div className="text-center opacity-30">
                            <ImageIcon size={48} className="mx-auto mb-4" />
                            <p className="font-bold">Select image & ratio to start</p>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative w-24 h-24">
                                <div className="absolute inset-0 border-4 border-gray-800 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                            </div>
                            <div className="text-sm font-bold text-emerald-500 animate-pulse">Running Nano Banana Fill...</div>
                        </div>
                    )}

                    {resultImage && !isGenerating && (
                        <div className="relative w-full h-full group flex items-center justify-center bg-black/50">
                            <img src={resultImage} alt="Extended Result" className="max-w-full max-h-full object-contain p-4" />
                            <div className="absolute bottom-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={handleDownload} className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2">
                                    <Download size={14} /> Download
                                </button>
                            </div>
                        </div>
                    )}
                 </div>
             </div>
        </div>
    );
};