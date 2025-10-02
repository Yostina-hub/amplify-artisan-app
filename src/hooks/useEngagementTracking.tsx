import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Generate a session ID that persists across page navigation
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('engagement_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    sessionStorage.setItem('engagement_session_id', sessionId);
  }
  return sessionId;
};

export const useEngagementTracking = () => {
  const location = useLocation();
  const startTimeRef = useRef(Date.now());
  const sessionIdRef = useRef(getSessionId());

  useEffect(() => {
    const trackPageVisit = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const deviceInfo = {
          userAgent: navigator.userAgent,
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          language: navigator.language,
        };

        await supabase.from('user_engagement').insert({
          user_id: user.id,
          session_id: sessionIdRef.current,
          page_visited: location.pathname,
          time_spent: 0,
          device_info: deviceInfo,
        });

        startTimeRef.current = Date.now();
      } catch (error) {
        console.error('Error tracking page visit:', error);
      }
    };

    trackPageVisit();

    // Track time spent on page before leaving
    return () => {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      // Send beacon to track time even if user navigates away
      navigator.sendBeacon(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_engagement`,
        JSON.stringify({
          user_id: sessionIdRef.current,
          time_spent: timeSpent,
        })
      );
    };
  }, [location.pathname]);

  const trackInteraction = async (interactionType: string, data?: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('user_engagement').insert({
        user_id: user.id,
        session_id: sessionIdRef.current,
        page_visited: location.pathname,
        interactions: { type: interactionType, ...data },
      });
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  };

  return { trackInteraction };
};
