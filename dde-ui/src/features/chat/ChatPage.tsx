import { ChevronDown, MoreHorizontal } from "lucide-react";
import { useState } from "react";

import { Button } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";
import { MessageList } from "./components/MessageList";
import { Composer } from "./components/Composer";
import { suggestions } from "./mock";
import type { Message } from "./types";
import { sendChatStream } from "./api";

export function ChatPage() {
    // const [messages, setMessages] = useState<Message[]>([
    //     { id: '1', content: 'Hello there! How can I help you today?', role: 'assistant' },
    //     { id: '2', content: 'I need some information abousome information abousome information abousome information abousome information abousome information abousome information abousome information abousome information abousome information abousome information abousome information abousome information abousome information abousome information abousome information abousome information abousome information abousome information abousome information abousome information abousome information abousome information abousome information abousome information abousome information abousome information about the latest AI trends.I need some information about the latest AI trends.I need some information about the latest AI trends.I need some information about the latest AI trends.I need some information about the latest AI trends.I need some information about the latest AI trends.I need some information about the latest AI trends.I need some information about the latest AI trends.I need some information about the latest AI trends.I need some information about the latest AI trends.I need some information about the latest AI trends.I need some information about the latest AI trends.I need some information about the latest AI trends.I need some information about the latest AI trends.I need some information about the latest AI trends.I need some information about the latest AI trends.I need some information about the latest AI trends.I need some information about the latest AI trends.I need some information about the latest AI trends.I need some information about the latest AI trends.I need some information about the latest AI trends.I need some information about the latest AI trends.I need some information about the latest AI trends.I need some information about the latest AI trends.I need some information about the latest AI trends.I need some information about the latest AI trends.I need some information about the latest AI trends.I need some information about the latest AI trends.I need some information about the latest AI trends.I need some information about the latest AI trends.', role: 'user' },
    //     { id: '3', content: 'Certainly! Are you interested in a specific area like machine learning, natural language processing, or computer vision?', role: 'assistant' },
    // ]);

    const [messages, setMessages] = useState<Message[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);

    const handleSend = async (text: string) => {
        if (isStreaming) return;

        const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };

        const assistantId = crypto.randomUUID();
        const assistantMsg: Message = { id: assistantId, role: "assistant", content: "…" };

        setMessages((prev) => [...prev, userMsg, assistantMsg]);
        setIsStreaming(true);

        try {
            await sendChatStream(text, (chunk) => {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantId
                            ? { ...m, content: m.content === "…" ? chunk : m.content + chunk }
                            : m
                    )
                );
            });
        } catch (err: any) {
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === assistantId
                        ? { ...m, content: `Error: ${err?.message ?? "Streaming failed"}` }
                        : m
                )
            );
        } finally {
            setIsStreaming(false);
        }
    };

    const isEmpty = messages.length === 0;

    return (
        <div className="flex flex-1 flex-col h-full relative">
            {/* Top Bar */}
            <div className="fixed top-0 right-0 left-0 z-10 flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        className="text-gray-400 hover:text-white flex items-center gap-2 text-base font-normal"
                    >
                        AI Assistant <ChevronDown className="h-4 w-4" />
                    </Button>
                </div>
                <Button variant="ghost" size="icon" className="text-gray-400">
                    <MoreHorizontal className="h-5 w-5" />
                </Button>
            </div>

            <div className="flex-1 flex flex-col w-full min-h-0 pt-16">
                {isEmpty ? (
                    <div className="w-full flex flex-col items-center justify-center flex-1 space-y-12">
                        <div className="flex flex-col items-center justify-center">
                            <div className="mb-6 h-20 w-20 rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 opacity-80 blur-sm shadow-[0_0_60px_rgba(59,130,246,0.5)]"></div>
                            <h1 className="text-center text-3xl font-medium text-white mb-2">
                                Good Evening, DeepAI.
                            </h1>
                            <h2 className="text-center text-3xl font-medium text-white/50">
                                Can I help you with anything ?
                            </h2>
                        </div>
                    </div>
                ) : (
                    <MessageList messages={messages} />
                )}
            </div>

            {/* Footer Area */}
            <div className="w-full max-w-4xl mx-auto p-4 pb-8">
                <Composer onSend={handleSend} disabled={isStreaming} />

                {isEmpty && (
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {suggestions.map((s) => (
                            <Card key={s.id} hoverEffect className="cursor-pointer">
                                <h3 className="mb-2 font-medium text-white">{s.title}</h3>
                                <p className="text-sm text-gray-400 line-clamp-2">{s.description}</p>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
