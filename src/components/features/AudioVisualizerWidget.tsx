uimport React, { useRef, useEffect, useState } from 'react';
import { useAudioVisualizer } from '../../hooks/useAudioVisualizer';
import { Music, Play, Pause } from 'lucide-react';

export const AudioVisualizerWidget: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reqRef = useRef<number>();

  const [audioUrl, setAudioUrl] = useState('');

  const { initWebAudio, getFrequencyData, isReady, isPlaying, setIsPlaying } = useAudioVisualizer({
    fftSize: 256
  });

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (audioRef.current.paused) {
      // Must initialize context upon first user interaction
      if (!isReady) initWebAudio(audioRef.current);
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(URL.createObjectURL(file));
      setIsPlaying(false);
    }
  };

  // Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isReady) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderFrame = () => {
      reqRef.current = requestAnimationFrame(renderFrame);

      const data = getFrequencyData();
      if (!data.length) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / data.length) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < data.length; i++) {
        barHeight = data[i] / 2;

        // Use CSS variable instead of hardcoded tailwind color
        const heartColor = getComputedStyle(document.documentElement).getPropertyValue('--color-heart').trim() || '#FF3366';
        ctx.fillStyle = heartColor;
        ctx.globalAlpha = 0.8;

        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    if (isPlaying) {
      renderFrame();
    } else if (reqRef.current) {
      cancelAnimationFrame(reqRef.current);
    }

    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [getFrequencyData, isReady, isPlaying]);

  return (
    <div className="glass-panel p-6 flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-4">
        <h3 className="font-playfair font-bold flex items-center gap-2">
          <Music size={18} /> Visualizer
        </h3>

        <label className="cursor-pointer bg-text-primary text-bg-primary px-3 py-1.5 rounded-lg text-xs font-medium">
          Audio laden
          <input type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
        </label>
      </div>

      <canvas
        ref={canvasRef}
        width={300}
        height={100}
        className="w-full h-[100px] bg-black/5 rounded-xl border border-border-primary/50 mb-4"
      />

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}

      <button
        onClick={togglePlay}
        disabled={!audioUrl}
        className="w-12 h-12 rounded-full glass-panel flex items-center justify-center hover:bg-black/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-text-primary"
      >
        {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
      </button>
    </div>
  );
};
