'use client';

import React, { useEffect } from 'react';
import Script from 'next/script';

interface TidioChatProps {
  /**
   * Tidio public key - unique identifier for your Tidio account
   */
  publicKey?: string;
  
  /**
   * Hide the chat widget on certain pages or conditions
   */
  isHidden?: boolean;
  
  /**
   * Custom styling for the chat widget position
   */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  
  /**
   * Callback when chat widget is loaded
   */
  onLoad?: () => void;
}

declare global {
  interface Window {
    tidioChatApi?: {
      hide: () => void;
      show: () => void;
      open: () => void;
      close: () => void;
      on: (event: string, callback: Function) => void;
      setContactProperties: (properties: Record<string, any>) => void;
      setVisitorData: (data: Record<string, any>) => void;
    };
  }
}

const TidioChat: React.FC<TidioChatProps> = ({ 
  publicKey = '1xv2gnskflxih4vhlpybxvhw4qcbgxma',
  isHidden = false,
  position = 'bottom-right',
  onLoad 
}) => {
  useEffect(() => {
    // Handle visibility
    if (typeof window !== 'undefined' && window.tidioChatApi) {
      if (isHidden) {
        window.tidioChatApi.hide();
      } else {
        window.tidioChatApi.show();
      }
    }
  }, [isHidden]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Set up event listeners when chat is loaded
    const handleChatLoad = () => {
      if (window.tidioChatApi) {
        // Configure chat position if needed
        const positionStyles = {
          'bottom-right': { bottom: '20px', right: '20px' },
          'bottom-left': { bottom: '20px', left: '20px' },
          'top-right': { top: '20px', right: '20px' },
          'top-left': { top: '20px', left: '20px' }
        };

        // Call onLoad callback
        if (onLoad) {
          onLoad();
        }

        // Set up event listeners for analytics or custom behavior
        window.tidioChatApi.on('ready', () => {
          console.log('[Tidio] Chat widget is ready');
        });

        window.tidioChatApi.on('open', () => {
          console.log('[Tidio] Chat opened');
          // You can add analytics tracking here
        });

        window.tidioChatApi.on('close', () => {
          console.log('[Tidio] Chat closed');
        });
      }
    };

    // Listen for when Tidio is loaded
    const checkTidioLoaded = setInterval(() => {
      if (window.tidioChatApi) {
        clearInterval(checkTidioLoaded);
        handleChatLoad();
      }
    }, 100);

    return () => {
      clearInterval(checkTidioLoaded);
    };
  }, [onLoad]);

  return (
    <Script 
      src={`//code.tidio.co/${publicKey}.js`}
      strategy="afterInteractive"
      id="tidio-chat-widget"
      onLoad={() => {
        console.log('[Tidio] Script loaded successfully');
      }}
      onError={(error) => {
        console.error('[Tidio] Failed to load chat widget:', error);
      }}
    />
  );
};

export default TidioChat;