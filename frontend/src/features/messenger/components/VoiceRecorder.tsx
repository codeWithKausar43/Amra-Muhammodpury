'use client';

import * as React from 'react';
import { Square, Trash2, Send, Play, Pause, Loader2 } from 'lucide-react';

interface VoiceRecorderProps {
  onSend: (file: File, duration: number) => Promise<void>;
  onCancel: () => void;
}

export function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = React.useState(false);
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const [duration, setDuration] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = React.useRef<HTMLAudioElement | null>(null);

  // Start recording on mount
  React.useEffect(() => {
    let stream: MediaStream | null = null;

    async function initRecorder() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setAudioBlob(blob);
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          setIsRecording(false);
        };

        mediaRecorder.start();
        setIsRecording(true);

        timerRef.current = setInterval(() => {
          setDuration((prev) => prev + 1);
        }, 1000);
      } catch (err) {
        console.error('Microphone access denied:', err);
        alert('মাইক্রোফোন ব্যবহারের অনুমতি দেওয়া হয়নি।');
        onCancel();
      }
    }

    initRecorder();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onCancel]);

  const handleStopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleTogglePlay = () => {
    if (!audioPlayerRef.current && audioUrl) {
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;
      audio.onended = () => setIsPlaying(false);
    }

    if (audioPlayerRef.current) {
      if (isPlaying) {
        audioPlayerRef.current.pause();
        setIsPlaying(false);
      } else {
        audioPlayerRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    setSending(true);
    try {
      const file = new File([audioBlob], `voice-note-${Date.now()}.webm`, {
        type: 'audio/webm',
      });
      await onSend(file, duration);
    } finally {
      setSending(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-brand-emerald/10 border border-brand-emerald/30 rounded-2xl w-full animate-in fade-in">
      {/* Delete / Cancel button */}
      <button
        type="button"
        onClick={onCancel}
        disabled={sending}
        className="w-8 h-8 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
        title="বাতিল করুন"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Recording status or Play preview */}
      <div className="flex-1 flex items-center gap-2">
        {isRecording ? (
          <>
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              রেকর্ডিং হচ্ছে ({formatSeconds(duration)})
            </span>
            <div className="flex-1 flex items-center justify-center gap-1">
              <span className="w-1 h-3 bg-brand-emerald rounded-full animate-bounce" />
              <span className="w-1 h-5 bg-brand-emerald rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-1 h-2 bg-brand-emerald rounded-full animate-bounce [animation-delay:0.3s]" />
              <span className="w-1 h-4 bg-brand-emerald rounded-full animate-bounce [animation-delay:0.45s]" />
            </div>
            <button
              type="button"
              onClick={handleStopRecording}
              className="p-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white cursor-pointer"
              title="রেকর্ডিং বন্ধ করুন"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleTogglePlay}
              className="w-7 h-7 rounded-full bg-brand-emerald text-white flex items-center justify-center cursor-pointer shadow-xs"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              ভয়েস বার্তা প্রস্তুত ({formatSeconds(duration)})
            </span>
          </>
        )}
      </div>

      {/* Send Button */}
      {!isRecording && audioBlob && (
        <button
          type="button"
          onClick={handleSend}
          disabled={sending}
          className="w-8 h-8 rounded-xl bg-brand-emerald hover:bg-emerald-800 text-white flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer shadow-sm"
          title="পাঠান"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}
