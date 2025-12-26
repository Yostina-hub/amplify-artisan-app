import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertRequest {
  companyId?: string;
  checkAll?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { companyId, checkAll = false } = await req.json() as AlertRequest;

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    const targetCompanyId = companyId || profile?.company_id;
    if (!targetCompanyId) {
      throw new Error('No company ID provided');
    }

    console.log(`Checking alerts for company: ${targetCompanyId}`);

    // Get active alert rules
    const { data: rules, error: rulesError } = await supabase
      .from('media_alert_rules')
      .select('*')
      .eq('company_id', targetCompanyId)
      .eq('is_active', true);

    if (rulesError) {
      throw rulesError;
    }

    console.log(`Found ${rules?.length || 0} active alert rules`);

    const triggeredAlerts: any[] = [];
    const now = new Date();

    for (const rule of rules || []) {
      // Check cooldown
      if (rule.last_triggered_at) {
        const lastTriggered = new Date(rule.last_triggered_at);
        const cooldownMs = (rule.cooldown_minutes || 30) * 60 * 1000;
        if (now.getTime() - lastTriggered.getTime() < cooldownMs) {
          console.log(`Rule ${rule.name} is in cooldown`);
          continue;
        }
      }

      let shouldTrigger = false;
      let triggerData: any = {};
      let matchingMentionIds: string[] = [];

      const periodStart = new Date(now.getTime() - (rule.threshold_period_minutes || 60) * 60 * 1000);

      switch (rule.rule_type) {
        case 'keyword': {
          // Check for keyword matches
          const keywords = rule.conditions?.keywords || [];
          if (keywords.length === 0) continue;

          const { data: mentions, count } = await supabase
            .from('media_mentions')
            .select('id, content, matched_keywords', { count: 'exact' })
            .eq('company_id', targetCompanyId)
            .gte('published_at', periodStart.toISOString())
            .overlaps('matched_keywords', keywords);

          if (count && count >= (rule.threshold_value || 1)) {
            shouldTrigger = true;
            matchingMentionIds = mentions?.map(m => m.id) || [];
            triggerData = { count, keywords, period_minutes: rule.threshold_period_minutes };
          }
          break;
        }

        case 'spike': {
          // Check for volume spike
          const { count: currentCount } = await supabase
            .from('media_mentions')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', targetCompanyId)
            .gte('published_at', periodStart.toISOString());

          // Get previous period for comparison
          const previousPeriodStart = new Date(periodStart.getTime() - (rule.threshold_period_minutes || 60) * 60 * 1000);
          const { count: previousCount } = await supabase
            .from('media_mentions')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', targetCompanyId)
            .gte('published_at', previousPeriodStart.toISOString())
            .lt('published_at', periodStart.toISOString());

          const threshold = rule.threshold_value || 2;
          if (previousCount && currentCount && currentCount > previousCount * threshold) {
            shouldTrigger = true;
            triggerData = {
              current_count: currentCount,
              previous_count: previousCount,
              spike_ratio: currentCount / (previousCount || 1),
              threshold,
            };
          }
          break;
        }

        case 'sentiment': {
          // Check for negative sentiment threshold
          const sentimentThreshold = rule.threshold_value || -0.5;
          const { data: mentions, count } = await supabase
            .from('media_mentions')
            .select('id, content, sentiment_score, sentiment_label', { count: 'exact' })
            .eq('company_id', targetCompanyId)
            .gte('published_at', periodStart.toISOString())
            .eq('sentiment_label', 'negative')
            .lte('sentiment_score', sentimentThreshold);

          const minCount = rule.conditions?.min_count || 5;
          if (count && count >= minCount) {
            shouldTrigger = true;
            matchingMentionIds = mentions?.map(m => m.id) || [];
            triggerData = { count, threshold: sentimentThreshold, avg_sentiment: sentimentThreshold };
          }
          break;
        }

        case 'source': {
          // Check for mentions from specific high-priority sources
          const sources = rule.conditions?.sources || [];
          if (sources.length === 0) continue;

          const { data: mentions, count } = await supabase
            .from('media_mentions')
            .select('id, author_handle, platform', { count: 'exact' })
            .eq('company_id', targetCompanyId)
            .gte('published_at', periodStart.toISOString())
            .in('author_handle', sources);

          if (count && count >= (rule.threshold_value || 1)) {
            shouldTrigger = true;
            matchingMentionIds = mentions?.map(m => m.id) || [];
            triggerData = { count, sources, period_minutes: rule.threshold_period_minutes };
          }
          break;
        }

        case 'trend': {
          // Check for trending clusters
          const { data: clusters } = await supabase
            .from('media_clusters')
            .select('id, title, trend_velocity, mention_count')
            .eq('company_id', targetCompanyId)
            .eq('is_trending', true)
            .gte('last_updated_at', periodStart.toISOString());

          const minVelocity = rule.threshold_value || 10;
          const trendingClusters = clusters?.filter(c => (c.trend_velocity || 0) >= minVelocity);

          if (trendingClusters && trendingClusters.length > 0) {
            shouldTrigger = true;
            triggerData = { clusters: trendingClusters };
          }
          break;
        }
      }

      if (shouldTrigger) {
        console.log(`Alert triggered: ${rule.name}`);

        // Create alert
        const { data: alert, error: alertError } = await supabase
          .from('media_alerts')
          .insert({
            company_id: targetCompanyId,
            rule_id: rule.id,
            mention_ids: matchingMentionIds,
            title: `${rule.severity?.toUpperCase()}: ${rule.name}`,
            summary: generateAlertSummary(rule, triggerData),
            severity: rule.severity,
            trigger_data: triggerData,
            sent_to: rule.channels || [],
          })
          .select()
          .single();

        if (!alertError && alert) {
          triggeredAlerts.push(alert);

          // Update rule stats
          await supabase
            .from('media_alert_rules')
            .update({
              last_triggered_at: now.toISOString(),
              trigger_count: (rule.trigger_count || 0) + 1,
            })
            .eq('id', rule.id);

          // Create notification for users
          const recipients = rule.recipients || [];
          for (const recipient of recipients) {
            if (recipient.type === 'user' && recipient.id) {
              await supabase
                .from('notifications')
                .insert({
                  user_id: recipient.id,
                  company_id: targetCompanyId,
                  title: alert.title,
                  message: alert.summary,
                  type: rule.severity === 'critical' ? 'error' : 'warning',
                  action_url: '/media-monitoring/alerts',
                  action_label: 'View Alert',
                  metadata: { alertId: alert.id, ruleId: rule.id },
                });
            }
          }
        }
      }
    }

    console.log(`Alert check complete: ${triggeredAlerts.length} alerts triggered`);

    return new Response(
      JSON.stringify({
        success: true,
        alertsTriggered: triggeredAlerts.length,
        alerts: triggeredAlerts,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Alert check error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateAlertSummary(rule: any, triggerData: any): string {
  switch (rule.rule_type) {
    case 'keyword':
      return `Detected ${triggerData.count} mentions containing keywords: ${triggerData.keywords?.join(', ')} in the last ${triggerData.period_minutes} minutes.`;
    case 'spike':
      return `Volume spike detected: ${triggerData.current_count} mentions vs ${triggerData.previous_count} in previous period (${triggerData.spike_ratio?.toFixed(1)}x increase).`;
    case 'sentiment':
      return `High negative sentiment detected: ${triggerData.count} negative mentions with sentiment below ${triggerData.threshold}.`;
    case 'source':
      return `${triggerData.count} mentions from priority sources: ${triggerData.sources?.join(', ')}.`;
    case 'trend':
      return `${triggerData.clusters?.length} trending stories detected with high velocity.`;
    default:
      return `Alert triggered for rule: ${rule.name}`;
  }
}
