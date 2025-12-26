import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapeRequest {
  urls?: string[];
  profileId?: string;
  companyId?: string;
  searchQuery?: string;
  category?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { urls, profileId, companyId, searchQuery, category }: ScrapeRequest = await req.json();

    console.log('Neural Engine Scrape request:', { urls, profileId, searchQuery, category });

    // Get profile details if profileId provided
    let profile = null;
    let requirements: any[] = [];
    
    if (profileId) {
      const { data: profileData } = await supabase
        .from('company_monitoring_profiles')
        .select('*')
        .eq('id', profileId)
        .single();
      profile = profileData;

      const { data: reqData } = await supabase
        .from('monitoring_requirements')
        .select('*')
        .eq('profile_id', profileId)
        .eq('is_active', true);
      requirements = reqData || [];
    }

    const results: any[] = [];

    // If search query provided, use Firecrawl search
    if (searchQuery && firecrawlApiKey) {
      console.log('Performing web search:', searchQuery);
      
      const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 10,
          scrapeOptions: {
            formats: ['markdown'],
          },
        }),
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        console.log('Search results:', searchData.data?.length || 0, 'items');
        
        if (searchData.data) {
          for (const item of searchData.data) {
            results.push({
              source_url: item.url,
              source_domain: new URL(item.url).hostname,
              title: item.title || 'Untitled',
              content: item.markdown || item.description || '',
              source_type: 'website',
            });
          }
        }
      }
    }

    // Scrape individual URLs
    if (urls && urls.length > 0 && firecrawlApiKey) {
      for (const url of urls.slice(0, 5)) { // Limit to 5 URLs
        console.log('Scraping URL:', url);
        
        try {
          const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: url.startsWith('http') ? url : `https://${url}`,
              formats: ['markdown'],
              onlyMainContent: true,
            }),
          });

          if (scrapeResponse.ok) {
            const scrapeData = await scrapeResponse.json();
            const data = scrapeData.data || scrapeData;
            
            results.push({
              source_url: url,
              source_domain: new URL(url.startsWith('http') ? url : `https://${url}`).hostname,
              title: data.metadata?.title || 'Untitled',
              content: data.markdown || '',
              source_type: 'website',
            });
          }
        } catch (e) {
          console.error('Error scraping URL:', url, e);
        }
      }
    }

    // Process results with AI for entity extraction and categorization
    const processedResults: any[] = [];
    
    for (const result of results) {
      let entities = { organizations: [], people: [], locations: [], topics: [] };
      let summary = '';
      let sentimentLabel = 'neutral';
      let sentimentScore = 0;
      let detectedCategory = category || 'industry';
      let relevanceScore = 0.5;

      // Use Lovable AI for processing if available
      if (lovableApiKey && result.content) {
        try {
          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                {
                  role: 'system',
                  content: `You are an intelligence analyst. Extract key information from the provided content and return a JSON object with:
- summary: A 1-2 sentence summary
- entities: { organizations: [], people: [], locations: [], topics: [] }
- sentiment: "positive", "negative", or "neutral"
- sentimentScore: number from -1 to 1
- category: one of "competitor", "industry", "market", "regulatory", "opportunity", "risk"
- relevanceScore: number from 0 to 1 based on business relevance

${profile ? `Context: Monitoring for a ${profile.business_type} company in ${profile.industry}. Keywords: ${profile.keywords?.join(', ')}` : ''}
${requirements.length > 0 ? `Client requirements: ${requirements.map(r => r.requirement_value).join(', ')}` : ''}`
                },
                {
                  role: 'user',
                  content: `Analyze this content:\n\nTitle: ${result.title}\n\nContent: ${result.content.substring(0, 3000)}`
                }
              ],
              tools: [
                {
                  type: 'function',
                  function: {
                    name: 'extract_intelligence',
                    description: 'Extract structured intelligence from content',
                    parameters: {
                      type: 'object',
                      properties: {
                        summary: { type: 'string' },
                        entities: {
                          type: 'object',
                          properties: {
                            organizations: { type: 'array', items: { type: 'string' } },
                            people: { type: 'array', items: { type: 'string' } },
                            locations: { type: 'array', items: { type: 'string' } },
                            topics: { type: 'array', items: { type: 'string' } }
                          }
                        },
                        sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
                        sentimentScore: { type: 'number' },
                        category: { type: 'string', enum: ['competitor', 'industry', 'market', 'regulatory', 'opportunity', 'risk'] },
                        relevanceScore: { type: 'number' }
                      },
                      required: ['summary', 'entities', 'sentiment', 'category', 'relevanceScore']
                    }
                  }
                }
              ],
              tool_choice: { type: 'function', function: { name: 'extract_intelligence' } }
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
            
            if (toolCall?.function?.arguments) {
              try {
                const parsed = JSON.parse(toolCall.function.arguments);
                summary = parsed.summary || '';
                entities = parsed.entities || entities;
                sentimentLabel = parsed.sentiment || 'neutral';
                sentimentScore = parsed.sentimentScore || 0;
                detectedCategory = parsed.category || 'industry';
                relevanceScore = parsed.relevanceScore || 0.5;
              } catch (e) {
                console.error('Error parsing AI response:', e);
              }
            }
          }
        } catch (e) {
          console.error('AI processing error:', e);
        }
      }

      // Check matched requirements
      const matchedRequirements: string[] = [];
      for (const req of requirements) {
        const contentLower = (result.content + ' ' + result.title).toLowerCase();
        if (contentLower.includes(req.requirement_value.toLowerCase())) {
          matchedRequirements.push(req.id);
        }
      }

      const processedItem = {
        profile_id: profileId,
        company_id: companyId,
        source_url: result.source_url,
        source_domain: result.source_domain,
        source_type: result.source_type,
        title: result.title,
        content: result.content.substring(0, 10000),
        summary,
        category: detectedCategory,
        entities,
        sentiment_score: sentimentScore,
        sentiment_label: sentimentLabel,
        relevance_score: relevanceScore,
        language: 'en',
        scraped_at: new Date().toISOString(),
        is_processed: true,
        matched_requirements: matchedRequirements,
      };

      processedResults.push(processedItem);
    }

    // Store in database
    if (processedResults.length > 0 && companyId) {
      const { error } = await supabase
        .from('scraped_intelligence')
        .insert(processedResults);
      
      if (error) {
        console.error('Error storing results:', error);
      } else {
        console.log('Stored', processedResults.length, 'intelligence items');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: processedResults.length,
        data: processedResults,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Neural engine error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
