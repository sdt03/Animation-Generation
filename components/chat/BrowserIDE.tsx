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

  // Update editable code when prop changes
  useEffect(() => {
    setEditableCode(code);
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
    <div className="flex flex-col h-full bg-zinc-900 mt-4 mx-4 rounded-lg border border-zinc-700">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-700">
        <div className="flex items-center space-x-1">
          <Button
            variant={activeTab === "code" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("code")}
            className={`${
              activeTab === "code"
                ? "bg-blue-600 text-white"
                : "text-zinc-400 hover:text-white"
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
                ? "bg-blue-600 text-white"
                : "text-zinc-400 hover:text-white"
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
          <div className="h-full flex flex-col">
            {editableCode ? (
              <ScrollArea className="flex-1">
                <Textarea
                  value={editableCode}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="min-h-full w-full resize-none border-0 bg-zinc-800 text-white font-mono text-sm focus:ring-0 focus:outline-none rounded-none"
                  placeholder="Generated code will appear here..."
                />
              </ScrollArea>
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