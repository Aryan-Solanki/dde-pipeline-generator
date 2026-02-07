import { Check, X, AlertTriangle, Info, Code, FileCode } from 'lucide-react';

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

interface ValidationDisplayProps {
    validation: ValidationResult | MultiValidationResult;
    className?: string;
}

export function ValidationDisplay({ validation, className = '' }: ValidationDisplayProps) {
    // Handle multi-validation structure
    const isMultiValidation = 'schema_validation' in validation || 'python_validation' in validation;
    
    if (isMultiValidation) {
        const multiVal = validation as MultiValidationResult;
        return <MultiValidationDisplay validation={multiVal} className={className} />;
    }
    
    const simpleVal = validation as ValidationResult;
    return <SimpleValidationDisplay validation={simpleVal} className={className} />;
}

function MultiValidationDisplay({ validation, className = '' }: { validation: MultiValidationResult; className?: string }) {
    const schemaVal = validation.schema_validation;
    const pythonVal = validation.python_validation;
    
    const allErrors: DetailedError[] = [];
    const allWarnings: DetailedWarning[] = [];
    
    // Collect schema validation errors/warnings
    if (schemaVal) {
        schemaVal.errors?.forEach(err => {
            if (typeof err === 'string') {
                allErrors.push({ type: 'schema', message: err });
            } else {
                allErrors.push({ ...err, type: `schema:${err.type}` });
            }
        });
        schemaVal.warnings?.forEach(warn => {
            if (typeof warn === 'string') {
                allWarnings.push({ type: 'schema', message: warn });
            } else {
                allWarnings.push({ ...warn, type: `schema:${warn.type}` });
            }
        });
    }
    
    // Collect Python validation errors/warnings
    if (pythonVal) {
        pythonVal.errors?.forEach(err => allErrors.push({ ...err, type: `python:${err.type}` }));
        pythonVal.warnings?.forEach(warn => allWarnings.push({ ...warn, type: `python:${warn.type}` }));
    }
    
    const isValid = allErrors.length === 0;
    const hasWarnings = allWarnings.length > 0;
    
    if (isValid && !hasWarnings) {
        return (
            <div className={`p-4 bg-green-500/10 border border-green-500/20 rounded-lg ${className}`}>
                <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-400" />
                    <div>
                        <p className="font-medium text-green-400">Validation Passed</p>
                        <p className="text-sm text-green-300/80 mt-1">
                            Pipeline specification passed all validation checks
                        </p>
                        {pythonVal && (
                            <div className="flex gap-3 mt-2 text-xs text-green-400/70">
                                <span className="flex items-center gap-1">
                                    <FileCode className="h-3 w-3" />
                                    Schema ✓
                                </span>
                                <span className="flex items-center gap-1">
                                    <Code className="h-3 w-3" />
                                    Structure ✓
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className={className}>
            <div className="space-y-3">
                {/* Errors */}
                {allErrors.length > 0 && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="flex items-start gap-2">
                            <X className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-medium text-red-400 mb-3">
                                    Validation Errors ({allErrors.length})
                                </p>
                                <div className="space-y-2">
                                    {allErrors.map((error, index) => (
                                        <div key={index} className="text-sm">
                                            <div className="flex items-start gap-2">
                                                <span className="text-red-400 mt-1">•</span>
                                                <div className="flex-1">
                                                    <p className="text-red-300/90">{error.message}</p>
                                                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-red-400/60">
                                                        <span className="bg-red-500/10 px-1.5 py-0.5 rounded">
                                                            {error.type}
                                                        </span>
                                                        {error.field && (
                                                            <span className="bg-red-500/10 px-1.5 py-0.5 rounded font-mono">
                                                                {error.field}
                                                            </span>
                                                        )}
                                                        {error.line && (
                                                            <span className="bg-red-500/10 px-1.5 py-0.5 rounded">
                                                                line {error.line}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {error.details && (
                                                        <pre className="mt-1 text-xs text-red-300/70 bg-red-500/5 p-2 rounded border border-red-500/10 overflow-x-auto">
                                                            {error.details}
                                                        </pre>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Warnings */}
                {hasWarnings && (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-medium text-yellow-400 mb-3">
                                    Warnings ({allWarnings.length})
                                </p>
                                <div className="space-y-2">
                                    {allWarnings.map((warning, index) => (
                                        <div key={index} className="text-sm">
                                            <div className="flex items-start gap-2">
                                                <span className="text-yellow-400 mt-1">•</span>
                                                <div className="flex-1">
                                                    <p className="text-yellow-300/90">{warning.message}</p>
                                                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-yellow-400/60">
                                                        <span className="bg-yellow-500/10 px-1.5 py-0.5 rounded">
                                                            {warning.type}
                                                        </span>
                                                        {warning.field && (
                                                            <span className="bg-yellow-500/10 px-1.5 py-0.5 rounded font-mono">
                                                                {warning.field}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Info for warnings-only case */}
                {allErrors.length === 0 && hasWarnings && (
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
        </div>
    );
}

function SimpleValidationDisplay({ validation, className = '' }: { validation: ValidationResult; className?: string }) {
    const { valid, errors, warnings } = validation;

    const hasErrors = errors && errors.length > 0;
    const hasWarnings = warnings && warnings.length > 0;

    if (!hasErrors && !hasWarnings && valid) {
        return (
            <div className={`p-4 bg-green-500/10 border border-green-500/20 rounded-lg ${className}`}>
                <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-400" />
                    <div>
                        <p className="font-medium text-green-400">Validation Passed</p>
                        <p className="text-sm text-green-300/80 mt-1">
                            Pipeline specification is valid and ready for deployment
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            <div className="space-y-3">
                {/* Errors */}
                {hasErrors && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="flex items-start gap-2">
                            <X className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-medium text-red-400 mb-2">
                                    Validation Errors ({errors.length})
                                </p>
                                <ul className="space-y-1">
                                    {errors.map((error, index) => (
                                        <li key={index} className="text-sm text-red-300/90 flex items-start gap-2">
                                            <span className="text-red-400 mt-1">•</span>
                                            <span>{typeof error === 'string' ? error : error.message}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Warnings */}
                {hasWarnings && (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-medium text-yellow-400 mb-2">
                                    Warnings ({warnings.length})
                                </p>
                                <ul className="space-y-1">
                                    {warnings.map((warning, index) => (
                                        <li key={index} className="text-sm text-yellow-300/90 flex items-start gap-2">
                                            <span className="text-yellow-400 mt-1">•</span>
                                            <span>{typeof warning === 'string' ? warning : warning.message}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Info for warnings-only case */}
                {!hasErrors && hasWarnings && (
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
        </div>
    );
}
