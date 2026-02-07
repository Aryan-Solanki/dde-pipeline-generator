import { Check, X, Clock, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface ValidationHistoryEntry {
    timestamp: Date;
    version: number;
    valid: boolean;
    errorCount: number;
    warningCount: number;
    changes?: string[];
}

interface ValidationHistoryProps {
    history: ValidationHistoryEntry[];
    onSelectVersion?: (version: number) => void;
    className?: string;
}

export function ValidationHistory({ history, onSelectVersion, className = '' }: ValidationHistoryProps) {
    const [expanded, setExpanded] = useState(false);

    if (history.length === 0) {
        return null;
    }

    const latestEntry = history[history.length - 1];

    return (
        <div className={`bg-surface border border-white/10 rounded-lg ${className}`}>
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div className="text-left">
                        <h3 className="text-sm font-medium text-white">Validation History</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {history.length} iteration{history.length > 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                        latestEntry.valid 
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                    }`}>
                        {latestEntry.valid ? 'Valid' : 'Invalid'}
                    </span>
                    <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${
                        expanded ? 'rotate-90' : ''
                    }`} />
                </div>
            </button>

            {/* History List */}
            {expanded && (
                <div className="border-t border-white/10">
                    <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                        {history.slice().reverse().map((entry, idx) => {
                            const actualVersion = history.length - idx;
                            return (
                                <HistoryEntryCard
                                    key={actualVersion}
                                    entry={entry}
                                    version={actualVersion}
                                    isLatest={idx === 0}
                                    onSelect={onSelectVersion}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function HistoryEntryCard({ 
    entry, 
    version, 
    isLatest,
    onSelect 
}: { 
    entry: ValidationHistoryEntry;
    version: number;
    isLatest: boolean;
    onSelect?: (version: number) => void;
}) {
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    return (
        <div 
            onClick={() => onSelect?.(version)}
            className={`p-3 rounded-lg border transition-colors ${
                isLatest
                    ? 'bg-blue-500/10 border-blue-500/30'
                    : 'bg-background border-white/5 hover:bg-white/5 cursor-pointer'
            }`}
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    {entry.valid ? (
                        <Check className="h-4 w-4 text-green-400" />
                    ) : (
                        <X className="h-4 w-4 text-red-400" />
                    )}
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">
                                Version {version}
                            </span>
                            {isLatest && (
                                <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                                    Latest
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {formatTime(entry.timestamp)}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    {entry.errorCount > 0 && (
                        <p className="text-xs text-red-400">
                            {entry.errorCount} error{entry.errorCount > 1 ? 's' : ''}
                        </p>
                    )}
                    {entry.warningCount > 0 && (
                        <p className="text-xs text-yellow-400">
                            {entry.warningCount} warning{entry.warningCount > 1 ? 's' : ''}
                        </p>
                    )}
                </div>
            </div>

            {entry.changes && entry.changes.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/5">
                    <p className="text-xs text-gray-500 mb-1">Changes:</p>
                    <ul className="space-y-1">
                        {entry.changes.map((change, idx) => (
                            <li key={idx} className="text-xs text-gray-400 flex items-start gap-2">
                                <span className="text-blue-400 mt-0.5">•</span>
                                <span>{change}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
