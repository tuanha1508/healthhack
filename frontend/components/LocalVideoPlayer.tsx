"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TranscriptItem {
  timestamp?: number;
  start?: number;
  end?: number;
  text: string;
}

interface LocalVideoPlayerProps {
  videoUrl: string;
  transcript: TranscriptItem[];
  currentTime: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onPlayPause: (playing: boolean) => void;
}

export default function LocalVideoPlayer({
  videoUrl,
  transcript,
  currentTime,
  isPlaying,
  onTimeUpdate,
  onPlayPause
}: LocalVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [volume, setVolume] = useState(1);
  const [buffered, setBuffered] = useState(0);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const [videoError, setVideoError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate duration from transcript
  const duration = transcript && transcript.length > 0
    ? Math.max(...transcript.map(t => t.end || t.timestamp || 0))
    : 0;

  // Update video playback based on isPlaying prop
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(console.error);
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Load video metadata when URL changes
  useEffect(() => {
    if (videoRef.current && videoUrl) {
      setVideoError('');
      setIsLoading(true);
      videoRef.current.load();
    }
  }, [videoUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Handle time updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      onTimeUpdate(video.currentTime);

      // Update current subtitle
      const current = transcript.find(item => {
        const start = item.start ?? item.timestamp ?? 0;
        const end = item.end ?? (item.start ?? item.timestamp ?? 0) + 3;
        return video.currentTime >= start && video.currentTime <= end;
      });

      setCurrentSubtitle(current?.text || '');
    };

    const handleLoadedMetadata = () => {
      console.log('Video metadata loaded');
    };

    const handleCanPlay = () => {
      console.log('Video can play');
    };

    const handleProgress = () => {
      if (video.buffered.length > 0 && duration > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered((bufferedEnd / duration) * 100);
      }
    };

    const handleLoadStart = () => {
      console.log('Video loading started');
      setIsLoading(true);
      setVideoError('');
    };

    const handleCanPlayThrough = () => {
      console.log('Video can play through');
      setIsLoading(false);
    };

    const handleError = (e: Event) => {
      console.error('Video error:', e);
      const video = e.target as HTMLVideoElement;

      if (video.error) {
        let errorMessage = 'Video playback error';
        switch (video.error.code) {
          case 1: // MEDIA_ERR_ABORTED
            errorMessage = 'Video loading was aborted';
            break;
          case 2: // MEDIA_ERR_NETWORK
            errorMessage = 'Network error while loading video';
            break;
          case 3: // MEDIA_ERR_DECODE
            errorMessage = 'Video decoding error';
            break;
          case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
            errorMessage = 'Video format not supported';
            break;
        }
        setVideoError(errorMessage);
        setIsLoading(false);

        // Auto-retry after 3 seconds for network errors
        if (video.error.code === 2) {
          retryTimeoutRef.current = setTimeout(() => {
            handleRetryLoad();
          }, 3000);
        }
      }
    };

    const handleStalled = () => {
      console.log('Video stalled - attempting to recover');
      // Try to recover from stalled state
      if (video.readyState < 3) { // HAVE_FUTURE_DATA
        video.load();
      }
    };

    const handleWaiting = () => {
      console.log('Video waiting for data');
      setIsLoading(true);
    };

    const handlePlaying = () => {
      console.log('Video playing');
      setIsLoading(false);
      setVideoError('');
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.addEventListener('error', handleError);
    video.addEventListener('stalled', handleStalled);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
      video.removeEventListener('error', handleError);
      video.removeEventListener('stalled', handleStalled);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, [transcript, onTimeUpdate, duration]);

  const handlePlayPause = () => {
    onPlayPause(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const time = value[0];
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      onTimeUpdate(time);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const vol = value[0];
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
  };

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      onTimeUpdate(0);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds) || isNaN(seconds)) {
      return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTranscriptClick = (item: TranscriptItem) => {
    const time = item.start ?? item.timestamp ?? 0;
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      onTimeUpdate(time);
    }
  };

  const handleRetryLoad = () => {
    console.log('Retrying video load');
    setVideoError('');
    setIsLoading(true);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  // Determine if this is a local video or external URL
  const isLocalVideo = videoUrl.startsWith('/api/videos/');
  const fullVideoUrl = isLocalVideo ? `https://57315631503a.ngrok-free.app${videoUrl}` : videoUrl;

  return (
    <div className="space-y-4 pb-6">
      {/* Error Alert */}
      {videoError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{videoError}</span>
            <Button
              onClick={handleRetryLoad}
              size="sm"
              variant="outline"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Video Container */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={fullVideoUrl}
          className="w-full h-auto"
          onClick={handlePlayPause}
          controls={false}
          preload="metadata"
          crossOrigin="anonymous"
        />

        {/* Loading Overlay */}
        {isLoading && !videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-white flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p className="text-sm">Loading video...</p>
            </div>
          </div>
        )}

        {/* Subtitle Overlay */}
        {currentSubtitle && !videoError && (
          <div className="absolute bottom-20 left-0 right-0 text-center px-4">
            <div className="inline-block bg-black/75 text-white px-4 py-2 rounded">
              <p className="text-lg">{currentSubtitle}</p>
            </div>
          </div>
        )}
      </div>

      {/* Video Controls */}
      <div className="space-y-4 bg-secondary/50 p-4 rounded-lg">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="relative">
            <Slider
              value={[currentTime || 0]}
              max={duration || 1}
              step={0.1}
              onValueChange={handleSeek}
              className="w-full"
              disabled={!duration || duration === 0}
            />
            {/* Buffered Progress */}
            <div
              className="absolute top-0 left-0 h-full bg-secondary/30 rounded pointer-events-none"
              style={{ width: `${buffered}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{duration > 0 ? formatTime(duration) : 'Loading...'}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              onClick={handlePlayPause}
              size="icon"
              variant="secondary"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              onClick={handleRestart}
              size="icon"
              variant="ghost"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="w-24"
            />
          </div>
        </div>
      </div>

      {/* Transcript */}
      {transcript && transcript.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Subtitles / Transcript</h3>
          <div className="h-48 border rounded-lg p-3 overflow-y-auto scrollbar-hide">
            <div className="space-y-2">
              {transcript.map((item, index) => {
                const itemTime = item.start ?? item.timestamp ?? 0;
                const isActive = currentTime >= itemTime &&
                  currentTime < (item.end ?? itemTime + 3);

                return (
                  <button
                    key={index}
                    onClick={() => handleTranscriptClick(item)}
                    className={`block text-left w-full p-2 rounded transition-colors ${
                      isActive
                        ? 'bg-primary/5 text-primary'
                        : ''
                    }`}
                  >
                    <div className="flex flex-col justify-center">
                      <span className="text-xs text-muted-foreground">
                        {formatTime(itemTime)}
                      </span>
                      <p className="text-sm">{item.text}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}