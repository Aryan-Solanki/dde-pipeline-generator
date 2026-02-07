import { useState } from 'react';
import { Database, Target, Tag, Clock, Upload, X } from 'lucide-react';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';

interface PipelineFormProps {
    onGenerate: (description: string, parameters: PipelineParameters, file?: File) => void;
    isGenerating?: boolean;
}

export interface PipelineParameters {
    schedule?: string;
    dataSource?: string;
    dataTarget?: string;
    tags?: string[];
}

const SCHEDULE_PRESETS = [
    { value: '@once', label: 'Run Once', icon: '🔵' },
    { value: '@hourly', label: 'Hourly', icon: '⏰' },
    { value: '@daily', label: 'Daily', icon: '📅' },
    { value: '@weekly', label: 'Weekly', icon: '📆' },
    { value: '@monthly', label: 'Monthly', icon: '🗓️' },
    { value: 'custom', label: 'Custom Cron', icon: '⚙️' }
];

const DATA_SOURCES = [
    'PostgreSQL', 'MySQL', 'MongoDB', 'SQLite', 'Oracle',
    'S3', 'GCS', 'Azure Blob',
    'REST API', 'GraphQL API',
    'Kafka', 'RabbitMQ',
    'CSV File', 'JSON File', 'Parquet File'
];

const DATA_TARGETS = [
    'PostgreSQL', 'MySQL', 'MongoDB', 'SQLite',
    'BigQuery', 'Snowflake', 'Redshift',
    'S3', 'GCS', 'Azure Blob',
    'Elasticsearch', 'Redis',
    'CSV File', 'JSON File', 'Parquet File'
];

const COMMON_TAGS = [
    'etl', 'production', 'staging', 'dev',
    'data-ingestion', 'analytics', 'reporting',
    'real-time', 'batch', 'migration'
];

export function PipelineForm({ onGenerate, isGenerating = false }: PipelineFormProps) {
    const [description, setDescription] = useState('');
    const [schedule, setSchedule] = useState<string>('@daily');
    const [customCron, setCustomCron] = useState('');
    const [dataSource, setDataSource] = useState('');
    const [dataTarget, setDataTarget] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [customTag, setCustomTag] = useState('');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!description.trim()) return;

        const parameters: PipelineParameters = {
            schedule: schedule === 'custom' ? customCron : schedule,
            dataSource: dataSource || undefined,
            dataTarget: dataTarget || undefined,
            tags: selectedTags.length > 0 ? selectedTags : undefined
        };

        onGenerate(description, parameters, uploadedFile || undefined);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadedFile(file);
        }
    };

    const removeFile = () => {
        setUploadedFile(null);
    };

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const addCustomTag = () => {
        if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
            setSelectedTags([...selectedTags, customTag.trim()]);
            setCustomTag('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pipeline Description */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Pipeline Description *
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your data pipeline (e.g., Extract data from PostgreSQL, transform it, and load to BigQuery daily)"
                    className="w-full h-24 px-4 py-3 bg-surface border border-white/10 rounded-lg text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    disabled={isGenerating}
                    required
                />
                <p className="mt-1 text-xs text-gray-500">
                    Be specific about data sources, transformations, and targets
                </p>
            </div>

            {/* Optional File Upload */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Reference File (Optional)
                </label>
                
                {!uploadedFile ? (
                    <div className="relative">
                        <input
                            type="file"
                            id="file-upload"
                            onChange={handleFileChange}
                            className="hidden"
                            disabled={isGenerating}
                            accept=".txt,.csv,.json,.yaml,.yml,.sql,.py,.md"
                        />
                        <label
                            htmlFor="file-upload"
                            className={`flex items-center justify-center gap-2 w-full px-4 py-3 bg-surface border-2 border-dashed border-white/20 rounded-lg text-gray-400 hover:border-blue-500/50 hover:bg-white/5 transition-colors cursor-pointer ${
                                isGenerating ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            <Upload className="h-4 w-4" />
                            <span className="text-sm">Click to upload schema, config, or reference file</span>
                        </label>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <Upload className="h-4 w-4 text-blue-400" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-blue-300 font-medium truncate">{uploadedFile.name}</p>
                            <p className="text-xs text-blue-400/70">
                                {(uploadedFile.size / 1024).toFixed(1)} KB
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={removeFile}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            disabled={isGenerating}
                        >
                            <X className="h-4 w-4 text-gray-400 hover:text-gray-200" />
                        </button>
                    </div>
                )}
                
                <p className="mt-1 text-xs text-gray-500">
                    Upload SQL schemas, config files, or documentation to provide additional context
                </p>
            </div>

            {/* Schedule */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Schedule
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {SCHEDULE_PRESETS.map((preset) => (
                        <button
                            key={preset.value}
                            type="button"
                            onClick={() => setSchedule(preset.value)}
                            disabled={isGenerating}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                schedule === preset.value
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-surface text-gray-300 hover:bg-white/10 border border-white/10'
                            }`}
                        >
                            <span className="mr-1">{preset.icon}</span>
                            {preset.label}
                        </button>
                    ))}
                </div>
                {schedule === 'custom' && (
                    <input
                        type="text"
                        value={customCron}
                        onChange={(e) => setCustomCron(e.target.value)}
                        placeholder="0 0 * * * (cron expression)"
                        className="mt-2 w-full px-4 py-2 bg-surface border border-white/10 rounded-lg text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isGenerating}
                    />
                )}
            </div>

            {/* Data Source & Target */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Data Source
                    </label>
                    <select
                        value={dataSource}
                        onChange={(e) => setDataSource(e.target.value)}
                        className="w-full px-4 py-2 bg-surface border border-white/10 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isGenerating}
                    >
                        <option value="">Select source...</option>
                        {DATA_SOURCES.map((source) => (
                            <option key={source} value={source}>
                                {source}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Data Target
                    </label>
                    <select
                        value={dataTarget}
                        onChange={(e) => setDataTarget(e.target.value)}
                        className="w-full px-4 py-2 bg-surface border border-white/10 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isGenerating}
                    >
                        <option value="">Select target...</option>
                        {DATA_TARGETS.map((target) => (
                            <option key={target} value={target}>
                                {target}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Tags */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                    {COMMON_TAGS.map((tag) => (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            disabled={isGenerating}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                selectedTags.includes(tag)
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-surface text-gray-400 hover:bg-white/10 border border-white/10'
                            }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={customTag}
                        onChange={(e) => setCustomTag(e.target.value)}
                        placeholder="Add custom tag..."
                        className="flex-1 px-4 py-2 bg-surface border border-white/10 rounded-lg text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isGenerating}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                addCustomTag();
                            }
                        }}
                    />
                    <Button
                        type="button"
                        onClick={addCustomTag}
                        variant="outline"
                        disabled={isGenerating || !customTag.trim()}
                    >
                        Add
                    </Button>
                </div>
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isGenerating}
                disabled={isGenerating || !description.trim()}
            >
                {isGenerating ? 'Generating Pipeline...' : 'Generate Pipeline'}
            </Button>

            {/* Helper text */}
            <Card className="bg-blue-500/10 border-blue-500/20">
                <p className="text-xs text-blue-300">
                    💡 <strong>Tip:</strong> The more details you provide, the better the generated pipeline will be. 
                    Include information about data transformations, frequency, and any specific requirements.
                </p>
            </Card>
        </form>
    );
}
