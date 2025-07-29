'use client';

import React from 'react';
import { MessageCircle, Headphones, HelpCircle } from 'lucide-react';
import { useTidioChat } from '@/hooks/useTidioChat';

interface ChatTriggerProps {
  /**
   * Trigger button variant
   */
  variant?: 'default' | 'help' | 'support';
  
  /**
   * Button size
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Custom trigger text
   */
  text?: string;
  
  /**
   * Show as floating action button
   */
  floating?: boolean;
  
  /**
   * Custom CSS classes
   */
  className?: string;
}

const ChatTrigger: React.FC<ChatTriggerProps> = ({
  variant = 'default',
  size = 'md',
  text,
  floating = false,
  className = ''
}) => {
  const { openChat, isReady } = useTidioChat({
    autoOpenForNewUsers: true,
    hideOnPages: ['/admin'] // Hide on admin pages
  });

  const getIcon = () => {
    switch (variant) {
      case 'help':
        return <HelpCircle className={`${getIconSize()} text-current`} />;
      case 'support':
        return <Headphones className={`${getIconSize()} text-current`} />;
      default:
        return <MessageCircle className={`${getIconSize()} text-current`} />;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-6 h-6';
      default:
        return 'w-5 h-5';
    }
  };

  const getText = () => {
    if (text) return text;
    
    switch (variant) {
      case 'help':
        return 'Get Help';
      case 'support':
        return 'Contact Support';
      default:
        return 'Live Chat';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-sm';
      case 'lg':
        return 'px-6 py-4 text-lg';
      default:
        return 'px-4 py-3 text-base';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'help':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      case 'support':
        return 'bg-green-600 hover:bg-green-700 text-white';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  const baseClasses = `
    inline-flex items-center space-x-2 rounded-lg font-medium
    transition-all duration-200 transform hover:scale-105
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
  `;

  const floatingClasses = floating ? `
    fixed bottom-6 right-6 z-50 shadow-2xl
    animate-pulse hover:animate-none
  ` : '';

  const handleClick = () => {
    if (isReady) {
      openChat();
    } else {
      console.warn('[ChatTrigger] Tidio chat is not ready yet');
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={!isReady}
      className={`
        ${baseClasses}
        ${getSizeClasses()}
        ${getVariantClasses()}
        ${floatingClasses}
        ${className}
      `}
      title={getText()}
    >
      {getIcon()}
      {!floating && <span>{getText()}</span>}
    </button>
  );
};

export default ChatTrigger;