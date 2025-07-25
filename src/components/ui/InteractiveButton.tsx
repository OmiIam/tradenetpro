'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface InteractiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'magnetic' | 'ripple' | 'glow' | 'morph' | 'liquid';
  children: React.ReactNode;
}

export default function InteractiveButton({
  variant = 'magnetic',
  className,
  children,
  ...props
}: InteractiveButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setMousePosition({ x, y });
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (variant === 'ripple') {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newRipple = { id: Date.now(), x, y };
      setRipples(prev => [...prev, newRipple]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
      }, 600);
    }
    
    props.onClick?.(e);
  };

  const getButtonVariant = () => {
    switch (variant) {
      case 'magnetic':
        return (
          <motion.button
            className={cn(
              'relative px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors overflow-hidden',
              className
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              x: isHovered ? mousePosition.x * 0.1 : 0,
              y: isHovered ? mousePosition.y * 0.1 : 0,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseMove={handleMouseMove}
            {...props}
          >
            {children}
          </motion.button>
        );

      case 'ripple':
        return (
          <motion.button
            className={cn(
              'relative px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors overflow-hidden',
              className
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClick}
            {...props}
          >
            {children}
            {ripples.map((ripple) => (
              <motion.div
                key={ripple.id}
                className="absolute bg-white/30 rounded-full pointer-events-none"
                style={{
                  left: ripple.x,
                  top: ripple.y,
                  transform: 'translate(-50%, -50%)'
                }}
                initial={{ width: 0, height: 0, opacity: 1 }}
                animate={{
                  width: 300,
                  height: 300,
                  opacity: 0
                }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            ))}
          </motion.button>
        );

      case 'glow':
        return (
          <motion.button
            className={cn(
              'relative px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg transition-all overflow-hidden',
              className
            )}
            whileHover={{
              scale: 1.05,
              boxShadow: '0 0 30px rgba(59, 130, 246, 0.6)',
              backgroundColor: '#2563eb'
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            {...props}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0"
              whileHover={{ opacity: 0.3 }}
              transition={{ duration: 0.3 }}
            />
            <span className="relative z-10">{children}</span>
          </motion.button>
        );

      case 'morph':
        return (
          <motion.button
            className={cn(
              'relative px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg transition-colors overflow-hidden',
              className
            )}
            whileHover={{
              borderRadius: '20px',
              backgroundColor: '#1d4ed8'
            }}
            whileTap={{
              borderRadius: '4px',
              scale: 0.95
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            {...props}
          >
            <motion.div
              className="absolute inset-0"
              whileHover={{
                background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #3b82f6)',
                backgroundSize: '200% 200%'
              }}
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
            <span className="relative z-10">{children}</span>
          </motion.button>
        );

      case 'liquid':
        return (
          <motion.button
            className={cn(
              'relative px-6 py-3 bg-slate-800 border-2 border-blue-500 text-blue-500 font-semibold rounded-lg overflow-hidden group',
              className
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            {...props}
          >
            <motion.div
              className="absolute inset-0 bg-blue-500"
              initial={{ x: '-100%' }}
              whileHover={{ x: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
            <motion.span
              className="relative z-10 group-hover:text-white transition-colors"
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.span>
          </motion.button>
        );

      default:
        return (
          <button className={className} {...props}>
            {children}
          </button>
        );
    }
  };

  return getButtonVariant();
}