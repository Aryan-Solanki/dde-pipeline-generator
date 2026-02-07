import { Home, LayoutTemplate, Compass, History, Wallet, Command, Search, MoreHorizontal } from 'lucide-react';
import { cn } from '../../../shared/lib/cn';
import { currentUser, threadsPast, threadsTomorrow } from '../mock';
import { Button } from '../../../shared/ui/Button';
import { ThreadItem } from './ThreadItem';
import { type ReactNode } from 'react';

export function Sidebar() {
    return (
        <aside className="flex h-screen w-[280px] flex-col bg-sidebar text-gray-400 border-r border-white/5 p-4">
            {/* Header */}
            <div className="mb-6 flex items-center gap-2 px-2">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-black font-bold">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 22H22L12 2Z" fill="currentColor" />
                    </svg>
                </div>
                <span className="text-xl font-semibold text-white">DDE</span>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <input
                    placeholder="Search chats"
                    className="w-full rounded-lg bg-surface py-2 pl-9 pr-8 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
                />
                <Command className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
            </div>

            {/* Navigation */}
            <nav className="space-y-1 mb-8">
                <NavItem icon={<Home className="h-5 w-5" />} label="Home" active />
                <NavItem icon={<LayoutTemplate className="h-5 w-5" />} label="Templates" />
                <NavItem icon={<Compass className="h-5 w-5" />} label="Explore" />
                <NavItem icon={<History className="h-5 w-5" />} label="History" />
                <NavItem icon={<Wallet className="h-5 w-5" />} label="Wallet" />
            </nav>

            {/* History Sections */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                <div>
                    <h3 className="px-2 text-xs font-semibold text-gray-500 mb-2">Tommorow</h3>
                    <div className="space-y-1">
                        {threadsTomorrow.map((t) => (
                            <ThreadItem key={t.id} thread={t} />
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="px-2 text-xs font-semibold text-gray-500 mb-2">10 daysAgo</h3>
                    <div className="space-y-1">
                        {threadsPast.map((t) => (
                            <ThreadItem key={t.id} thread={t} />
                        ))}
                    </div>
                </div>
            </div>

            {/* User Footer */}
            <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-3">
                    <img src={currentUser.avatarUrl} alt="User" className="h-8 w-8 rounded-full bg-gray-700 object-cover" />
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{currentUser.name}</span>
                        <span className="text-xs text-gray-500">{currentUser.plan}</span>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="text-gray-500">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </div>
        </aside>
    );
}

function NavItem({ icon, label, active }: { icon: ReactNode; label: string; active?: boolean }) {
    return (
        <button
            className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "text-white" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
            )}
        >
            {icon}
            {label}
        </button>
    );
}
