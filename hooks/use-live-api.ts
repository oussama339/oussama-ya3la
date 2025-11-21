import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ConnectionState, VoiceName } from '../types';
import { base64ToBytes, createPcmBlob, decodeAudioData } from '../utils/audio-utils';

interface UseLiveApiProps {
  voiceName: VoiceName;
  systemInstruction: string;
}

export const useLiveApi = ({ voiceName, systemInstruction }: UseLiveApiProps) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);

  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const disconnect = useCallback(() => {
    // Cleanup audio sources
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();

    // Cleanup input
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (inputContextRef.current) {
      inputContextRef.current.close();
      inputContextRef.current = null;
    }

    // Cleanup output
    if (outputContextRef.current) {
      outputContextRef.current.close();
      outputContextRef.current = null;
    }

    // Cleanup session (Live API doesn't have explicit disconnect on the client object in all versions, 
    // but closing the context and stream effectively stops the loop). 
    // If the session object exposed a close method we would call it.
    // The guidance says "session.close()" is available.
    if (sessionRef.current) {
        sessionRef.current.then(session => {
           if (session && typeof session.close === 'function') {
               session.close();
           }
        }).catch(() => {}); // Ignore if already closed
        sessionRef.current = null;
    }

    setConnectionState('disconnected');
    setVolume(0);
  }, []);

  const connect = useCallback(async () => {
    if (!process.env.API_KEY) {
        setError("API Key is missing.");
        return;
    }

    setConnectionState('connecting');
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Setup Audio Contexts
      // Input: 16kHz for Gemini
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      // Output: 24kHz for Gemini
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      // Setup Analyser for visualization
      analyserRef.current = outputContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      // Create a gain node to connect the analyser without disrupting output flow if needed, 
      // but usually we connect source -> analyser -> destination.
      
      const outputNode = outputContextRef.current.createGain();
      outputNode.connect(outputContextRef.current.destination);
      // Connect analyser to output node to visualize what the AI is saying
      outputNode.connect(analyserRef.current);

      nextStartTimeRef.current = 0;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setConnectionState('connected');
            
            if (!inputContextRef.current || !streamRef.current) return;

            // Setup Input Stream
            const source = inputContextRef.current.createMediaStreamSource(streamRef.current);
            const scriptProcessor = inputContextRef.current.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              // Calculate volume for visualization from input when AI isn't speaking
              // Note: Ideally we mix volumes, but for now let's rely on output visualizer or input.
              // Let's do input visualization manually here since `analyser` is on output.
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
              const rms = Math.sqrt(sum / inputData.length);
              // We can update a state, but high freq updates might lag. 
              // Let's use the output analyser for the main visual.
              
              const pcmBlob = createPcmBlob(inputData);
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            
            if (base64Audio && outputContextRef.current) {
               // Ensure context is running (browsers suspend audio contexts sometimes)
               if (outputContextRef.current.state === 'suspended') {
                  await outputContextRef.current.resume();
               }

               nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContextRef.current.currentTime);
               
               const audioBuffer = await decodeAudioData(
                 base64ToBytes(base64Audio),
                 outputContextRef.current,
                 24000,
                 1
               );
               
               const source = outputContextRef.current.createBufferSource();
               source.buffer = audioBuffer;
               source.connect(outputNode); // Connect to the gain node which is connected to analyser
               
               source.addEventListener('ended', () => {
                 sourcesRef.current.delete(source);
               });

               source.start(nextStartTimeRef.current);
               nextStartTimeRef.current += audioBuffer.duration;
               sourcesRef.current.add(source);
            }

            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
                // Stop all current playing audio
                sourcesRef.current.forEach((src) => {
                    try { src.stop(); } catch (e) {}
                });
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error("Live API Error:", e);
            setError("Connection error occurred.");
            setConnectionState('error');
            disconnect();
          },
          onclose: () => {
            setConnectionState('disconnected');
          }
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } }
            },
            systemInstruction: systemInstruction,
        }
      });

      sessionRef.current = sessionPromise;

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to connect");
      setConnectionState('error');
      disconnect();
    }
  }, [voiceName, systemInstruction, disconnect]);

  // Animation loop for volume visualization
  useEffect(() => {
    let animationFrameId: number;
    const updateVolume = () => {
      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Average volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setVolume(avg);
      }
      animationFrameId = requestAnimationFrame(updateVolume);
    };
    updateVolume();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return {
    connect,
    disconnect,
    connectionState,
    error,
    volume
  };
};
