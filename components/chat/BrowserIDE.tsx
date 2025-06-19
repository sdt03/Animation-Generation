"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Code, 
  Eye, 
  Play, 
  Copy, 
  Download, 
  RefreshCw,
  FileCode,
  Monitor 
} from "lucide-react";

interface BrowserIDEProps {
  code: string;
  onCodeChange: (code: string) => void;
}

export const BrowserIDE = ({ code, onCodeChange }: BrowserIDEProps) => {
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");
  const [editableCode, setEditableCode] = useState(code);
  const [isRunning, setIsRunning] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [detectedLanguage, setDetectedLanguage] = useState("");

  // Update editable code and language when prop changes
  useEffect(() => {
    // Remove markdown code fences if present and extract language
    let cleaned = code;
    let language = "";
    const match = cleaned.match(/^```([a-zA-Z0-9_-]*)\n/);
    if (match) {
      language = match[1];
      cleaned = cleaned.replace(/^```[a-zA-Z0-9_-]*\n/, "");
      cleaned = cleaned.replace(/```\s*$/, "");
    } else {
      // Remove just triple backticks if present
      cleaned = cleaned.replace(/^```\n/, "");
      cleaned = cleaned.replace(/```\s*$/, "");
    }
    setEditableCode(cleaned);
    setDetectedLanguage(language);
  }, [code]);

  // Auto-run preview when code changes
  useEffect(() => {
    if (activeTab === "preview" && editableCode) {
      runCode();
    }
  }, [editableCode, activeTab]);

  const runCode = () => {
    if (!editableCode.trim()) return;

    setIsRunning(true);
    
    // Create HTML document with the code
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: system-ui, -apple-system, sans-serif;
            background: #1a1a1a;
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            width: 100%;
            max-width: 800px;
            text-align: center;
          }
          .error {
            color: #ef4444;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            padding: 16px;
            border-radius: 8px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <script>
            try {
              ${editableCode}
            } catch (error) {
              document.body.innerHTML = '<div class="error"><h3>Error:</h3><p>' + error.message + '</p></div>';
              console.error('Execution error:', error);
            }
          </script>
        </div>
      </body>
      </html>
    `;

    // Write to iframe
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();
      }
    }

    setTimeout(() => setIsRunning(false), 500);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(editableCode);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const downloadCode = () => {
    const blob = new Blob([editableCode], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated-code.js";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCodeChange = (newCode: string) => {
    setEditableCode(newCode);
    onCodeChange(newCode);
  };

  return (
    <div
      className="flex flex-col bg-zinc-900 mt-4 mb-4 mx-4 rounded-lg border border-zinc-700"
      style={{ height: "calc(100vh - 2rem)" }}
    >
      {/* Header with Tabs */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-700 bg-zinc-800">
        <div className="flex items-center space-x-1 bg-zinc-700 rounded-full p-1">
          <Button
            variant={activeTab === "code" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("code")}
            className={`${
              activeTab === "code"
                ? "bg-blue-600 text-white rounded-full"
                : "text-zinc-400 hover:text-white rounded-full"
            }`}
          >
            <FileCode className="w-4 h-4 mr-2" />
            Code
          </Button>
          <Button
            variant={activeTab === "preview" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("preview")}
            className={`${
              activeTab === "preview"
                ? "bg-blue-600 text-white rounded-full"
                : "text-zinc-400 hover:text-white rounded-full"
            }`}
          >
            <Monitor className="w-4 h-4 mr-2" />
            Preview
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {activeTab === "code" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyCode}
                className="text-zinc-400 hover:text-white"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadCode}
                className="text-zinc-400 hover:text-white"
              >
                <Download className="w-4 h-4" />
              </Button>
            </>
          )}
          {activeTab === "preview" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={runCode}
              disabled={isRunning}
              className="text-zinc-400 hover:text-white"
            >
              {isRunning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "code" ? (
          <div className="h-full flex flex-col flex-1 pt-1">
            {/* Show language if detected */}
            {detectedLanguage && (
              <div style={{ fontSize: '0.9em', color: '#aaa', marginBottom: 4, marginLeft: 8 }}>
                {detectedLanguage}
              </div>
            )}
            {editableCode ? (
              <>
                <style jsx global>{`
                  .ide-scrollbar-bg::-webkit-scrollbar {
                    width: 10px;
                  }
                  .ide-scrollbar-bg::-webkit-scrollbar-track {
                    background: #18181b;
                  }
                  .ide-scrollbar-bg::-webkit-scrollbar-thumb {
                    background: #3f3f46;
                    border-radius: 4px;
                  }
                  .ide-scrollbar-bg::-webkit-scrollbar-thumb:hover {
                    background: #52525b;
                  }
                  .ide-scrollbar-bg {
                    scrollbar-width: thin;
                    scrollbar-color: #3f3f46 #18181b;
                  }
                `}</style>
                <Textarea
                  value={editableCode}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="flex-1 min-h-0 w-full resize-none border-0 text-white font-mono text-sm focus:ring-0 focus:outline-none rounded-none ide-scrollbar-bg"
                  placeholder="Generated code will appear here..."
                  style={{ height: '100%' }}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-500">
                <div className="text-center">
                  <Code className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Code Generated</h3>
                  <p className="text-sm">
                    Send a message in the chat to generate code
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {editableCode ? (
              <div className="flex-1 bg-zinc-800 rounded-lg m-2">
                <iframe
                  ref={iframeRef}
                  className="w-full h-full rounded-lg"
                  title="Code Preview"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-500">
                <div className="text-center">
                  <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Preview Available</h3>
                  <p className="text-sm">
                    Generate some code first to see the preview
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-zinc-700 bg-zinc-800 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>
            {activeTab === "code" ? "Code Editor" : "Live Preview"}
          </span>
          {editableCode && (
            <span>
              {editableCode.split('\n').length} lines, {editableCode.length} characters
            </span>
          )}
        </div>
      </div>
    </div>
  );
}; 