import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all active scheduled workflows
    const { data: workflows, error } = await supabase
      .from('automation_workflows')
      .select('*')
      .eq('is_active', true)
      .eq('trigger_type', 'scheduled');

    if (error) throw error;

    const results = [];

    for (const workflow of workflows || []) {
      const config = workflow.trigger_config || {};
      const schedule = config.schedule || 'daily';
      const scheduleTime = config.time || '09:00';

      const now = new Date();
      const [hours, minutes] = scheduleTime.split(':').map(Number);
      
      const shouldRun = checkSchedule(schedule, now, hours, minutes, workflow.last_triggered_at);

      if (shouldRun) {
        try {
          // Execute the workflow
          const response = await fetch(`${supabaseUrl}/functions/v1/execute-automation`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              workflowId: workflow.id,
              triggerData: { type: 'scheduled', timestamp: now.toISOString() },
            }),
          });

          const result = await response.json();
          results.push({
            workflowId: workflow.id,
            name: workflow.name,
            status: 'executed',
            result,
          });
        } catch (error) {
          console.error(`Failed to execute workflow ${workflow.id}:`, error);
          results.push({
            workflowId: workflow.id,
            name: workflow.name,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        checked: workflows?.length || 0,
        executed: results.length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scheduling automations:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function checkSchedule(
  schedule: string,
  now: Date,
  targetHour: number,
  targetMinute: number,
  lastTriggered: string | null
): boolean {
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Check if we're within 5 minutes of target time
  const isTimeMatch = 
    currentHour === targetHour && 
    Math.abs(currentMinute - targetMinute) <= 5;

  if (!isTimeMatch) return false;

  // Check if already triggered today
  if (lastTriggered) {
    const lastDate = new Date(lastTriggered);
    const hoursSinceLastTrigger = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);

    switch (schedule) {
      case 'hourly':
        return hoursSinceLastTrigger >= 1;
      case 'daily':
        return hoursSinceLastTrigger >= 24;
      case 'weekly':
        return hoursSinceLastTrigger >= 168;
      default:
        return false;
    }
  }

  return true;
}
