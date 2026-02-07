import { Package, Check, X, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../shared/ui/Button";
import { Textarea } from "../../../shared/ui/Textarea";
import { config } from "../../../config";

interface PackageInfo {
    name: string;
    version: string | null;
    raw: string;
}

interface ParsedRequirements {
    totalPackages: number;
    packages: PackageInfo[];
    airflowPackages: PackageInfo[];
    commonDependencies: {
        pandas: boolean;
        numpy: boolean;
        requests: boolean;
        sqlalchemy: boolean;
    };
}

interface RequirementsParserProps {
    onParsed?: (requirements: ParsedRequirements) => void;
}

export function RequirementsParser({ onParsed }: RequirementsParserProps) {
    const [content, setContent] = useState('');
    const [parsing, setParsing] = useState(false);
    const [parsed, setParsed] = useState<ParsedRequirements | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleParse = async () => {
        if (!content.trim()) {
            setError('Please enter requirements.txt content');
            return;
        }

        setParsing(true);
        setError(null);

        try {
            const res = await fetch(config.endpoints.filesParseRequirements, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `Parse failed: ${res.status}`);
            }

            const result = await res.json();
            setParsed(result);
            
            if (onParsed) {
                onParsed(result);
            }

            console.log('Requirements parsed:', result);

        } catch (err: any) {
            setError(err.message || 'Failed to parse requirements');
            console.error('Parse error:', err);
        } finally {
            setParsing(false);
        }
    };

    const handleClear = () => {
        setContent('');
        setParsed(null);
        setError(null);
    };

    const loadExample = () => {
        const example = `apache-airflow==2.8.0
pandas>=1.5.0
numpy>=1.24.0
requests>=2.31.0
sqlalchemy>=1.4.0
psycopg2-binary>=2.9.0
# Data processing
great-expectations>=0.18.0
# Monitoring
prometheus-client>=0.19.0`;
        
        setContent(example);
        setParsed(null);
        setError(null);
    };

    return (
        <div className="space-y-4">
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-300">
                        Requirements.txt Content
                    </label>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadExample}
                        className="text-xs"
                    >
                        Load Example
                    </Button>
                </div>
                
                <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste your requirements.txt content here...&#10;Example:&#10;apache-airflow==2.8.0&#10;pandas>=1.5.0&#10;numpy>=1.24.0"
                    rows={8}
                    className="font-mono text-sm"
                />
            </div>

            <div className="flex gap-2">
                <Button
                    variant="primary"
                    onClick={handleParse}
                    disabled={!content.trim() || parsing}
                    className="flex-1"
                >
                    {parsing ? 'Parsing...' : 'Parse Requirements'}
                </Button>
                
                {(content || parsed) && (
                    <Button
                        variant="outline"
                        onClick={handleClear}
                        disabled={parsing}
                    >
                        Clear
                    </Button>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Parsed Results */}
            {parsed && (
                <div className="space-y-4">
                    {/* Summary */}
                    <div className="p-4 bg-surface border border-white/10 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                            <Package className="h-5 w-5 text-blue-400" />
                            <h4 className="text-sm font-medium text-white">Parsed Summary</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-400">Total Packages:</span>
                                <span className="ml-2 text-white font-medium">{parsed.totalPackages}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Airflow Packages:</span>
                                <span className="ml-2 text-white font-medium">{parsed.airflowPackages.length}</span>
                            </div>
                        </div>

                        {/* Common Dependencies */}
                        <div className="mt-3 pt-3 border-t border-white/5">
                            <p className="text-xs text-gray-400 mb-2">Common Dependencies:</p>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(parsed.commonDependencies).map(([key, found]) => (
                                    <div
                                        key={key}
                                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                            found
                                                ? 'bg-green-500/20 text-green-300'
                                                : 'bg-gray-700 text-gray-500'
                                        }`}
                                    >
                                        {found ? (
                                            <Check className="h-3 w-3" />
                                        ) : (
                                            <X className="h-3 w-3" />
                                        )}
                                        {key}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Airflow Packages */}
                    {parsed.airflowPackages.length > 0 && (
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <h4 className="text-sm font-medium text-blue-300 mb-2">Airflow Packages</h4>
                            <div className="space-y-1">
                                {parsed.airflowPackages.map((pkg, idx) => (
                                    <div key={idx} className="text-xs font-mono text-gray-300">
                                        {pkg.name}{pkg.version ? pkg.version : ''}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* All Packages */}
                    <details className="bg-surface border border-white/10 rounded-lg">
                        <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-300 hover:text-white">
                            View All Packages ({parsed.totalPackages})
                        </summary>
                        <div className="px-4 pb-4 max-h-60 overflow-y-auto">
                            <div className="space-y-1">
                                {parsed.packages.map((pkg, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0"
                                    >
                                        <span className="font-mono text-gray-300">{pkg.name}</span>
                                        <span className="text-gray-500">{pkg.version || 'any'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </details>
                </div>
            )}
        </div>
    );
}
