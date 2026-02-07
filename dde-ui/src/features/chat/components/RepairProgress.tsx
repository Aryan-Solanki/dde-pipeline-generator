import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";

interface Iteration {
    iteration: number;
    errors: number;
    warnings?: number;
    error_reduction?: number;
    status: 'initial' | 'improved' | 'no_change' | 'regressed' | 'parse_error';
    timestamp: string;
}

interface RepairProgressProps {
    iterations: Iteration[];
    isRepairing: boolean;
    currentIteration?: number;
    maxIterations?: number;
}

export function RepairProgress({ 
    iterations, 
    isRepairing, 
    currentIteration = 0,
    maxIterations = 3 
}: RepairProgressProps) {
    const initialIteration = iterations.find(it => it.iteration === 0);
    const latestIteration = iterations[iterations.length - 1];
    const completedIterations = iterations.filter(it => it.iteration > 0);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'improved':
                return <CheckCircle2 className="h-4 w-4 text-green-400" />;
            case 'no_change':
                return <AlertCircle className="h-4 w-4 text-yellow-400" />;
            case 'regressed':
            case 'parse_error':
                return <XCircle className="h-4 w-4 text-red-400" />;
            default:
                return <div className="h-4 w-4 rounded-full bg-gray-600" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'improved': return 'Improved';
            case 'no_change': return 'No change';
            case 'regressed': return 'Regressed';
            case 'parse_error': return 'Parse error';
            case 'initial': return 'Initial';
            default: return 'Unknown';
        }
    };

    return (
        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    {isRepairing ? (
                        <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
                    ) : latestIteration?.errors === 0 ? (
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                    ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-400" />
                    )}
                    <h3 className="text-sm font-medium text-white">
                        {isRepairing ? 'Auto-Repair in Progress' : 'Auto-Repair Complete'}
                    </h3>
                </div>
                
                {isRepairing && (
                    <span className="text-xs text-purple-300">
                        Iteration {currentIteration}/{maxIterations}
                    </span>
                )}
            </div>

            {/* Progress Summary */}
            {initialIteration && latestIteration && (
                <div className="mb-4 p-3 bg-background/50 rounded border border-white/5">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-xs text-gray-400 mb-1">Initial</div>
                            <div className="text-lg font-semibold text-red-400">
                                {initialIteration.errors}
                            </div>
                            <div className="text-xs text-gray-500">errors</div>
                        </div>
                        <div className="flex items-center justify-center">
                            <div className="text-2xl text-purple-400">→</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-400 mb-1">Current</div>
                            <div className={`text-lg font-semibold ${
                                latestIteration.errors === 0 
                                    ? 'text-green-400' 
                                    : latestIteration.errors < initialIteration.errors
                                        ? 'text-yellow-400'
                                        : 'text-red-400'
                            }`}>
                                {latestIteration.errors}
                            </div>
                            <div className="text-xs text-gray-500">errors</div>
                        </div>
                    </div>

                    {initialIteration.errors > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400">Error Reduction</span>
                                <span className={`font-medium ${
                                    latestIteration.errors === 0 
                                        ? 'text-green-400' 
                                        : 'text-purple-400'
                                }`}>
                                    {initialIteration.errors - latestIteration.errors} fixed
                                    {initialIteration.errors > 0 && (
                                        <> ({Math.round((initialIteration.errors - latestIteration.errors) / initialIteration.errors * 100)}%)</>
                                    )}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Iteration Timeline */}
            {completedIterations.length > 0 && (
                <div className="space-y-2">
                    <div className="text-xs text-gray-400 mb-2">Repair Attempts</div>
                    {completedIterations.map((iteration) => (
                        <div 
                            key={iteration.iteration}
                            className="flex items-center gap-3 p-2 bg-background/30 rounded text-xs"
                        >
                            <div className="flex-shrink-0">
                                {getStatusIcon(iteration.status)}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-gray-300 font-medium">
                                        Iteration {iteration.iteration}
                                    </span>
                                    <span className={`font-medium ${
                                        iteration.status === 'improved' 
                                            ? 'text-green-400'
                                            : iteration.status === 'no_change'
                                                ? 'text-yellow-400'
                                                : 'text-red-400'
                                    }`}>
                                        {getStatusText(iteration.status)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-gray-500">
                                    <span>
                                        {iteration.errors} {iteration.errors === 1 ? 'error' : 'errors'}
                                    </span>
                                    {iteration.error_reduction !== undefined && (
                                        <span className={
                                            iteration.error_reduction > 0 
                                                ? 'text-green-400' 
                                                : iteration.error_reduction < 0 
                                                    ? 'text-red-400' 
                                                    : 'text-gray-400'
                                        }>
                                            {iteration.error_reduction > 0 ? '−' : iteration.error_reduction < 0 ? '+' : ''}{Math.abs(iteration.error_reduction)}
                                        </span>
                                    )}
                                    {iteration.warnings !== undefined && iteration.warnings > 0 && (
                                        <span className="text-yellow-400">
                                            {iteration.warnings} {iteration.warnings === 1 ? 'warning' : 'warnings'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Status Message */}
            {!isRepairing && latestIteration && (
                <div className="mt-3 pt-3 border-t border-white/5">
                    {latestIteration.errors === 0 ? (
                        <p className="text-xs text-green-400">
                            ✓ All errors successfully repaired!
                        </p>
                    ) : latestIteration.status === 'no_change' ? (
                        <p className="text-xs text-yellow-400">
                            ⚠ Repair loop stopped - no progress made
                        </p>
                    ) : latestIteration.status === 'parse_error' ? (
                        <p className="text-xs text-red-400">
                            ✗ Repair loop stopped - AI response could not be parsed
                        </p>
                    ) : (
                        <p className="text-xs text-gray-400">
                            Repair loop completed with {latestIteration.errors} remaining error{latestIteration.errors === 1 ? '' : 's'}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
