import { useMemo } from 'react';
import { ArrowRight, PlayCircle, CheckCircle2, AlertCircle } from 'lucide-react';

interface Task {
    task_id: string;
    operator_type: string;
    description?: string;
    dependencies?: string[];
}

interface PipelineVisualizerProps {
    tasks: Task[];
    dagId?: string;
}

interface TaskNode {
    task: Task;
    level: number;
    column: number;
}

export function PipelineVisualizer({ tasks, dagId }: PipelineVisualizerProps) {
    // Calculate task levels and positions for visualization
    const taskLayout = useMemo(() => {
        if (!tasks || tasks.length === 0) return [];

        const taskMap = new Map<string, Task>();
        tasks.forEach(task => taskMap.set(task.task_id, task));

        // Calculate levels (topological sort)
        const levels = new Map<string, number>();
        const visited = new Set<string>();

        const calculateLevel = (taskId: string): number => {
            if (levels.has(taskId)) return levels.get(taskId)!;
            if (visited.has(taskId)) return 0; // Circular dependency

            visited.add(taskId);
            const task = taskMap.get(taskId);
            if (!task || !task.dependencies || task.dependencies.length === 0) {
                levels.set(taskId, 0);
                return 0;
            }

            const maxDependencyLevel = Math.max(
                ...task.dependencies.map(dep => calculateLevel(dep))
            );
            const level = maxDependencyLevel + 1;
            levels.set(taskId, level);
            return level;
        };

        tasks.forEach(task => calculateLevel(task.task_id));

        // Group tasks by level
        const levelGroups = new Map<number, Task[]>();
        tasks.forEach(task => {
            const level = levels.get(task.task_id) || 0;
            if (!levelGroups.has(level)) {
                levelGroups.set(level, []);
            }
            levelGroups.get(level)!.push(task);
        });

        // Create layout with positions
        const layout: TaskNode[] = [];
        levelGroups.forEach((tasksInLevel, level) => {
            tasksInLevel.forEach((task, index) => {
                layout.push({
                    task,
                    level,
                    column: index
                });
            });
        });

        return layout;
    }, [tasks]);

    const maxLevel = Math.max(...taskLayout.map(n => n.level), 0);

    if (!tasks || tasks.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-surface border border-white/10 rounded-lg border-dashed">
                <p className="text-gray-500 text-sm">No tasks to visualize</p>
            </div>
        );
    }

    const getOperatorColor = (operatorType: string): string => {
        if (operatorType.includes('Python')) return 'bg-blue-500/20 border-blue-500/40 text-blue-300';
        if (operatorType.includes('Postgres') || operatorType.includes('MySql') || operatorType.includes('Sql')) 
            return 'bg-purple-500/20 border-purple-500/40 text-purple-300';
        if (operatorType.includes('S3') || operatorType.includes('GCS') || operatorType.includes('Blob')) 
            return 'bg-green-500/20 border-green-500/40 text-green-300';
        if (operatorType.includes('Spark') || operatorType.includes('Databricks')) 
            return 'bg-orange-500/20 border-orange-500/40 text-orange-300';
        if (operatorType.includes('BigQuery') || operatorType.includes('Snowflake') || operatorType.includes('Redshift')) 
            return 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300';
        if (operatorType.includes('Bash') || operatorType.includes('Docker') || operatorType.includes('Kubernetes')) 
            return 'bg-gray-500/20 border-gray-500/40 text-gray-300';
        return 'bg-pink-500/20 border-pink-500/40 text-pink-300';
    };

    const getOperatorIcon = (operatorType: string) => {
        if (operatorType.includes('Python')) return '🐍';
        if (operatorType.includes('Sql') || operatorType.includes('Postgres') || operatorType.includes('MySql')) return '🗄️';
        if (operatorType.includes('S3') || operatorType.includes('GCS')) return '☁️';
        if (operatorType.includes('Spark')) return '⚡';
        if (operatorType.includes('BigQuery') || operatorType.includes('Snowflake')) return '📊';
        if (operatorType.includes('Bash')) return '💻';
        if (operatorType.includes('Email')) return '📧';
        if (operatorType.includes('Sensor')) return '👁️';
        return '⚙️';
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            {dagId && (
                <div className="flex items-center gap-2 text-sm">
                    <PlayCircle className="h-4 w-4 text-blue-500" />
                    <span className="text-gray-400">Pipeline:</span>
                    <span className="text-white font-mono">{dagId}</span>
                </div>
            )}

            {/* Visualization */}
            <div className="bg-surface border border-white/10 rounded-lg p-6 overflow-x-auto">
                <div className="min-w-max">
                    {/* Grid Layout */}
                    <div className="relative" style={{ minHeight: `${Math.max(taskLayout.length * 80, 200)}px` }}>
                        {/* Draw connections first (behind nodes) */}
                        <svg 
                            className="absolute inset-0 w-full h-full pointer-events-none" 
                            style={{ zIndex: 0 }}
                        >
                            {taskLayout.map(node => {
                                const task = node.task;
                                if (!task.dependencies || task.dependencies.length === 0) return null;

                                return task.dependencies.map(depId => {
                                    const depNode = taskLayout.find(n => n.task.task_id === depId);
                                    if (!depNode) return null;

                                    const startX = depNode.level * 280 + 240;
                                    const startY = depNode.column * 100 + 50;
                                    const endX = node.level * 280 + 40;
                                    const endY = node.column * 100 + 50;

                                    return (
                                        <g key={`${depId}-${task.task_id}`}>
                                            <line
                                                x1={startX}
                                                y1={startY}
                                                x2={endX}
                                                y2={endY}
                                                stroke="rgba(255,255,255,0.1)"
                                                strokeWidth="2"
                                                markerEnd="url(#arrowhead)"
                                            />
                                        </g>
                                    );
                                });
                            })}
                            <defs>
                                <marker
                                    id="arrowhead"
                                    markerWidth="10"
                                    markerHeight="10"
                                    refX="9"
                                    refY="3"
                                    orient="auto"
                                >
                                    <polygon
                                        points="0 0, 10 3, 0 6"
                                        fill="rgba(255,255,255,0.1)"
                                    />
                                </marker>
                            </defs>
                        </svg>

                        {/* Task Nodes */}
                        {taskLayout.map((node) => {
                            const task = node.task;
                            const colorClass = getOperatorColor(task.operator_type);
                            const icon = getOperatorIcon(task.operator_type);

                            return (
                                <div
                                    key={task.task_id}
                                    className="absolute"
                                    style={{
                                        left: `${node.level * 280}px`,
                                        top: `${node.column * 100}px`,
                                        zIndex: 10
                                    }}
                                >
                                    <div
                                        className={`w-56 border-2 rounded-lg p-3 ${colorClass} backdrop-blur-sm transition-all hover:scale-105 hover:shadow-lg cursor-pointer`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <span className="text-xl">{icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm truncate">
                                                    {task.task_id}
                                                </div>
                                                <div className="text-xs opacity-80 truncate mt-0.5">
                                                    {task.operator_type}
                                                </div>
                                                {task.description && (
                                                    <div className="text-xs opacity-60 mt-1 line-clamp-2">
                                                        {task.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {task.dependencies && task.dependencies.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-white/10">
                                                <div className="text-xs opacity-60 flex items-center gap-1">
                                                    <ArrowRight className="h-3 w-3" />
                                                    <span className="truncate">
                                                        After: {task.dependencies.join(', ')}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-blue-500/40 border border-blue-500/60"></div>
                    <span className="text-gray-400">Python</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-purple-500/40 border border-purple-500/60"></div>
                    <span className="text-gray-400">Database</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-green-500/40 border border-green-500/60"></div>
                    <span className="text-gray-400">Storage</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-cyan-500/40 border border-cyan-500/60"></div>
                    <span className="text-gray-400">Warehouse</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-orange-500/40 border border-orange-500/60"></div>
                    <span className="text-gray-400">Compute</span>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-background rounded-lg p-3 border border-white/5">
                    <div className="text-xs text-gray-500 mb-1">Total Tasks</div>
                    <div className="text-lg font-semibold text-white">{tasks.length}</div>
                </div>
                <div className="bg-background rounded-lg p-3 border border-white/5">
                    <div className="text-xs text-gray-500 mb-1">Pipeline Depth</div>
                    <div className="text-lg font-semibold text-white">{maxLevel + 1}</div>
                </div>
                <div className="bg-background rounded-lg p-3 border border-white/5">
                    <div className="text-xs text-gray-500 mb-1">Dependencies</div>
                    <div className="text-lg font-semibold text-white">
                        {tasks.reduce((sum, t) => sum + (t.dependencies?.length || 0), 0)}
                    </div>
                </div>
            </div>
        </div>
    );
}
