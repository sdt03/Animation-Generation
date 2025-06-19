"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface BrowserIDEProps {
  code: string;
  onCodeChange: (code: string) => void;
  shouldStreamOnMount?: boolean;
}

export const BrowserIDE = ({ code, onCodeChange, shouldStreamOnMount = false }: BrowserIDEProps) => {
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");
  const [editableCode, setEditableCode] = useState(code);
  const [isRunning, setIsRunning] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [detectedLanguage, setDetectedLanguage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedCode, setStreamedCode] = useState("");
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [hasStreamed, setHasStreamed] = useState(false);

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
    // Only stream if shouldStreamOnMount is true and hasn't streamed yet
    if (shouldStreamOnMount && !hasStreamed) {
      setIsStreaming(true);
      setStreamedCode("");
      if (streamingTimeoutRef.current) clearTimeout(streamingTimeoutRef.current);
      let i = 0;
      function streamNext() {
        setStreamedCode(cleaned.slice(0, i + 1));
        if (i < cleaned.length - 1) {
          i++;
          streamingTimeoutRef.current = setTimeout(streamNext, 8 + Math.random() * 30);
        } else {
          setIsStreaming(false);
          setHasStreamed(true);
        }
      }
      if (cleaned.length > 0) {
        streamNext();
      } else {
        setIsStreaming(false);
        setHasStreamed(true);
      }
    } else {
      // No streaming, just set code instantly
      setStreamedCode(cleaned);
      setIsStreaming(false);
      setHasStreamed(true);
    }
    // Cleanup on unmount
    return () => {
      if (streamingTimeoutRef.current) clearTimeout(streamingTimeoutRef.current);
    };
  }, [code, shouldStreamOnMount]);

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
         <script src="https://cdn.example.com/manim.js"></script>
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

  // Use streamedCode for display if streaming, else editableCode
  const displayCode = isStreaming ? streamedCode : editableCode;

  return (
    <>
      <style jsx>{`
        textarea {
          color: transparent !important;
        }
        textarea::selection {
          background:rgb(48, 50, 55) !important;
        }
        .blinking-cursor {
          display: inline-block;
          width: 8px;
          height: 1.2em;
          background: #fff;
          margin-left: 2px;
          animation: blink 1s steps(1) infinite;
          vertical-align: bottom;
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
      <style jsx global>{`
        .ide-scrollbar-bg::-webkit-scrollbar {
          width: 10px;
        }
        .ide-scrollbar-bg::-webkit-scrollbar-track {
          background: #18181b;
        }
        .ide-scrollbar-bg::-webkit-scrollbar-thumb {
          background:rgb(56, 56, 61);
          border-radius: 4px;
        }
        .ide-scrollbar-bg::-webkit-scrollbar-thumb:hover {
          background:rgb(56, 56, 61);
        }
        .ide-scrollbar-bg {
          scrollbar-width: thin;
          scrollbar-color:rgb(56, 56, 61) #18181b;
        }
      `}</style>
      <div
        className="flex flex-col bg-zinc-900 mt-4 mb-4 mx-4 rounded-lg border border-zinc-700"
        style={{ height: "calc(100vh - 2rem)" }}
      >
        {/* Header with Tabs */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700 bg-zinc-800 rounded-t-lg">
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
              {displayCode ? (
                <div className="relative flex-1 min-h-0">
                  <div className="h-full w-full overflow-auto relative ide-scrollbar-bg" style={{ minHeight: 0 }}>
                    {/* Syntax Highlighted Code */}
                    <SyntaxHighlighter
                      language={detectedLanguage || "javascript"}
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        padding: 12,
                        minHeight: "100%",
                        background: "transparent",
                        pointerEvents: "none",
                        fontSize: "0.95em",
                        borderRadius: 0,
                        whiteSpace: "pre",
                      }}
                      wrapLines={true}
                      showLineNumbers={false}
                    >
                      {displayCode}
                    </SyntaxHighlighter>
                    {/* Editable Textarea */}
                    <Textarea
                      value={displayCode}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      className="absolute top-0 left-0 w-full h-full resize-none border-0 text-white font-mono text-sm focus:ring-0 focus:outline-none rounded-none ide-scrollbar-bg bg-transparent"
                      placeholder="Generated code will appear here..."
                      style={{
                        background: "transparent",
                        color: "transparent",
                        caretColor: "#fff",
                        minHeight: "100%",
                        padding: 12,
                        zIndex: 2,
                        whiteSpace: "pre",
                        overflow: "hidden",
                      }}
                      disabled={isStreaming}
                    />
                    {/* Blinking cursor overlay */}
                    {isStreaming && (
                      <span
                        className="blinking-cursor"
                        style={{ position: 'absolute', right: 16, bottom: 16 }}
                      />
                    )}
                  </div>
                </div>
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
    </>
  );
}; 