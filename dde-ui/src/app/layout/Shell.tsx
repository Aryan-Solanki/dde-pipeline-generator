import { ReactNode } from 'react';

export function Shell({ children }: { children: ReactNode }) {
    return (
        <div className="flex h-screen w-full bg-background text-primary overflow-hidden font-sans">
            <main className="flex-1 flex flex-col min-w-0 bg-background relative">
                <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />
                <div className="flex-1 flex flex-col relative z-0 min-h-0 overflow-hidden">
                    {children}
                </div>
            </main>
        </div>
    );
}
