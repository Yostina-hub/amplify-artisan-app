import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, XCircle, Loader2, Volume2, Eye, EyeOff } from 'lucide-react';

export default function TTSSettings() {
  const { toast } = useToast();
  const { isSuperAdmin, isCompanyAdmin, rolesDetailed } = useAuth();
  const [testing, setTesting] = useState<'openai' | 'elevenlabs' | null>(null);
  const [openaiStatus, setOpenaiStatus] = useState<'unknown' | 'working' | 'failed'>('unknown');
  const [elevenlabsStatus, setElevenlabsStatus] = useState<'unknown' | 'working' | 'failed'>('unknown');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [useCustomKeys, setUseCustomKeys] = useState(false);
  const [openaiKey, setOpenaiKey] = useState('');
  const [elevenlabsKey, setElevenlabsKey] = useState('');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showElevenlabsKey, setShowElevenlabsKey] = useState(false);
  
  // Get company ID for company admins
  const companyId = rolesDetailed.find(r => r.role === 'admin' && r.company_id)?.company_id;

  useEffect(() => {
    if (isCompanyAdmin && companyId) {
      loadCompanySettings();
    } else {
      setLoading(false);
    }
  }, [isCompanyAdmin, companyId]);

  const loadCompanySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('company_tts_settings')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setUseCustomKeys(data.use_custom_keys);
        setOpenaiKey(data.openai_api_key || '');
        setElevenlabsKey(data.elevenlabs_api_key || '');
      }
    } catch (error: any) {
      toast({
        title: 'Error loading settings',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!companyId) {
      toast({
        title: 'Error',
        description: 'Company ID not found',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('company_tts_settings')
        .upsert({
          company_id: companyId,
          use_custom_keys: useCustomKeys,
          openai_api_key: useCustomKeys ? openaiKey : null,
          elevenlabs_api_key: useCustomKeys ? elevenlabsKey : null,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'TTS settings saved successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error saving settings',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const testProvider = async (provider: 'openai' | 'elevenlabs') => {
    setTesting(provider);
    const testText = provider === 'openai' ? 'Testing OpenAI voice' : 'Testing ElevenLabs voice';
    
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { 
          text: testText,
          voice: provider === 'openai' ? 'alloy' : '9BWtsMINqrJLrRacOk9x',
          company_id: companyId
        }
      });

      if (error) throw error;

      if (data?.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        await audio.play();
        
        if (provider === 'openai') {
          setOpenaiStatus('working');
        } else {
          setElevenlabsStatus('working');
        }
        
        toast({
          title: 'Success',
          description: `${provider === 'openai' ? 'OpenAI' : 'ElevenLabs'} TTS is working correctly`,
        });
      }
    } catch (error: any) {
      if (provider === 'openai') {
        setOpenaiStatus('failed');
      } else {
        setElevenlabsStatus('failed');
      }
      
      toast({
        title: 'Test Failed',
        description: error.message || 'Could not test provider',
        variant: 'destructive'
      });
    } finally {
      setTesting(null);
    }
  };

  const getStatusBadge = (status: 'unknown' | 'working' | 'failed') => {
    switch (status) {
      case 'working':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Working</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge variant="outline">Not Tested</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in-50 duration-500 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Text-to-Speech Settings</h1>
        <p className="text-muted-foreground mt-1">
          {isSuperAdmin 
            ? 'Configure system-wide TTS providers' 
            : 'Manage your company TTS/STT API keys'}
        </p>
      </div>

      {isCompanyAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Custom API Keys</CardTitle>
            <CardDescription>
              Use your own API keys for TTS/STT services. When disabled, system default keys are used.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Use Custom API Keys</Label>
                <p className="text-sm text-muted-foreground">
                  Enable to manage your own OpenAI and ElevenLabs API keys
                </p>
              </div>
              <Switch
                checked={useCustomKeys}
                onCheckedChange={setUseCustomKeys}
              />
            </div>

            {useCustomKeys && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="openai-key">OpenAI API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="openai-key"
                      type={showOpenaiKey ? 'text' : 'password'}
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      placeholder="sk-..."
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                    >
                      {showOpenaiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="elevenlabs-key">ElevenLabs API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="elevenlabs-key"
                      type={showElevenlabsKey ? 'text' : 'password'}
                      value={elevenlabsKey}
                      onChange={(e) => setElevenlabsKey(e.target.value)}
                      placeholder="sk_..."
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowElevenlabsKey(!showElevenlabsKey)}
                    >
                      {showElevenlabsKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button onClick={saveSettings} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Settings'
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>TTS Providers</CardTitle>
          <CardDescription>
            Test your TTS providers. OpenAI is used first, with automatic fallback to ElevenLabs if needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* OpenAI Provider */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">OpenAI TTS</h3>
                <Badge variant="secondary">Primary</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                High-quality text-to-speech with multiple voices
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">Status:</span>
                {getStatusBadge(openaiStatus)}
              </div>
            </div>
            <Button
              onClick={() => testProvider('openai')}
              disabled={testing !== null}
              size="sm"
            >
              {testing === 'openai' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 mr-2" />
                  Test
                </>
              )}
            </Button>
          </div>

          {/* ElevenLabs Provider */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">ElevenLabs TTS</h3>
                <Badge variant="outline">Fallback</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Natural-sounding AI voices with multilingual support
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">Status:</span>
                {getStatusBadge(elevenlabsStatus)}
              </div>
            </div>
            <Button
              onClick={() => testProvider('elevenlabs')}
              disabled={testing !== null}
              size="sm"
            >
              {testing === 'elevenlabs' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 mr-2" />
                  Test
                </>
              )}
            </Button>
          </div>

          {/* Info Section */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <h4 className="font-medium text-sm">How it works:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>OpenAI TTS is always tried first (primary provider)</li>
              <li>If OpenAI fails or has quota issues, automatically switches to ElevenLabs</li>
              <li>If both fail, uses browser's built-in text-to-speech as last resort</li>
              {isCompanyAdmin && (
                <li>Company admins can use their own API keys for billing control</li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>

      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>
              Default API keys are configured at the system level via environment variables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              System administrators can configure default API keys through the backend settings.
              These keys are used when companies don't provide their own keys.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
