'use client';

import { useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface TidioChatHookOptions {
  /**
   * Hide chat for specific user roles
   */
  hideForRoles?: string[];
  
  /**
   * Hide chat on specific pages
   */
  hideOnPages?: string[];
  
  /**
   * Auto-open chat for new users
   */
  autoOpenForNewUsers?: boolean;
}

export const useTidioChat = (options: TidioChatHookOptions = {}) => {
  const { user } = useAuth();
  const { hideForRoles = [], hideOnPages = ['/login', '/signup'], autoOpenForNewUsers = false } = options;

  // Set user data in Tidio chat
  const setUserData = useCallback(() => {
    if (typeof window !== 'undefined' && window.tidioChatApi && user) {
      // Set contact properties for better customer support
      window.tidioChatApi.setContactProperties({
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        user_id: user.id?.toString(),
        role: user.role,
        kyc_status: (user as any).kyc_status || 'pending',
        account_funded: (user as any).account_funded ? 'Yes' : 'No',
        created_at: user.created_at,
        last_login: (user as any).last_login || 'Never'
      });

      // Set visitor data for analytics
      window.tidioChatApi.setVisitorData({
        user_type: user.role,
        registration_date: user.created_at,
        kyc_verified: (user as any).kyc_status === 'approved',
        has_funded_account: (user as any).account_funded || false
      });

      console.log('[Tidio] User data synchronized');
    }
  }, [user]);

  // Control chat visibility
  const setChatVisibility = useCallback((visible: boolean) => {
    if (typeof window !== 'undefined' && window.tidioChatApi) {
      if (visible) {
        window.tidioChatApi.show();
      } else {
        window.tidioChatApi.hide();
      }
    }
  }, []);

  // Open chat programmatically
  const openChat = useCallback(() => {
    if (typeof window !== 'undefined' && window.tidioChatApi) {
      window.tidioChatApi.open();
    }
  }, []);

  // Close chat programmatically
  const closeChat = useCallback(() => {
    if (typeof window !== 'undefined' && window.tidioChatApi) {
      window.tidioChatApi.close();
    }
  }, []);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const initializeChat = () => {
      if (!window.tidioChatApi) return;

      // Set user data if user is logged in
      if (user) {
        setUserData();

        // Auto-open for new users (registered in last 24 hours)
        if (autoOpenForNewUsers && user.created_at) {
          const createdAt = new Date(user.created_at);
          const now = new Date();
          const hoursSinceRegistration = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceRegistration < 24) {
            setTimeout(() => {
              openChat();
            }, 5000); // Open after 5 seconds for new users
          }
        }
      }

      // Handle visibility based on user role
      if (user && hideForRoles.includes(user.role)) {
        setChatVisibility(false);
        return;
      }

      // Handle visibility based on current page
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (hideOnPages.some(page => currentPath.includes(page))) {
          setChatVisibility(false);
          return;
        }
      }

      // Show chat by default
      setChatVisibility(true);
    };

    // Wait for Tidio to load
    const checkTidioReady = setInterval(() => {
      if (typeof window !== 'undefined' && window.tidioChatApi) {
        clearInterval(checkTidioReady);
        initializeChat();
      }
    }, 500);

    return () => {
      clearInterval(checkTidioReady);
    };
  }, [user, hideForRoles, hideOnPages, autoOpenForNewUsers, setUserData, setChatVisibility, openChat]);

  return {
    openChat,
    closeChat,
    setChatVisibility,
    setUserData,
    isReady: typeof window !== 'undefined' && !!window.tidioChatApi
  };
};

export default useTidioChat;