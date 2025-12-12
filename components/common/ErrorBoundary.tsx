
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-white p-6 text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-6 border border-red-500/20">
            <AlertTriangle size={40} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">System Malfunction</h1>
          <p className="text-gray-400 max-w-md mb-8 text-sm">
            The application encountered a critical error during execution.
          </p>
          
          <div className="bg-black/30 border border-white/10 rounded-xl p-4 mb-8 max-w-lg w-full text-left overflow-auto max-h-40">
             <code className="text-xs font-mono text-red-400">
               {this.state.error?.toString()}
             </code>
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
          >
            <RefreshCcw size={18} /> Reboot System
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
