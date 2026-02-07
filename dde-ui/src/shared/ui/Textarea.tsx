import React, { TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { }

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, ...props }, ref) => {
        return (
            <textarea
                ref={ref}
                className={cn(
                    'flex min-h-[60px] w-full rounded-md bg-transparent px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none',
                    className
                )}
                {...props}
            />
        );
    }
);

Textarea.displayName = 'Textarea';
