import { Code, Download, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../shared/ui/Button";

interface CodePreviewProps {
    code: string;
    filename: string;
    language?: string;
    onDownload?: () => void;
}

export function CodePreview({ 
    code, 
    filename, 
    language = 'python',
    onDownload 
}: CodePreviewProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleDownload = () => {
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        if (onDownload) {
            onDownload();
        }
    };

    const lineCount = code.split('\n').length;

    return (
        <div className="bg-surface border border-white/10 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-white/10 bg-background/50">
                <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-medium text-white">{filename}</span>
                    <span className="text-xs text-gray-500">
                        {lineCount} {lineCount === 1 ? 'line' : 'lines'}
                    </span>
                </div>
                
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopy}
                        className="text-xs"
                    >
                        {copied ? (
                            <>
                                <Check className="h-3 w-3 mr-1" />
                                Copied
                            </>
                        ) : (
                            <>
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                            </>
                        )}
                    </Button>
                    
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleDownload}
                        className="text-xs"
                    >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                    </Button>
                </div>
            </div>

            {/* Code Content */}
            <div className="relative">
                <pre className="p-4 overflow-x-auto bg-background text-sm">
                    <code className={`language-${language}`}>
                        {code.split('\n').map((line, i) => (
                            <div key={i} className="flex">
                                <span className="select-none text-gray-600 mr-4 text-right w-8 flex-shrink-0">
                                    {i + 1}
                                </span>
                                <span className="text-gray-200 flex-1">{line || ' '}</span>
                            </div>
                        ))}
                    </code>
                </pre>
            </div>

            {/* Footer Stats */}
            <div className="flex items-center gap-4 p-3 border-t border-white/10 bg-background/50 text-xs text-gray-500">
                <span>Language: {language}</span>
                <span>•</span>
                <span>Size: {new Blob([code]).size} bytes</span>
                <span>•</span>
                <span>Characters: {code.length}</span>
            </div>
        </div>
    );
}
