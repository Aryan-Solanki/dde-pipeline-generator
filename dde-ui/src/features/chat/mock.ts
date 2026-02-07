import type { Suggestion, Thread, User } from './types';

export const currentUser: User = {
    id: 'u1',
    name: 'Judha Maygustya',
    plan: 'Free',
    avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80',
};

export const threadsTomorrow: Thread[] = [
    { id: 't1', title: "What's one lesson life has taught you r...", updatedAt: new Date() },
    { id: 't2', title: "What's one mistake that taught you a val...", updatedAt: new Date() },
    { id: 't3', title: "What's one goal that excites you the mos...", updatedAt: new Date() },
];

export const threadsPast: Thread[] = [
    { id: 't4', title: "If animals could talk, which one would be...", updatedAt: new Date() },
    { id: 't5', title: "What's one word to describe your day?", updatedAt: new Date() },
    { id: 't6', title: "What's one habit you want to break?", updatedAt: new Date() },
];

export const suggestions: Suggestion[] = [
    {
        id: 's1',
        title: 'Smart Budget',
        description: 'A budget that fits your lifestyle, not the other way around',
    },
    {
        id: 's2',
        title: 'Analytics',
        description: 'Analytics empowers individuals and businesses to make smarter',
    },
    {
        id: 's3',
        title: 'Spending',
        description: 'Spending is the way individuals and businesses use their financial',
    },
];
