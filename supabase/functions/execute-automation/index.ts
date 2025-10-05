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

    const { workflowId, triggerData } = await req.json();

    const startTime = Date.now();

    // Get workflow details
    const { data: workflow, error: workflowError } = await supabase
      .from('automation_workflows')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (workflowError || !workflow) {
      throw new Error('Workflow not found');
    }

    if (!workflow.is_active) {
      throw new Error('Workflow is not active');
    }

    // Create execution record
    const { data: execution, error: executionError } = await supabase
      .from('automation_executions')
      .insert({
        workflow_id: workflowId,
        company_id: workflow.company_id,
        trigger_data: triggerData,
        status: 'running',
      })
      .select()
      .single();

    if (executionError) {
      throw executionError;
    }

    const executedActions = [];
    let hasError = false;
    let errorMessage = '';

    // Execute each action in the workflow
    for (const action of workflow.actions || []) {
      try {
        const actionResult = await executeAction(action, triggerData, supabase, workflow.company_id);
        executedActions.push({
          action: action.type,
          status: 'success',
          result: actionResult,
        });
      } catch (error) {
        hasError = true;
        errorMessage = error instanceof Error ? error.message : 'Unknown error';
        executedActions.push({
          action: action.type,
          status: 'failed',
          error: errorMessage,
        });
        break;
      }
    }

    const executionTime = Date.now() - startTime;

    // Update execution record
    await supabase
      .from('automation_executions')
      .update({
        status: hasError ? 'failed' : 'completed',
        completed_at: new Date().toISOString(),
        execution_time_ms: executionTime,
        actions_executed: executedActions,
        error_message: errorMessage || null,
      })
      .eq('id', execution.id);

    // Update workflow stats
    await supabase
      .from('automation_workflows')
      .update({
        execution_count: (workflow.execution_count || 0) + 1,
        success_count: hasError ? workflow.success_count : (workflow.success_count || 0) + 1,
        error_count: hasError ? (workflow.error_count || 0) + 1 : workflow.error_count,
        last_triggered_at: new Date().toISOString(),
      })
      .eq('id', workflowId);

    return new Response(
      JSON.stringify({
        success: !hasError,
        executionId: execution.id,
        executionTime,
        actionsExecuted: executedActions,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error executing automation:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function executeAction(action: any, triggerData: any, supabase: any, companyId: string) {
  switch (action.type) {
    case 'generate_content':
      return await generateContent(action.config, supabase, companyId);
    case 'send_notification':
      return await sendNotification(action.config, triggerData);
    case 'analyze_sentiment':
      return await analyzeSentiment(action.config, supabase, companyId);
    case 'update_status':
      return await updateStatus(action.config, supabase);
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

async function generateContent(config: any, supabase: any, companyId: string) {
  const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `You are a social media content creator. Generate engaging content based on the given requirements.\n\n${config.prompt || 'Generate an engaging social media post'}`
        }]
      }],
      generationConfig: {
        temperature: 0.8,
      }
    })
  });

  if (!response.ok) {
    throw new Error('Failed to generate content');
  }

  const data = await response.json();
  const generatedText = data.candidates[0].content.parts[0].text;

  // Save to database
  await supabase.from('ai_generated_content').insert({
    company_id: companyId,
    user_id: config.userId,
    platform: config.platform || 'twitter',
    content_type: 'post',
    prompt: config.prompt,
    generated_text: generatedText,
    status: 'draft',
  });

  return { generatedText };
}

async function sendNotification(config: any, triggerData: any) {
  console.log('Sending notification:', config, triggerData);
  return { sent: true };
}

async function analyzeSentiment(config: any, supabase: any, companyId: string) {
  const { data: posts } = await supabase
    .from('ai_generated_content')
    .select('*')
    .eq('company_id', companyId)
    .limit(config.limit || 10);

  return { analyzed: posts?.length || 0 };
}

async function updateStatus(config: any, supabase: any) {
  await supabase
    .from(config.table)
    .update({ status: config.status })
    .eq('id', config.recordId);

  return { updated: true };
}
