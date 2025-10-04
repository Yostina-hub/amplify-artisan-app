import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface EngagementEvent {
  postId?: string;
  companyId?: string;
  engagementType: 'view' | 'like' | 'comment' | 'share' | 'click';
  engagementDuration?: number;
  metadata?: Record<string, any>;
}

export const useEngagementTracker = () => {
  const { user } = useAuth();
  const startTimeRef = useRef<number>(Date.now());

  const trackEngagement = async (event: EngagementEvent) => {
    if (!user) return;

    try {
      const insertData: any = {
        user_id: user.id,
        post_id: event.postId || null,
        company_id: event.companyId || null,
        engagement_type: event.engagementType,
        engagement_duration: event.engagementDuration || null,
        engagement_metadata: event.metadata || {},
        user_agent: navigator.userAgent,
        device_type: getDeviceType(),
      };

      const { error } = await supabase
        .from('user_engagement')
        .insert([insertData]);

      if (error) {
        console.error('Error tracking engagement:', error);
      }
    } catch (error) {
      console.error('Error in engagement tracking:', error);
    }
  };

  const trackView = (postId: string, companyId?: string) => {
    startTimeRef.current = Date.now();
    trackEngagement({
      postId,
      companyId,
      engagementType: 'view',
    });
  };

  const trackInteraction = (
    type: 'like' | 'comment' | 'share' | 'click',
    postId: string,
    companyId?: string,
    metadata?: Record<string, any>
  ) => {
    trackEngagement({
      postId,
      companyId,
      engagementType: type,
      metadata,
    });
  };

  const endViewTracking = (postId: string, companyId?: string) => {
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    if (duration > 1) {
      // Only track if viewed for more than 1 second
      const insertData: any = {
        user_id: user?.id,
        post_id: postId,
        company_id: companyId || null,
        engagement_type: 'view',
        engagement_duration: duration,
        engagement_metadata: {},
        user_agent: navigator.userAgent,
        device_type: getDeviceType(),
      };

      supabase
        .from('user_engagement')
        .insert([insertData])
        .then(({ error }) => {
          if (error) console.error('Error tracking view end:', error);
        });
    }
  };

  return {
    trackView,
    trackInteraction,
    endViewTracking,
  };
};

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}
