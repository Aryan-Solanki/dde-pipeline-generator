import { TrendingUp, TrendingDown, Minus, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ValidationStats {
    totalChecks: number;
    passed: number;
    failed: number;
    warnings: number;
    validationTime?: number;
}

interface ValidationMetricsProps {
    stats: ValidationStats;
    className?: string;
}

export function ValidationMetrics({ stats, className = '' }: ValidationMetricsProps) {
    const passRate = stats.totalChecks > 0 
        ? Math.round((stats.passed / stats.totalChecks) * 100) 
        : 0;

    const getTrendIcon = () => {
        if (passRate >= 80) return <TrendingUp className="h-4 w-4 text-green-400" />;
        if (passRate >= 50) return <Minus className="h-4 w-4 text-yellow-400" />;
        return <TrendingDown className="h-4 w-4 text-red-400" />;
    };

    const getTrendColor = () => {
        if (passRate >= 80) return 'text-green-400';
        if (passRate >= 50) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
            {/* Total Checks */}
            <div className="bg-surface border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 uppercase tracking-wide">Total Checks</span>
                    <CheckCircle className="h-4 w-4 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-white">{stats.totalChecks}</div>
            </div>

            {/* Passed */}
            <div className="bg-surface border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 uppercase tracking-wide">Passed</span>
                    <CheckCircle className="h-4 w-4 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-green-400">{stats.passed}</div>
            </div>

            {/* Failed */}
            <div className="bg-surface border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 uppercase tracking-wide">Failed</span>
                    <XCircle className="h-4 w-4 text-red-400" />
                </div>
                <div className="text-2xl font-bold text-red-400">{stats.failed}</div>
            </div>

            {/* Warnings */}
            <div className="bg-surface border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 uppercase tracking-wide">Warnings</span>
                    <AlertCircle className="h-4 w-4 text-yellow-400" />
                </div>
                <div className="text-2xl font-bold text-yellow-400">{stats.warnings}</div>
            </div>

            {/* Pass Rate (full width on mobile, spans 2 cols on desktop) */}
            <div className="col-span-2 bg-surface border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-400 uppercase tracking-wide">Pass Rate</span>
                    {getTrendIcon()}
                </div>
                <div className="flex items-baseline gap-2">
                    <div className={`text-3xl font-bold ${getTrendColor()}`}>
                        {passRate}%
                    </div>
                    <div className="text-sm text-gray-400">
                        ({stats.passed}/{stats.totalChecks})
                    </div>
                </div>
                <div className="mt-3 bg-background rounded-full h-2 overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-500 ${
                            passRate >= 80 ? 'bg-green-500' :
                            passRate >= 50 ? 'bg-yellow-500' :
                            'bg-red-500'
                        }`}
                        style={{ width: `${passRate}%` }}
                    />
                </div>
            </div>

            {/* Validation Time */}
            {stats.validationTime !== undefined && (
                <div className="col-span-2 bg-surface border border-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400 uppercase tracking-wide">Validation Time</span>
                        <svg className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="text-2xl font-bold text-purple-400">
                        {stats.validationTime < 1000 
                            ? `${stats.validationTime}ms`
                            : `${(stats.validationTime / 1000).toFixed(2)}s`
                        }
                    </div>
                </div>
            )}
        </div>
    );
}

export function calculateValidationStats(validation: any): ValidationStats {
    let totalChecks = 0;
    let passed = 0;
    let failed = 0;
    let warnings = 0;

    // Count schema validation
    if (validation.schema_validation) {
        const sv = validation.schema_validation;
        totalChecks++;
        if (sv.valid) passed++;
        else failed++;
        warnings += sv.warnings?.length || 0;
    }

    // Count Python validation
    if (validation.python_validation) {
        const pv = validation.python_validation;
        
        // Syntax validation
        if (pv.details?.syntax_validation) {
            totalChecks++;
            if (pv.details.syntax_validation.valid) passed++;
            else failed++;
        }
        
        // Structure validation
        if (pv.details?.structure_validation) {
            totalChecks++;
            if (pv.details.structure_validation.valid) passed++;
            else failed++;
        }
        
        warnings += pv.warnings?.length || 0;
    }

    // Simple validation structure
    if (validation.valid !== undefined && !validation.schema_validation && !validation.python_validation) {
        totalChecks = 1;
        if (validation.valid) passed = 1;
        else failed = 1;
        warnings = validation.warnings?.length || 0;
    }

    return {
        totalChecks,
        passed,
        failed,
        warnings
    };
}
