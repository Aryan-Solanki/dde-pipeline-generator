import { Workflow, Settings, CheckCircle2, Edit3 } from "lucide-react";
import { useState } from "react";
import { Button } from "../../shared/ui/Button";
import { Textarea } from "../../shared/ui/Textarea";
import { PipelineForm, type PipelineParameters } from "./components/PipelineForm";
import { PipelineVisualizer } from "./components/PipelineVisualizer";
import { ValidationResults } from "./components/ValidationResults";
import { ValidationMetrics, calculateValidationStats } from "./components/ValidationMetrics";
import { RefinementDialog } from "./components/RefinementDialog";
import { RepairProgress } from "./components/RepairProgress";
import { CodePreview } from "./components/CodePreview";
import { generatePipeline, refinePipeline, fixPipelineErrors, repairPipeline, generateDAGCode, refineSpecification, refineDAGCode, exportPackage } from "./api";

export function PipelineGeneratorPage() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isRefining, setIsRefining] = useState(false);
    const [isRepairing, setIsRepairing] = useState(false);
    const [pipelineSpec, setPipelineSpec] = useState<any>(null);
    const [validationResult, setValidationResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [showRefinementDialog, setShowRefinementDialog] = useState(false);
    const [iterationCount, setIterationCount] = useState(0);
    const [repairIterations, setRepairIterations] = useState<any[]>([]);
    const [currentRepairIteration, setCurrentRepairIteration] = useState(0);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [codeFilename, setCodeFilename] = useState<string>('');
    const [isGeneratingCode, setIsGeneratingCode] = useState(false);
    
    // New refinement states
    const [specAccepted, setSpecAccepted] = useState(false);
    const [codeAccepted, setCodeAccepted] = useState(false);
    const [showSpecRefinement, setShowSpecRefinement] = useState(false);
    const [showCodeRefinement, setShowCodeRefinement] = useState(false);
    const [specFeedback, setSpecFeedback] = useState('');
    const [codeFeedback, setCodeFeedback] = useState('');
    const [isRefiningSpec, setIsRefiningSpec] = useState(false);
    const [isRefiningCode, setIsRefiningCode] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleGenerate = async (description: string, parameters: PipelineParameters, file?: File) => {
        setIsGenerating(true);
        setError(null);
        setPipelineSpec(null);
        setValidationResult(null);
        setIterationCount(0);

        try {
            const result = await generatePipeline(description, parameters, file);
            setPipelineSpec(result.specification);
            setValidationResult(result.validation);
            setIterationCount(1);
            setSpecAccepted(false); // Reset acceptance
            setCodeAccepted(false);
            setGeneratedCode(null);
            setShowSpecRefinement(false);
            setShowCodeRefinement(false);
            
            console.log('Generated pipeline:', result);
            if (file) {
                console.log('Used reference file:', file.name);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to generate pipeline');
            console.error('Generation error:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRequestFix = () => {
        setShowRefinementDialog(true);
    };

    const handleRefine = async (feedback: string) => {
        setIsRefining(true);
        setError(null);
        setShowRefinementDialog(false);

        try {
            const result = await refinePipeline(pipelineSpec, feedback, validationResult);
            setPipelineSpec(result.specification);
            setValidationResult(result.validation);
            setIterationCount(prev => prev + 1);
            
            console.log('Refined pipeline:', result);
        } catch (err: any) {
            setError(err.message || 'Failed to refine pipeline');
            console.error('Refinement error:', err);
        } finally {
            setIsRefining(false);
        }
    };

    const handleAutoFix = async () => {
        setIsRefining(true);
        setError(null);
        setShowRefinementDialog(false);

        try {
            const result = await fixPipelineErrors(pipelineSpec, validationResult);
            setPipelineSpec(result.specification);
            setValidationResult(result.validation);
            setIterationCount(prev => prev + 1);
            
            console.log('Auto-fixed pipeline:', result);
            
            if (result.metadata.fix_success) {
                console.log(`Successfully reduced errors from ${result.metadata.original_errors} to ${result.metadata.remaining_errors}`);
            }
        } catch (err: any) {
            setError(err.message || 'Auto-fix failed');
            console.error('Auto-fix error:', err);
        } finally {
            setIsRefining(false);
        }
    };

    const handleAutoRepair = async (maxIterations: number = 3) => {
        setIsRepairing(true);
        setError(null);
        setRepairIterations([]);
        setCurrentRepairIteration(0);

        try {
            console.log('[Auto-Repair] Starting repair loop with max iterations:', maxIterations);
            
            const result = await repairPipeline(pipelineSpec, maxIterations);
            
            setPipelineSpec(result.specification);
            setValidationResult(result.validation);
            setRepairIterations(result.iterations || []);
            setIterationCount(prev => prev + (result.metadata.iterations_performed || 0));
            
            console.log('[Auto-Repair] Repair complete:', result.metadata);
            
            if (result.metadata.fully_repaired) {
                console.log('✓ Pipeline fully repaired - all errors fixed!');
            } else {
                console.log(`⚠ Repair incomplete - ${result.metadata.final_error_count} errors remaining`);
            }
        } catch (err: any) {
            setError(err.message || 'Auto-repair failed');
            console.error('[Auto-Repair] Error:', err);
        } finally {
            setIsRepairing(false);
        }
    };

    const handleAcceptSpec = () => {
        setSpecAccepted(true);
        setShowSpecRefinement(false);
        console.log('[Accept] Specification accepted');
    };

    const handleAcceptCode = () => {
        setCodeAccepted(true);
        setShowCodeRefinement(false);
        console.log('[Accept] Code accepted');
    };

    const handleRefineSpec = async () => {
        if (!specFeedback.trim()) {
            setError('Please provide feedback for refinement');
            return;
        }

        setIsRefiningSpec(true);
        setError(null);

        try {
            console.log('[Refine Spec] Refining with feedback:', specFeedback);
            const result = await refineSpecification(pipelineSpec, specFeedback);
            setPipelineSpec(result.specification);
            setValidationResult(result.validation);
            setIterationCount(prev => prev + 1);
            setSpecFeedback('');
            setShowSpecRefinement(false);
            console.log('[Refine Spec] Refinement complete');
        } catch (err: any) {
            setError(err.message || 'Specification refinement failed');
            console.error('[Refine Spec] Error:', err);
        } finally {
            setIsRefiningSpec(false);
        }
    };

    const handleRefineCode = async () => {
        if (!codeFeedback.trim()) {
            setError('Please provide feedback for code refinement');
            return;
        }

        setIsRefiningCode(true);
        setError(null);

        try {
            console.log('[Refine Code] Refining with feedback:', codeFeedback);
            const result = await refineDAGCode(generatedCode!, codeFeedback, pipelineSpec);
            setGeneratedCode(result.code);
            setCodeFeedback('');
            setShowCodeRefinement(false);
            console.log('[Refine Code] Refinement complete');
        } catch (err: any) {
            setError(err.message || 'Code refinement failed');
            console.error('[Refine Code] Error:', err);
        } finally {
            setIsRefiningCode(false);
        }
    };

    const handleGenerateCode = async () => {
        if (!pipelineSpec || !specAccepted) return;

        setIsGeneratingCode(true);
        setError(null);
        setCodeAccepted(false); // Reset code acceptance
        setShowCodeRefinement(false);

        try {
            console.log('[Generate Code] Generating Python DAG code...');
            
            const result = await generateDAGCode(pipelineSpec);
            
            setGeneratedCode(result.code);
            setCodeFilename(result.filename);
            
            console.log('[Generate Code] Code generated successfully:', result.filename);
            console.log('[Generate Code] Lines:', result.metadata.lines);

        } catch (err: any) {
            setError(err.message || 'Code generation failed');
            console.error('[Generate Code] Error:', err);
        } finally {
            setIsGeneratingCode(false);
        }
    };

    const handleDownloadJSON = () => {
        if (!pipelineSpec) return;

        try {
            // Create JSON string with pretty formatting
            const jsonString = JSON.stringify(pipelineSpec, null, 2);
            
            // Create blob and download link
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            // Set filename based on dag_id or default
            const filename = pipelineSpec.dag_id 
                ? `${pipelineSpec.dag_id}_spec.json`
                : 'pipeline_specification.json';
            
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            console.log('[Download JSON] Downloaded specification:', filename);
        } catch (err: any) {
            setError('Failed to download JSON');
            console.error('[Download JSON] Error:', err);
        }
    };

    const handleExportPackage = async () => {
        if (!pipelineSpec) return;

        setIsExporting(true);
        setError(null);

        try {
            console.log('[Export Package] Creating complete package...');
            
            const result = await exportPackage(pipelineSpec);
            
            // Create download link for the ZIP file
            const url = URL.createObjectURL(result.blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = result.filename;
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            console.log('[Export Package] Package downloaded:', result.filename);
        } catch (err: any) {
            setError(err.message || 'Failed to export package');
            console.error('[Export Package] Error:', err);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex flex-1 flex-col h-full relative">
            {/* Top Bar */}
            <div className="fixed top-0 right-0 left-0 z-10 flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm border-b border-white/5">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-white">
                        <Workflow className="h-5 w-5 text-blue-500" />
                        <h1 className="text-lg font-semibold">Pipeline Generator</h1>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col w-full min-h-0 pt-20">
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-5xl mx-auto px-6 py-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left Column: Form */}
                            <div>
                                <div className="mb-6">
                                    <h2 className="text-xl font-semibold text-white mb-2">
                                        Configure Your Pipeline
                                    </h2>
                                    <p className="text-gray-400 text-sm">
                                        Fill in the details below to generate an Airflow DAG specification
                                    </p>
                                </div>
                                
                                <PipelineForm
                                    onGenerate={handleGenerate}
                                    isGenerating={isGenerating}
                                />
                            </div>

                            {/* Right Column: Preview/Results */}
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-white mb-2">
                                        Generated Specification
                                    </h2>
                                    <p className="text-gray-400 text-sm">
                                        Preview of the generated pipeline
                                    </p>
                                </div>

                                {isGenerating && (
                                    <div className="flex items-center justify-center h-64 bg-surface border border-white/10 rounded-lg">
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                            <p className="text-gray-400">Generating pipeline...</p>
                                        </div>
                                    </div>
                                )}

                                {isRefining && (
                                    <div className="flex items-center justify-center h-64 bg-surface border border-white/10 rounded-lg">
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                                            <p className="text-gray-400">Refining pipeline...</p>
                                            <p className="text-sm text-gray-500 mt-2">Iteration {iterationCount + 1}</p>
                                        </div>
                                    </div>
                                )}

                                {isRefiningSpec && (
                                    <div className="flex items-center justify-center h-64 bg-surface border border-white/10 rounded-lg">
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                            <p className="text-gray-400">Refining specification...</p>
                                            <p className="text-sm text-gray-500 mt-2">Processing your feedback</p>
                                        </div>
                                    </div>
                                )}

                                {isRefiningCode && (
                                    <div className="flex items-center justify-center h-64 bg-surface border border-white/10 rounded-lg">
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                                            <p className="text-gray-400">Refining code...</p>
                                            <p className="text-sm text-gray-500 mt-2">Applying your changes</p>
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                                        <p className="text-red-400 text-sm">
                                            <strong>Error:</strong> {error}
                                        </p>
                                    </div>
                                )}

                                {/* Repair Progress */}
                                {(isRepairing || repairIterations.length > 0) && (
                                    <RepairProgress 
                                        iterations={repairIterations}
                                        isRepairing={isRepairing}
                                        currentIteration={currentRepairIteration}
                                        maxIterations={3}
                                    />
                                )}

                                {pipelineSpec && !isGenerating && !isRefining && !isRepairing && !isRefiningSpec && (
                                    <div className="space-y-6">
                                        {/* Iteration Counter */}
                                        {iterationCount > 1 && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <div className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                                    <span className="text-purple-400 font-medium">
                                                        Iteration {iterationCount}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Validation Metrics */}
                                        {validationResult && (
                                            <div>
                                                <h3 className="text-sm font-medium text-white mb-3">Validation Summary</h3>
                                                <ValidationMetrics stats={calculateValidationStats(validationResult)} />
                                            </div>
                                        )}

                                        {/* Validation Status */}
                                        {validationResult && (
                                            <ValidationResults 
                                                validation={validationResult}
                                                onRequestFix={handleRequestFix}
                                                onAutoRepair={handleAutoRepair}
                                            />
                                        )}

                                        {/* Pipeline Visualizer */}
                                        <div className="bg-background rounded-lg p-4 border border-white/10">
                                            <h3 className="text-sm font-medium text-white mb-4">Pipeline Diagram</h3>
                                            <PipelineVisualizer 
                                                tasks={pipelineSpec.tasks || []}
                                                dagId={pipelineSpec.dag_id}
                                            />
                                        </div>

                                        {/* Pipeline Details */}
                                        <div className="p-4 bg-surface border border-white/10 rounded-lg">
                                            <h3 className="text-sm font-medium text-white mb-3">Pipeline Details</h3>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">DAG ID:</span>
                                                    <span className="text-white font-mono">{pipelineSpec.dag_id}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Schedule:</span>
                                                    <span className="text-white">{pipelineSpec.schedule || 'None'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Start Date:</span>
                                                    <span className="text-white">{pipelineSpec.start_date || 'Not set'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Catchup:</span>
                                                    <span className="text-white">{pipelineSpec.catchup ? 'Enabled' : 'Disabled'}</span>
                                                </div>
                                                {pipelineSpec.tags && pipelineSpec.tags.length > 0 && (
                                                    <div className="pt-2 border-t border-white/10">
                                                        <span className="text-gray-400 text-xs">Tags:</span>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {pipelineSpec.tags.map((tag: string) => (
                                                                <span
                                                                    key={tag}
                                                                    className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full"
                                                                >
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {pipelineSpec.connections && pipelineSpec.connections.length > 0 && (
                                                    <div className="pt-2 border-t border-white/10">
                                                        <span className="text-gray-400 text-xs mb-1 block">Required Connections:</span>
                                                        <div className="space-y-1">
                                                            {pipelineSpec.connections.map((conn: any, i: number) => (
                                                                <div key={i} className="text-xs text-gray-300">
                                                                    • {conn.conn_id} ({conn.conn_type})
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* JSON Preview */}
                                        <details className="bg-surface border border-white/10 rounded-lg">
                                            <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-300 hover:text-white">
                                                View Full JSON Specification
                                            </summary>
                                            <div className="px-4 pb-4">
                                                <pre className="text-xs text-gray-300 overflow-x-auto bg-background p-3 rounded border border-white/5">
                                                    {JSON.stringify(pipelineSpec, null, 2)}
                                                </pre>
                                            </div>
                                        </details>

                                        {/* Generated Code Preview */}
                                        {generatedCode && (
                                            <div>
                                                <h3 className="text-sm font-medium text-white mb-3">Generated DAG Code</h3>
                                                <CodePreview
                                                    code={generatedCode}
                                                    filename={codeFilename}
                                                    language="python"
                                                    onDownload={() => console.log('Code downloaded')}
                                                />
                                            </div>
                                        )}

                                        {/* Actions */}
                                        {!specAccepted && (
                                            <div className="space-y-3">
                                                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                                    <p className="text-sm text-blue-300">
                                                        Review the specification. Accept it to proceed or suggest changes for refinement.
                                                    </p>
                                                </div>
                                                
                                                {!showSpecRefinement ? (
                                                    <div className="flex gap-2">
                                                        <Button 
                                                            variant="primary" 
                                                            className="flex-1"
                                                            onClick={handleAcceptSpec}
                                                        >
                                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                                            Accept Specification
                                                        </Button>
                                                        <Button 
                                                            variant="outline" 
                                                            className="flex-1"
                                                            onClick={() => setShowSpecRefinement(true)}
                                                        >
                                                            <Edit3 className="h-4 w-4 mr-2" />
                                                            Suggest Changes
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <Textarea
                                                            value={specFeedback}
                                                            onChange={(e) => setSpecFeedback(e.target.value)}
                                                            placeholder="Describe the changes you want to make to this specification..."
                                                            rows={4}
                                                            className="w-full"
                                                        />
                                                        <div className="flex gap-2">
                                                            <Button 
                                                                variant="primary" 
                                                                className="flex-1"
                                                                onClick={handleRefineSpec}
                                                                disabled={isRefiningSpec || !specFeedback.trim()}
                                                            >
                                                                {isRefiningSpec ? 'Refining...' : 'Refine Specification'}
                                                            </Button>
                                                            <Button 
                                                                variant="outline" 
                                                                onClick={() => {
                                                                    setShowSpecRefinement(false);
                                                                    setSpecFeedback('');
                                                                }}
                                                                disabled={isRefiningSpec}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {specAccepted && !generatedCode && (
                                            <div className="space-y-3">
                                                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
                                                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                                                    <p className="text-sm text-green-300">
                                                        Specification accepted! Generate Python code to proceed.
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button 
                                                        variant="primary" 
                                                        className="flex-1"
                                                        onClick={handleGenerateCode}
                                                        disabled={isGeneratingCode}
                                                    >
                                                        {isGeneratingCode ? 'Generating...' : 'Generate Python Code'}
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        onClick={handleDownloadJSON}
                                                    >
                                                        Download JSON
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {generatedCode && !codeAccepted && (
                                            <div className="space-y-3">
                                                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                                    <p className="text-sm text-purple-300">
                                                        Review the generated code. Accept it to download or suggest changes for refinement.
                                                    </p>
                                                </div>
                                                
                                                {!showCodeRefinement ? (
                                                    <div className="flex gap-2">
                                                        <Button 
                                                            variant="primary" 
                                                            className="flex-1"
                                                            onClick={handleAcceptCode}
                                                        >
                                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                                            Accept Code
                                                        </Button>
                                                        <Button 
                                                            variant="outline" 
                                                            className="flex-1"
                                                            onClick={() => setShowCodeRefinement(true)}
                                                        >
                                                            <Edit3 className="h-4 w-4 mr-2" />
                                                            Suggest Changes
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <Textarea
                                                            value={codeFeedback}
                                                            onChange={(e) => setCodeFeedback(e.target.value)}
                                                            placeholder="Describe the changes you want to make to this code..."
                                                            rows={4}
                                                            className="w-full"
                                                        />
                                                        <div className="flex gap-2">
                                                            <Button 
                                                                variant="primary" 
                                                                className="flex-1"
                                                                onClick={handleRefineCode}
                                                                disabled={isRefiningCode || !codeFeedback.trim()}
                                                            >
                                                                {isRefiningCode ? 'Refining...' : 'Refine Code'}
                                                            </Button>
                                                            <Button 
                                                                variant="outline" 
                                                                onClick={() => {
                                                                    setShowCodeRefinement(false);
                                                                    setCodeFeedback('');
                                                                }}
                                                                disabled={isRefiningCode}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {generatedCode && codeAccepted && (
                                            <div className="space-y-3">
                                                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
                                                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                                                    <p className="text-sm text-green-300">
                                                        Code accepted! You can now download the files or export the complete package.
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button 
                                                        variant="primary" 
                                                        className="flex-1"
                                                        onClick={handleDownloadJSON}
                                                    >
                                                        Download JSON
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        className="flex-1"
                                                        onClick={handleExportPackage}
                                                        disabled={isExporting}
                                                    >
                                                        {isExporting ? 'Exporting...' : 'Export Package'}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!pipelineSpec && !isGenerating && !error && (
                                    <div className="flex items-center justify-center h-64 bg-surface border border-white/10 rounded-lg border-dashed">
                                        <p className="text-gray-500 text-sm">
                                            Fill out the form and click "Generate Pipeline" to see results
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Refinement Dialog */}
            <RefinementDialog
                isOpen={showRefinementDialog}
                onClose={() => setShowRefinementDialog(false)}
                onSubmit={handleRefine}
                onAutoFix={handleAutoFix}
                hasErrors={validationResult?.errors?.length > 0}
                isProcessing={isRefining}
            />
        </div>
    );
}
