"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [buffered, setBuffered] = useState(0);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');

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
      setDuration(video.duration);
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered((bufferedEnd / video.duration) * 100);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('progress', handleProgress);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('progress', handleProgress);
    };
  }, [transcript, onTimeUpdate]);

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

  // Determine if this is a local video or external URL
  const isLocalVideo = videoUrl.startsWith('/api/videos/');
  const fullVideoUrl = isLocalVideo ? `http://localhost:8000${videoUrl}` : videoUrl;

  return (
    <div className="space-y-4">
      {/* Video Container */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={fullVideoUrl}
          className="w-full h-auto"
          onClick={handlePlayPause}
          controls={false}
        />

        {/* Subtitle Overlay */}
        {currentSubtitle && (
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
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="w-full"
            />
            {/* Buffered Progress */}
            <div
              className="absolute top-0 left-0 h-full bg-secondary/30 rounded pointer-events-none"
              style={{ width: `${buffered}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
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
          <ScrollArea className="h-48 border rounded-lg p-3">
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
                        ? 'bg-primary/20 text-primary'
                        : 'hover:bg-secondary'
                    }`}
                  >
                    <span className="text-xs text-muted-foreground">
                      {formatTime(itemTime)}
                    </span>
                    <p className="text-sm">{item.text}</p>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}