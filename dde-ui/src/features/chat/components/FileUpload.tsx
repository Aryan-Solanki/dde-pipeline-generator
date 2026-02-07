import { Upload, File, X, Check, AlertCircle, FileCode, FileText } from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "../../../shared/ui/Button";

interface UploadedFile {
    filename: string;
    size: number;
    type: string;
    fileType?: string;
    uploadedAt: string;
    dagId?: string;
    packageCount?: number;
    airflowDetected?: boolean;
    airflowIncluded?: boolean;
}

interface FileUploadProps {
    onFileUploaded?: (file: UploadedFile) => void;
    acceptedTypes?: string[];
    maxSize?: number; // in MB
    multiple?: boolean;
}

export function FileUpload({ 
    onFileUploaded, 
    acceptedTypes = ['.py', '.txt', '.json', '.yaml', '.yml'],
    maxSize = 5,
    multiple = false
}: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        await uploadFiles(files);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        await uploadFiles(files);
    };

    const uploadFiles = async (files: File[]) => {
        if (files.length === 0) return;

        // Validate file types
        const invalidFiles = files.filter(file => {
            const ext = '.' + file.name.split('.').pop()?.toLowerCase();
            return !acceptedTypes.includes(ext);
        });

        if (invalidFiles.length > 0) {
            setError(`Invalid file types: ${invalidFiles.map(f => f.name).join(', ')}`);
            return;
        }

        // Validate file sizes
        const oversizedFiles = files.filter(file => file.size > maxSize * 1024 * 1024);
        if (oversizedFiles.length > 0) {
            setError(`Files exceed ${maxSize}MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
            return;
        }

        setUploading(true);
        setError(null);

        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);

                const res = await fetch('http://localhost:5050/api/files/upload', {
                    method: 'POST',
                    body: formData
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || `Upload failed: ${res.status}`);
                }

                const result = await res.json();
                const uploadedFile = result.file;

                setUploadedFiles(prev => [...prev, uploadedFile]);
                
                if (onFileUploaded) {
                    onFileUploaded(uploadedFile);
                }

                console.log('File uploaded:', uploadedFile.filename);
            }
        } catch (err: any) {
            setError(err.message || 'Upload failed');
            console.error('Upload error:', err);
        } finally {
            setUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const removeFile = (filename: string) => {
        setUploadedFiles(prev => prev.filter(f => f.filename !== filename));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getFileIcon = (type: string, fileType?: string) => {
        if (fileType === 'python_dag' || type === '.py') {
            return <FileCode className="h-5 w-5 text-blue-400" />;
        }
        if (fileType === 'requirements' || type === '.txt') {
            return <FileText className="h-5 w-5 text-green-400" />;
        }
        return <File className="h-5 w-5 text-gray-400" />;
    };

    return (
        <div className="space-y-4">
            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-600 hover:border-gray-500'
                }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptedTypes.join(',')}
                    multiple={multiple}
                    onChange={handleFileSelect}
                    className="hidden"
                />

                <Upload className={`h-12 w-12 mx-auto mb-4 ${
                    isDragging ? 'text-blue-400' : 'text-gray-500'
                }`} />

                <p className="text-gray-300 mb-2">
                    {multiple ? 'Drop files here or click to browse' : 'Drop file here or click to browse'}
                </p>
                
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="mt-2"
                >
                    {uploading ? 'Uploading...' : 'Select File'}
                </Button>

                <p className="text-xs text-gray-500 mt-3">
                    Accepted: {acceptedTypes.join(', ')} • Max size: {maxSize}MB
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-300">Uploaded Files</h4>
                    {uploadedFiles.map((file, idx) => (
                        <div
                            key={idx}
                            className="flex items-center gap-3 p-3 bg-surface border border-white/10 rounded-lg"
                        >
                            {getFileIcon(file.type, file.fileType)}
                            
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{file.filename}</p>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs text-gray-500">
                                        {formatFileSize(file.size)}
                                    </span>
                                    
                                    {file.fileType === 'python_dag' && file.dagId && (
                                        <span className="text-xs text-blue-400">
                                            DAG: {file.dagId}
                                        </span>
                                    )}
                                    
                                    {file.fileType === 'requirements' && file.packageCount !== undefined && (
                                        <span className="text-xs text-green-400">
                                            {file.packageCount} packages
                                        </span>
                                    )}
                                    
                                    {file.airflowDetected && (
                                        <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">
                                            Airflow
                                        </span>
                                    )}
                                    
                                    {file.airflowIncluded && (
                                        <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-300 rounded">
                                            Airflow Included
                                        </span>
                                    )}
                                </div>
                            </div>

                            <Check className="h-5 w-5 text-green-400" />
                            
                            <button
                                onClick={() => removeFile(file.filename)}
                                className="p-1 hover:bg-white/5 rounded transition-colors"
                            >
                                <X className="h-4 w-4 text-gray-400 hover:text-red-400" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
