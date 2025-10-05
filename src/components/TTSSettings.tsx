import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Loader2, Volume2 } from 'lucide-react';

export function TTSSettings() {
  const { toast } = useToast();
  const [testing, setTesting] = useState<'openai' | 'elevenlabs' | null>(null);
  const [openaiStatus, setOpenaiStatus] = useState<'unknown' | 'working' | 'failed'>('unknown');
  const [elevenlabsStatus, setElevenlabsStatus] = useState<'unknown' | 'working' | 'failed'>('unknown');

  const testProvider = async (provider: 'openai' | 'elevenlabs') => {
    setTesting(provider);
    const testText = provider === 'openai' ? 'Testing OpenAI voice' : 'Testing ElevenLabs voice';
    
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { 
          text: testText,
          voice: provider === 'openai' ? 'alloy' : '9BWtsMINqrJLrRacOk9x'
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Text-to-Speech Configuration</CardTitle>
          <CardDescription>
            Manage your TTS providers. OpenAI is used first, with automatic fallback to ElevenLabs if needed.
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
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
