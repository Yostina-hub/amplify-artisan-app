import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

let transcriber: any = null;

export const initializeTranscriber = async () => {
  if (!transcriber) {
    console.log('Initializing Whisper model...');
    transcriber = await pipeline(
      'automatic-speech-recognition',
      'onnx-community/whisper-tiny.en',
      { device: 'webgpu' }
    );
    console.log('Whisper model ready');
  }
  return transcriber;
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    const model = await initializeTranscriber();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const result = await model(arrayBuffer);
    return result.text;
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
};

export const startRecording = async (): Promise<MediaRecorder> => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream);
  return mediaRecorder;
};
