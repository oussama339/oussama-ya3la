import { useState } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { VoiceName } from '../types';
import { base64ToBytes, decodeAudioData, createWavBlob } from '../utils/audio-utils';

interface UseTTSProps {
  voiceName: VoiceName;
}

export const useTTS = ({ voiceName }: UseTTSProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const speak = async (text: string) => {
    if (!text.trim()) return;
    if (!process.env.API_KEY) {
        setError("API Key is missing.");
        return;
    }
    
    setIsLoading(true);
    setError(null);
    setAudioUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName }
            }
          }
        }
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
          throw new Error("No audio data received");
      }

      // Convert base64 to raw PCM
      const pcmBytes = base64ToBytes(base64Audio);

      // Create downloadable WAV file
      const wavBlob = createWavBlob(pcmBytes, 24000);
      const url = URL.createObjectURL(wavBlob);
      setAudioUrl(url);

      // Play Audio via AudioContext
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = await decodeAudioData(
          pcmBytes,
          audioContext,
          24000,
          1
      );
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();

    } catch (err: any) {
      console.error("TTS Error:", err);
      setError(err.message || "Failed to generate speech");
    } finally {
      setIsLoading(false);
    }
  };

  return { speak, isLoading, error, audioUrl };
};