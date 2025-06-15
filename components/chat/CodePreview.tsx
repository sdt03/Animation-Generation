'use client';

import { useState, useEffect } from 'react';
import { Code, Play, Copy, Download, Maximize2 } from 'lucide-react';

export default function CodePreview() {
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [streamedCode, setStreamedCode] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);


  useEffect(() => {
    // Simulate streaming code generation
    const streamCode = async () => {
      setIsStreaming(true);
      setStreamedCode('');
  
      setIsStreaming(false);
    };

    // Start streaming after component mounts
    const timer = setTimeout(streamCode, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-[97vh] flex flex-col bg-black pt-6 pl-6">
      {/* Header */}
      {/* Content */}
      <div className="flex-1 min-h-0 border border-slate-700 rounded-lg overflow-hidden">

      <div className="flex items-center justify-between p-1 border-b border-slate-700 flex-shrink-0">
      <div className="flex items-center gap-1 bg-slate-800 rounded-full">
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors text-sm ${
              activeTab === 'code'
                ? 'bg-blue-600 text-white m-1'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Code
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors text-sm ${
              activeTab === 'preview'
                ? 'bg-blue-600 text-white m-1'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            Preview
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-400 hover:text-white hover:bg-black rounded-lg transition-colors">
            <Copy className="w-4 h-4" />
          </button>
          <button className="p-2 text-slate-400 hover:text-white hover:bg-black rounded-lg transition-colors">
            <Download className="w-4 h-4" />
          </button>
          <button className="p-2 text-slate-400 hover:text-white hover:bg-black rounded-lg transition-colors">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
        
      {activeTab === 'code' ? (
          <div className="max-h-full flex flex-col overflow-hidden">
            <div className='text-sm text-slate-400 border-b border-slate-700 p-2 flex-shrink-0'>main.py</div>
            <div className="flex-1 overflow-auto min-h-0">
              <div className="pl-20 pt-6">
                <pre className="text-sm">
                  <code>
                    {streamedCode}
                    {isStreaming && <span className="streaming-cursor" />}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-auto">
            <div className="pl-20 pt-6">
              <div className="bg-slate-900 rounded-lg p-8 min-h-[400px]">
                <div className="max-w-md mx-auto">
                  <div className="bg-white rounded-lg p-6 shadow-lg">
                    <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">Todo App</h1>
                    
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        placeholder="Add a new todo..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Add
                      </button>
                    </div>

                    <div className="space-y-2">
                    </div>

                    <div className="mt-6 text-center text-sm text-gray-600">
                      Total: 3 | Completed: 1
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
