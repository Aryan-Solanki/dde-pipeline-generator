import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/cn';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'ghost' | 'outline' | 'secondary' | 'icon';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400 disabled:pointer-events-none disabled:opacity-50',
                    {
                        'bg-white text-black hover:bg-gray-200': variant === 'primary',
                        'bg-gray-800 text-white hover:bg-gray-700': variant === 'secondary',
                        'border border-gray-800 hover:bg-gray-800 text-gray-300': variant === 'outline',
                        'hover:bg-white/5 text-gray-400 hover:text-white': variant === 'ghost',
                        'hover:bg-white/10 text-gray-400 hover:text-white': variant === 'icon',
                        'h-8 px-3 text-xs': size === 'sm',
                        'h-10 px-4 py-2': size === 'md',
                        'h-12 px-6': size === 'lg',
                        'h-10 w-10 p-2': size === 'icon',
                    },
                    className
                )}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
