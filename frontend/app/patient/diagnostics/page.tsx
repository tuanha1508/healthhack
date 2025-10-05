"use client";

import React, { useState, useRef, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import YouTubePlayer from '@/components/YouTubePlayer';
import LocalVideoPlayer from '@/components/LocalVideoPlayer';
import { Card } from '@/components/Card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Clock, Video, MessageSquare, Send, Loader2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

interface TranscriptItem {
  timestamp: number;
  text: string;
  start?: number;
  end?: number;
}

interface Diagnostic {
  id: string | number;
  date: string;
  time: string;
  type: string;
  status: 'completed' | 'pending' | 'in-progress' | 'watched' | 'unwatched';
  video_url?: string;
  summary: string;
  transcript?: TranscriptItem[];
  isLocalVideo?: boolean;
}

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
}


export default function DiagnosticsPage() {
  const [diagnosticHistory, setDiagnosticHistory] = useState<Diagnostic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDiagnostic, setSelectedDiagnostic] = useState<Diagnostic | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch videos from backend on mount
  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/videos/list');
      if (response.ok) {
        const data = await response.json();
        // Transform the transcript format if needed
        const videos = data.videos.map((video: any) => ({
          ...video,
          isLocalVideo: true,
          // Convert transcript format from {start, end, text} to {timestamp, text} if needed
          transcript: video.transcript?.map((item: any) => ({
            timestamp: item.start || 0,
            start: item.start,
            end: item.end,
            text: item.text
          })) || []
        }));
        setDiagnosticHistory(videos);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle diagnostic selection
  const handleSelectDiagnostic = (diagnostic: Diagnostic) => {
    setSelectedDiagnostic(diagnostic);
    setCurrentTime(0);
    setIsPlaying(false);

    // Reset messages
    setMessages([
      {
        id: 1,
        text: "Hello! I'm here to help you understand this educational video about brain nutrition. Feel free to pause at any time to ask questions about what you've watched.",
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() && selectedDiagnostic) {
      const newMessage: Message = {
        id: messages.length + 1,
        text: inputMessage,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...messages, newMessage]);
      const userQuery = inputMessage.toLowerCase();
      setInputMessage('');
      setIsLoadingChat(true);

      try {
        // Call the Groq API through the backend
        const response = await fetch('http://localhost:8000/api/chat/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: inputMessage,
            transcript: selectedDiagnostic.transcript || [],
            current_time: currentTime,
            video_duration: 273 // Total duration of the brain food video
          }),
        });

        const data = await response.json();

        const botResponse: Message = {
          id: messages.length + 2,
          text: data.response || "I apologize, I couldn't process your question. Please try again.",
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botResponse]);
      } catch (error) {
        console.error('Error sending message:', error);
        const errorResponse: Message = {
          id: messages.length + 2,
          text: "I'm having trouble connecting to the AI service. Please make sure the backend is running on port 8000.",
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errorResponse]);
      } finally {
        setIsLoadingChat(false);
      }
    }
  };

  const handlePlayPause = (playing: boolean) => {
    setIsPlaying(playing);

    // Show a helpful message when paused for the first time
    if (!playing && messages.length === 1) {
      const pauseMessage: Message = {
        id: messages.length + 1,
        text: "Video paused. Feel free to ask questions about what you've watched so far! I can help explain any medical terms or concepts.",
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, pauseMessage]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'in-progress':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <DashboardLayout userType="patient" userName="Current Patient">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Medical Video Library</h1>
            <p className="text-muted-foreground mt-2">Watch educational videos and ask questions about the content</p>
          </div>
          <Button
            onClick={fetchVideos}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        {/* Diagnostics List */}
        <Card title="Available Videos" subtitle="Click on any video to watch and learn">
          <div className="space-y-4">
            {isLoading && diagnosticHistory.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading videos...</span>
              </div>
            ) : diagnosticHistory.length === 0 ? (
              <p className="text-center text-muted-foreground p-8">
                No videos available yet. Your doctor will send you instructional videos that will appear here.
              </p>
            ) : (
              diagnosticHistory.map((diagnostic) => (
              <button
                key={diagnostic.id}
                onClick={() => handleSelectDiagnostic(diagnostic)}
                className="w-full text-left transition-colors hover:bg-accent rounded-lg"
              >
                <div className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <p className="font-medium">{diagnostic.date}</p>
                      <Badge variant={getStatusColor(diagnostic.status)}>
                        {diagnostic.status}
                      </Badge>
                    </div>
                    <div className="mt-2 ml-7">
                      <p className="text-sm font-medium">{diagnostic.type}</p>
                      <p className="text-sm text-muted-foreground mt-1">{diagnostic.summary}</p>
                      <div className="flex items-center mt-2 space-x-4">
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {diagnostic.time}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Video className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </button>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Modal for viewing video */}
      <Dialog open={!!selectedDiagnostic} onOpenChange={() => setSelectedDiagnostic(null)}>
        <DialogContent className="max-w-[95vw] w-full h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {selectedDiagnostic?.type} - {selectedDiagnostic?.date}
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-4 h-[calc(90vh-8rem)] overflow-hidden">
            {/* Left side - Video Player */}
            <div className="w-[70%]">
              {selectedDiagnostic?.video_url && (
                selectedDiagnostic.isLocalVideo ? (
                  <LocalVideoPlayer
                    videoUrl={selectedDiagnostic.video_url}
                    transcript={selectedDiagnostic.transcript || []}
                    currentTime={currentTime}
                    isPlaying={isPlaying}
                    onTimeUpdate={setCurrentTime}
                    onPlayPause={handlePlayPause}
                  />
                ) : (
                  <YouTubePlayer
                    videoUrl={selectedDiagnostic.video_url}
                    transcript={selectedDiagnostic.transcript || []}
                    currentTime={currentTime}
                    isPlaying={isPlaying}
                    onTimeUpdate={setCurrentTime}
                    onPlayPause={handlePlayPause}
                  />
                )
              )}
            </div>

            {/* Right side - Chat */}
            <div className="w-[30%] flex flex-col border rounded-lg h-full overflow-hidden">
              <div className="p-4 border-b flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <h3 className="font-semibold">AI Assistant</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ask questions about the video content
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 min-h-0 scrollbar-hide">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.sender === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm break-words">{message.text}</p>
                        <p className="text-xs mt-1 opacity-70">{message.timestamp}</p>
                      </div>
                    </div>
                  ))}
                  {isLoadingChat && (
                    <div className="flex justify-start">
                      <div className="bg-muted p-3 rounded-lg">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="p-4 border-t flex-shrink-0">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type your message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isLoadingChat && handleSendMessage()}
                    disabled={isLoadingChat}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} size="icon" disabled={isLoadingChat} className="flex-shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}