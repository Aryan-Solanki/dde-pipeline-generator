import { X, Send, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../shared/ui/Button';

interface RefinementDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (feedback: string) => void;
    onAutoFix: () => void;
    hasErrors: boolean;
    isProcessing?: boolean;
}

export function RefinementDialog({ 
    isOpen, 
    onClose, 
    onSubmit, 
    onAutoFix,
    hasErrors,
    isProcessing = false 
}: RefinementDialogProps) {
    const [feedback, setFeedback] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (feedback.trim()) {
            onSubmit(feedback);
            setFeedback('');
        }
    };

    const handleAutoFix = () => {
        onAutoFix();
        onClose();
    };

    const quickSuggestions = [
        'Add error handling to all tasks',
        'Change schedule to run hourly',
        'Add email notifications on failure',
        'Increase retry attempts to 3',
        'Add data quality checks',
        'Optimize task dependencies'
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-surface border border-white/10 rounded-lg shadow-2xl w-full max-w-2xl mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Refine Pipeline</h2>
                        <p className="text-sm text-gray-400 mt-1">
                            Describe changes you'd like to make to the pipeline
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                        disabled={isProcessing}
                    >
                        <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Auto-fix option */}
                    {hasErrors && (
                        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                            <div className="flex items-start gap-3">
                                <Wand2 className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="font-medium text-purple-400 mb-1">Auto-Fix Errors</h3>
                                    <p className="text-sm text-purple-300/80 mb-3">
                                        Let AI automatically fix validation errors without manual feedback
                                    </p>
                                    <Button
                                        onClick={handleAutoFix}
                                        variant="outline"
                                        size="sm"
                                        disabled={isProcessing}
                                        className="border-purple-500/30 hover:bg-purple-500/10"
                                    >
                                        <Wand2 className="h-4 w-4 mr-2" />
                                        Auto-Fix Now
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Feedback textarea */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Your Feedback
                        </label>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Example: Change the schedule to run every 6 hours, add a validation step before loading data, and increase retry attempts to 3"
                            className="w-full h-32 px-4 py-3 bg-background border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                            disabled={isProcessing}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Be specific about what you want to change, add, or remove
                        </p>
                    </div>

                    {/* Quick suggestions */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Quick Suggestions
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {quickSuggestions.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setFeedback(suggestion)}
                                    className="px-3 py-2 text-left text-sm bg-background border border-white/10 rounded-lg hover:bg-white/5 hover:border-blue-500/30 transition-colors text-gray-300"
                                    disabled={isProcessing}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        disabled={isProcessing}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="primary"
                        disabled={!feedback.trim() || isProcessing}
                    >
                        {isProcessing ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4 mr-2" />
                                Refine Pipeline
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
