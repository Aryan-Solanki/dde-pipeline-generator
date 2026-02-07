import type { Message } from "../types";
import { cn } from "../../../shared/lib/cn";

interface MessageListProps {
    messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
    return (
        <div className="w-full flex-1 overflow-y-auto min-h-0">
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-8 pb-32">
                {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}
            </div>
        </div>
    );
}

function MessageBubble({ message }: { message: Message }) {
    const isUser = message.role === "user";

    return (
        <div
            className={cn(
                "flex w-full",
                isUser ? "justify-end" : "justify-start"
            )}
        >
            <div
                className={cn(
                    // bubble shape + spacing
                    "max-w-[75%] rounded-2xl px-5 py-3 text-base leading-relaxed",
                    // colors
                    isUser
                        ? "bg-blue-600 text-white"
                        : "bg-surface text-gray-200 border border-white/10"
                )}
            >
                {message.content}
            </div>
        </div>
    );
}
