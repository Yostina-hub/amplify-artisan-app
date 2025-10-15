import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { transcribeAudio, startRecording } from '@/utils/speechToText';

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
}

export const VoiceRecorder = ({ onTranscript }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const handleStartRecording = async () => {
    try {
      const recorder = await startRecording();
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
        try {
          const text = await transcribeAudio(audioBlob);
          onTranscript(text);
          toast({
            title: 'Transcription complete',
            description: 'Your speech has been converted to text',
          });
        } catch (error) {
          toast({
            title: 'Transcription failed',
            description: 'Could not transcribe audio',
            variant: 'destructive',
          });
        } finally {
          setIsProcessing(false);
        }
      };

      recorder.start();
      setIsRecording(true);
      toast({
        title: 'Recording started',
        description: 'Speak now...',
      });
    } catch (error) {
      toast({
        title: 'Microphone access denied',
        description: 'Please allow microphone access',
        variant: 'destructive',
      });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  return (
    <Button
      onClick={isRecording ? handleStopRecording : handleStartRecording}
      disabled={isProcessing}
      variant={isRecording ? 'destructive' : 'default'}
      size="icon"
    >
      {isProcessing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isRecording ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
};
