"use client";

import React, { useState, useRef, useEffect } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCw, Loader2 } from 'lucide-react';

interface YouTubePlayerProps {
  videoUrl: string;
  transcript: Array<{ timestamp: number; text: string }>;
  currentTime: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onPlayPause: (playing: boolean) => void;
  onReady?: () => void;
}

export default function YouTubePlayer({
  videoUrl,
  transcript,
  currentTime,
  isPlaying,
  onTimeUpdate,
  onPlayPause,
  onReady
}: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);

  // Extract video ID from URL
  const extractVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : '';
  };

  const videoId = extractVideoId(videoUrl);

  // YouTube player options
  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 0,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      iv_load_policy: 3,
      cc_load_policy: 1,  // Show captions by default
      cc_lang_pref: 'en',
    },
  };

  // Handle player ready
  const handleReady = (event: any) => {
    playerRef.current = event.target;
    setIsLoading(false);
    setDuration(playerRef.current.getDuration());
    if (onReady) onReady();
  };

  // Handle play/pause from external controls
  useEffect(() => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.playVideo();
        startTimeTracking();
      } else {
        playerRef.current.pauseVideo();
        stopTimeTracking();
      }
    }
  }, [isPlaying]);

  // Start tracking time
  const startTimeTracking = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const time = playerRef.current.getCurrentTime();
        onTimeUpdate(time);
      }
    }, 500); // Update every 500ms
  };

  // Stop tracking time
  const stopTimeTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Handle state change
  const handleStateChange = (event: any) => {
    // 1 = playing, 2 = paused
    if (event.data === 1) {
      onPlayPause(true);
    } else if (event.data === 2) {
      onPlayPause(false);
    }
  };

  // Seek to specific time
  const seekTo = (time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time, true);
      onTimeUpdate(time);
    }
  };

  // Reset video
  const resetVideo = () => {
    if (playerRef.current) {
      playerRef.current.seekTo(0, true);
      playerRef.current.pauseVideo();
      onTimeUpdate(0);
      onPlayPause(false);
    }
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  };

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get current subtitle
  const getCurrentSubtitle = () => {
    if (!transcript || transcript.length === 0) return '';

    const currentSubtitle = transcript
      .filter(item => item.timestamp <= currentTime)
      .slice(-1)[0];

    return currentSubtitle ? currentSubtitle.text : '';
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimeTracking();
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      {/* YouTube Player */}
      <div className="flex-1 relative bg-black rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
            <span className="ml-2 text-white">Loading video...</span>
          </div>
        )}

        <YouTube
          videoId={videoId}
          opts={opts}
          onReady={handleReady}
          onStateChange={handleStateChange}
          className="w-full h-full"
          iframeClassName="w-full h-full"
        />

        {/* Subtitle Overlay */}
        {transcript && transcript.length > 0 && (
          <div className="absolute bottom-16 left-4 right-4 bg-black/90 text-white p-4 rounded-lg pointer-events-none">
            <p className="text-lg text-center leading-relaxed">
              {getCurrentSubtitle() || 'Press play to start watching the video'}
            </p>
            <p className="text-xs text-center mt-2 opacity-60">
              {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </div>
        )}
      </div>

      {/* Video Controls */}
      <div className="bg-card border rounded-lg p-4 mt-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Button
              onClick={togglePlayPause}
              size="sm"
              variant="outline"
              disabled={isLoading}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              onClick={resetVideo}
              size="sm"
              variant="outline"
              disabled={isLoading}
            >
              <RotateCw className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            {isPlaying ? 'Playing' : 'Paused'} • Ask questions about what you've watched
          </div>
        </div>

        {/* Progress Bar */}
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={(e) => seekTo(parseFloat(e.target.value))}
          className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${duration ? (currentTime / duration) * 100 : 0}%, hsl(var(--secondary)) ${duration ? (currentTime / duration) * 100 : 0}%, hsl(var(--secondary)) 100%)`
          }}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}