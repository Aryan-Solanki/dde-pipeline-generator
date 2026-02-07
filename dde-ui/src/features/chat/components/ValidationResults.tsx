import { Check, X, AlertTriangle, Info, Lightbulb, ChevronDown, ChevronRight, Code2, FileCode } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../shared/ui/Button';

interface DetailedError {
    type: string;
    message: string;
    line?: number;
    field?: string;
    details?: string;
}

interface DetailedWarning {
    type: string;
    message: string;
    field?: string;
}

interface ValidationResult {
    valid: boolean;
    errors: (string | DetailedError)[];
    warnings: (string | DetailedWarning)[];
}

interface MultiValidationResult {
    schema_validation?: ValidationResult;
    python_validation?: {
        valid: boolean;
        errors: DetailedError[];
        warnings: DetailedWarning[];
        details?: {
            syntax_validation?: ValidationResult;
            structure_validation?: ValidationResult;
        };
    };
}

interface ValidationResultsProps {
    validation: ValidationResult | MultiValidationResult;
    onRequestFix?: () => void;
    onAutoRepair?: (maxIterations: number) => void;
    className?: string;
}

interface ErrorGroup {
    type: string;
    errors: DetailedError[];
    icon: string;
    color: string;
}

export function ValidationResults({ validation, onRequestFix, onAutoRepair, className = '' }: ValidationResultsProps) {
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [showSuggestions, setShowSuggestions] = useState(true);

    // Handle multi-validation structure
    const isMultiValidation = 'schema_validation' in validation || 'python_validation' in validation;
    
    const allErrors: DetailedError[] = [];
    const allWarnings: DetailedWarning[] = [];
    
    if (isMultiValidation) {
        const multiVal = validation as MultiValidationResult;
        
        // Collect schema validation errors/warnings
        if (multiVal.schema_validation) {
            multiVal.schema_validation.errors?.forEach(err => {
                if (typeof err === 'string') {
                    allErrors.push({ type: 'schema', message: err });
                } else {
                    allErrors.push({ ...err, type: `schema:${err.type}` });
                }
            });
            multiVal.schema_validation.warnings?.forEach(warn => {
                if (typeof warn === 'string') {
                    allWarnings.push({ type: 'schema', message: warn });
                } else {
                    allWarnings.push({ ...warn, type: `schema:${warn.type}` });
                }
            });
        }
        
        // Collect Python validation errors/warnings
        if (multiVal.python_validation) {
            multiVal.python_validation.errors?.forEach(err => 
                allErrors.push({ ...err, type: `python:${err.type}` })
            );
            multiVal.python_validation.warnings?.forEach(warn => 
                allWarnings.push({ ...warn, type: `python:${warn.type}` })
            );
        }
    } else {
        const simpleVal = validation as ValidationResult;
        simpleVal.errors?.forEach(err => {
            if (typeof err === 'string') {
                allErrors.push({ type: 'general', message: err });
            } else {
                allErrors.push(err);
            }
        });
        simpleVal.warnings?.forEach(warn => {
            if (typeof warn === 'string') {
                allWarnings.push({ type: 'general', message: warn });
            } else {
                allWarnings.push(warn);
            }
        });
    }

    const isValid = allErrors.length === 0;
    const hasWarnings = allWarnings.length > 0;

    // Group errors by type
    const errorGroups = groupErrors(allErrors);
    const warningGroups = groupWarnings(allWarnings);

    const toggleGroup = (groupId: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupId)) {
            newExpanded.delete(groupId);
        } else {
            newExpanded.add(groupId);
        }
        setExpandedGroups(newExpanded);
    };

    if (isValid && !hasWarnings) {
        return (
            <div className={`p-6 bg-green-500/10 border border-green-500/20 rounded-lg ${className}`}>
                <div className="flex items-start gap-3">
                    <Check className="h-6 w-6 text-green-400 flex-shrink-0" />
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-green-400 mb-2">
                            Validation Passed ✓
                        </h3>
                        <p className="text-sm text-green-300/80">
                            Your pipeline specification has passed all validation checks and is ready for deployment.
                        </p>
                        <div className="flex gap-3 mt-3 text-xs text-green-400/70">
                            <span className="flex items-center gap-1">
                                <FileCode className="h-3 w-3" />
                                Schema Validation ✓
                            </span>
                            <span className="flex items-center gap-1">
                                <Code2 className="h-3 w-3" />
                                Structure Validation ✓
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Summary Card */}
            <div className={`p-4 rounded-lg border ${
                isValid 
                    ? 'bg-blue-500/10 border-blue-500/20' 
                    : 'bg-red-500/10 border-red-500/20'
            }`}>
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        {isValid ? (
                            <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                        ) : (
                            <X className="h-5 w-5 text-red-400 mt-0.5" />
                        )}
                        <div>
                            <h3 className={`font-semibold ${isValid ? 'text-blue-400' : 'text-red-400'}`}>
                                {isValid ? 'Validation Warnings' : 'Validation Failed'}
                            </h3>
                            <p className="text-sm text-gray-400 mt-1">
                                {allErrors.length > 0 && `${allErrors.length} error${allErrors.length > 1 ? 's' : ''}`}
                                {allErrors.length > 0 && hasWarnings && ', '}
                                {hasWarnings && `${allWarnings.length} warning${allWarnings.length > 1 ? 's' : ''}`}
                            </p>
                        </div>
                    </div>
                    {!isValid && (
                        <div className="flex gap-2">
                            {onAutoRepair && allErrors.length > 0 && (
                                <Button 
                                    onClick={() => onAutoRepair(3)}
                                    variant="primary" 
                                    size="sm"
                                    className="text-xs bg-purple-600 hover:bg-purple-700"
                                >
                                    Auto-Repair (Loop)
                                </Button>
                            )}
                            {onRequestFix && (
                                <Button 
                                    onClick={onRequestFix}
                                    variant="outline" 
                                    size="sm"
                                    className="text-xs"
                                >
                                    Request AI Fix
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Error Groups */}
            {errorGroups.length > 0 && (
                <div className="space-y-3">
                    {errorGroups.map((group, idx) => (
                        <ErrorGroupCard
                            key={`error-${idx}`}
                            group={group}
                            isExpanded={expandedGroups.has(`error-${group.type}`)}
                            onToggle={() => toggleGroup(`error-${group.type}`)}
                        />
                    ))}
                </div>
            )}

            {/* Warning Groups */}
            {warningGroups.length > 0 && (
                <div className="space-y-3">
                    {warningGroups.map((group, idx) => (
                        <WarningGroupCard
                            key={`warning-${idx}`}
                            type={group.type}
                            warnings={group.warnings}
                            isExpanded={expandedGroups.has(`warning-${group.type}`)}
                            onToggle={() => toggleGroup(`warning-${group.type}`)}
                        />
                    ))}
                </div>
            )}

            {/* Fix Suggestions */}
            {showSuggestions && allErrors.length > 0 && (
                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <div className="flex items-start gap-3">
                        <Lightbulb className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-purple-400">Quick Fix Suggestions</h4>
                                <button 
                                    onClick={() => setShowSuggestions(false)}
                                    className="text-xs text-purple-400/60 hover:text-purple-400"
                                >
                                    Dismiss
                                </button>
                            </div>
                            <div className="space-y-2 text-sm text-purple-300/90">
                                {generateSuggestions(allErrors).map((suggestion, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                        <span className="text-purple-400 mt-1">•</span>
                                        <span>{suggestion}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Info for warnings-only */}
            {isValid && hasWarnings && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                        <Info className="h-4 w-4 text-blue-400 flex-shrink-0" />
                        <p className="text-blue-300">
                            Pipeline is valid but has warnings. Review them before deployment.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

function ErrorGroupCard({ group, isExpanded, onToggle }: { 
    group: ErrorGroup; 
    isExpanded: boolean; 
    onToggle: () => void;
}) {
    return (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full p-4 flex items-center justify-between hover:bg-red-500/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{group.icon}</span>
                    <div className="text-left">
                        <h4 className="font-medium text-red-400 capitalize">
                            {group.type.replace('_', ' ')} Errors
                        </h4>
                        <p className="text-xs text-red-300/60 mt-0.5">
                            {group.errors.length} issue{group.errors.length > 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-red-400" />
                ) : (
                    <ChevronRight className="h-4 w-4 text-red-400" />
                )}
            </button>
            
            {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-red-500/10">
                    {group.errors.map((error, idx) => (
                        <div key={idx} className="pt-3">
                            <p className="text-sm text-red-300/90">{error.message}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {error.field && (
                                    <span className="text-xs bg-red-500/10 text-red-400/80 px-2 py-1 rounded font-mono">
                                        {error.field}
                                    </span>
                                )}
                                {error.line && (
                                    <span className="text-xs bg-red-500/10 text-red-400/80 px-2 py-1 rounded">
                                        line {error.line}
                                    </span>
                                )}
                            </div>
                            {error.details && (
                                <pre className="mt-2 text-xs text-red-300/70 bg-red-500/5 p-2 rounded border border-red-500/10 overflow-x-auto">
                                    {error.details}
                                </pre>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function WarningGroupCard({ type, warnings, isExpanded, onToggle }: { 
    type: string;
    warnings: DetailedWarning[];
    isExpanded: boolean; 
    onToggle: () => void;
}) {
    return (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full p-4 flex items-center justify-between hover:bg-yellow-500/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    <div className="text-left">
                        <h4 className="font-medium text-yellow-400 capitalize">
                            {type.replace('_', ' ')} Warnings
                        </h4>
                        <p className="text-xs text-yellow-300/60 mt-0.5">
                            {warnings.length} warning{warnings.length > 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-yellow-400" />
                ) : (
                    <ChevronRight className="h-4 w-4 text-yellow-400" />
                )}
            </button>
            
            {isExpanded && (
                <div className="px-4 pb-4 space-y-2 border-t border-yellow-500/10">
                    {warnings.map((warning, idx) => (
                        <div key={idx} className="pt-2 text-sm text-yellow-300/90">
                            <div className="flex items-start gap-2">
                                <span className="text-yellow-400 mt-1">•</span>
                                <div className="flex-1">
                                    <span>{warning.message}</span>
                                    {warning.field && (
                                        <span className="ml-2 text-xs bg-yellow-500/10 text-yellow-400/80 px-2 py-0.5 rounded font-mono">
                                            {warning.field}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function groupErrors(errors: DetailedError[]): ErrorGroup[] {
    const groups: { [key: string]: ErrorGroup } = {};
    
    const typeIcons: { [key: string]: string } = {
        syntax: '🐛',
        format: '📝',
        duplicate: '🔄',
        dependency: '🔗',
        field: '📋',
        structure: '🏗️',
        schema: '📐',
        python: '🐍'
    };
    
    const typeColors: { [key: string]: string } = {
        syntax: 'red',
        format: 'orange',
        duplicate: 'yellow',
        dependency: 'purple',
        field: 'pink',
        structure: 'indigo',
        schema: 'blue',
        python: 'cyan'
    };
    
    errors.forEach(error => {
        const baseType = error.type.split(':').pop() || 'general';
        if (!groups[baseType]) {
            groups[baseType] = {
                type: baseType,
                errors: [],
                icon: typeIcons[baseType] || '⚠️',
                color: typeColors[baseType] || 'red'
            };
        }
        groups[baseType].errors.push(error);
    });
    
    return Object.values(groups);
}

function groupWarnings(warnings: DetailedWarning[]): Array<{ type: string; warnings: DetailedWarning[] }> {
    const groups: { [key: string]: DetailedWarning[] } = {};
    
    warnings.forEach(warning => {
        const baseType = warning.type.split(':').pop() || 'general';
        if (!groups[baseType]) {
            groups[baseType] = [];
        }
        groups[baseType].push(warning);
    });
    
    return Object.entries(groups).map(([type, warnings]) => ({ type, warnings }));
}

function generateSuggestions(errors: DetailedError[]): string[] {
    const suggestions: string[] = [];
    const errorTypes = new Set(errors.map(e => e.type.split(':').pop()));
    
    if (errorTypes.has('format')) {
        suggestions.push('Use lowercase letters, numbers, underscores and hyphens for IDs');
    }
    if (errorTypes.has('duplicate')) {
        suggestions.push('Ensure all task IDs and connection IDs are unique');
    }
    if (errorTypes.has('dependency')) {
        suggestions.push('Check that all task dependencies reference existing tasks');
    }
    if (errorTypes.has('syntax')) {
        suggestions.push('Review Python syntax errors and fix invalid code');
    }
    if (errorTypes.has('field')) {
        suggestions.push('Add all required fields: dag_id, description, schedule, tasks');
    }
    if (errorTypes.has('structure')) {
        suggestions.push('Ensure DAG has at least one task and proper structure');
    }
    
    if (suggestions.length === 0) {
        suggestions.push('Review the errors above and make necessary corrections');
    }
    
    return suggestions;
}
