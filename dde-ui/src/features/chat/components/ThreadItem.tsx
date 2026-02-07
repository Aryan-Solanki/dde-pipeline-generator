import type { Thread } from '../types';
import { cn } from '../../../shared/lib/cn';

interface ThreadItemProps {
    thread: Thread;
    active?: boolean;
    onClick?: () => void;
}

export function ThreadItem({ thread, active, onClick }: ThreadItemProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "cursor-pointer truncate rounded-md px-2 py-1.5 text-sm transition-colors",
                active ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-gray-300"
            )}
        >
            {thread.title}
        </div>
    );
}
