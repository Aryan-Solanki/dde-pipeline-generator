export interface User {
    id: string;
    name: string;
    avatarUrl?: string;
    plan: 'Free' | 'Pro';
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export interface Thread {
    id: string;
    title: string;
    updatedAt: Date;
}

export interface Suggestion {
    id: string;
    title: string;
    description: string;
}
