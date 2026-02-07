import { useState } from "react";
import { Paperclip, Mic, AudioLines, Globe, Image as ImageIcon } from "lucide-react";
import { Textarea } from "../../../shared/ui/Textarea";
import { Button } from "../../../shared/ui/Button";

type ComposerProps = {
    onSend: (text: string) => void;
    disabled?: boolean;
};

export function Composer({ onSend, disabled }: ComposerProps) {
    const [text, setText] = useState("");

    const send = () => {
        const t = text.trim();
        if (!t || disabled) return;
        onSend(t);
        setText("");
    };

    return (
        <div className="relative rounded-2xl border border-white/10 bg-surface/50 p-3 backdrop-blur-md">
            <Textarea
                value={text}
                onChange={(e) => setText((e.target as HTMLTextAreaElement).value)}
                placeholder="Message AI Chat..."
                className="mb-10 text-base placeholder:text-gray-500 min-h-[50px]"
                disabled={disabled}
                onKeyDown={(e) => {
                    // Enter sends, Shift+Enter new line
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                    }
                }}
            />

            <div className="absolute bottom-3 left-3 flex items-center gap-3">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400" disabled={disabled}>
                    <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 border-white/10 bg-transparent text-gray-300 hover:bg-white/5"
                    disabled={disabled}
                >
                    <ImageIcon className="h-3.5 w-3.5" />
                    Create an image
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 border-white/10 bg-transparent text-gray-300 hover:bg-white/5"
                    disabled={disabled}
                >
                    <Globe className="h-3.5 w-3.5" />
                    Search the web
                </Button>
            </div>

            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400" disabled={disabled}>
                    <Mic className="h-4 w-4" />
                </Button>

                {/* Send button */}
                <Button
                    variant="secondary"
                    size="icon"
                    onClick={send}
                    className="h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20"
                    disabled={disabled || !text.trim()}
                    aria-label="Send message"
                    title="Send"
                >
                    <AudioLines className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
