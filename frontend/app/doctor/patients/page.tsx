"use client";

import React, { useState, useRef, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SubtitleEditor, { Subtitle } from '@/components/SubtitleEditor';
import {
  Search,
  Video,
  Calendar,
  Clock,
  ChevronRight,
  User,
  FileVideo,
  Plus,
  Mic,
  Camera,
  Send,
  StopCircle,
  AlertCircle,
  Loader2,
  Subtitles
} from 'lucide-react';

interface Patient {
  id: number;
  name: string;
  age: number;
  diagnosis: string;
  lastVisit: string;
  videosReceived: number;
  completionRate: number;
}

interface VideoInstruction {
  id: number;
  title: string;
  dateSent: string;
  duration: string;
  status: 'watched' | 'unwatched' | 'in-progress';
  completedAt?: string;
}

export default function PatientsPage() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioChunksRef = useRef<Blob[]>([]);

  // Sample data
  const patients: Patient[] = [
    {
      id: 1,
      name: "John Doe",
      age: 72,
      diagnosis: "Early-stage Alzheimer's",
      lastVisit: "Nov 10, 2024",
      videosReceived: 23,
      completionRate: 92
    },
    {
      id: 2,
      name: "Mary Smith",
      age: 68,
      diagnosis: "Mild Cognitive Impairment",
      lastVisit: "Nov 8, 2024",
      videosReceived: 18,
      completionRate: 88
    },
    {
      id: 3,
      name: "Robert Johnson",
      age: 75,
      diagnosis: "Memory Assessment Required",
      lastVisit: "Nov 5, 2024",
      videosReceived: 12,
      completionRate: 95
    },
    {
      id: 4,
      name: "Emma Wilson",
      age: 70,
      diagnosis: "Mild Dementia",
      lastVisit: "Nov 12, 2024",
      videosReceived: 30,
      completionRate: 85
    },
    {
      id: 5,
      name: "William Brown",
      age: 69,
      diagnosis: "Cognitive Monitoring",
      lastVisit: "Nov 7, 2024",
      videosReceived: 15,
      completionRate: 90
    }
  ];

  const videoInstructions: VideoInstruction[] = [
    {
      id: 1,
      title: "Daily Memory Exercise - Word Association",
      dateSent: "Nov 12, 2024",
      duration: "5:30",
      status: "watched",
      completedAt: "Nov 12, 2024 3:00 PM"
    },
    {
      id: 2,
      title: "Cognitive Assessment - Pattern Recognition",
      dateSent: "Nov 10, 2024",
      duration: "8:15",
      status: "watched",
      completedAt: "Nov 11, 2024 10:00 AM"
    },
    {
      id: 3,
      title: "Memory Training - Story Recall",
      dateSent: "Nov 8, 2024",
      duration: "6:45",
      status: "in-progress"
    },
    {
      id: 4,
      title: "Daily Exercise - Object Naming",
      dateSent: "Nov 6, 2024",
      duration: "4:20",
      status: "watched",
      completedAt: "Nov 7, 2024 2:30 PM"
    },
    {
      id: 5,
      title: "Weekly Assessment - Verbal Fluency",
      dateSent: "Nov 4, 2024",
      duration: "7:10",
      status: "unwatched"
    }
  ];

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Initialize camera when modal opens
  useEffect(() => {
    if (isRecordingModalOpen) {
      initializeCamera();
    } else {
      // Clean up when modal closes
      stopCamera();
      setRecordedVideo(null);
      setVideoTitle('');
      setVideoDescription('');
      setCameraPermissionDenied(false);
      setSubtitles([]);
      setIsTranscribing(false);
      setVideoDuration(0);
    }
  }, [isRecordingModalOpen]);

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraPermissionDenied(false);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraPermissionDenied(true);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleStartRecording = async () => {
    if (!streamRef.current) {
      await initializeCamera();
    }

    if (streamRef.current) {
      chunksRef.current = [];
      audioChunksRef.current = [];

      // Create main media recorder for video
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm'
      });

      // Also create an audio-only recorder for transcription
      const audioStream = new MediaStream(streamRef.current.getAudioTracks());

      // Check if we have audio tracks
      if (audioStream.getAudioTracks().length === 0) {
        console.warn('No audio tracks found in stream');
      } else {
        console.log(`Found ${audioStream.getAudioTracks().length} audio tracks`);
      }

      const audioRecorder = new MediaRecorder(audioStream, {
        mimeType: 'audio/webm'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      audioRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log(`Audio chunk received: ${event.data.size} bytes`);
        }
      };

      mediaRecorder.onstop = async () => {
        const videoBlob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedVideo(videoBlob);

        // Get video duration
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = URL.createObjectURL(videoBlob);
          videoRef.current.onloadedmetadata = () => {
            setVideoDuration(videoRef.current?.duration || 0);
          };
        }
      };

      audioRecorder.onstop = () => {
        // Process audio for transcription when audio recorder stops
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log(`Audio recording stopped. Total size: ${audioBlob.size} bytes, Chunks: ${audioChunksRef.current.length}`);

        if (audioBlob.size > 0) {
          transcribeAudio(audioBlob);
        } else {
          console.error('Audio blob is empty!');
          // Use video blob's audio track as fallback
          const videoBlob = new Blob(chunksRef.current, { type: 'video/webm' });
          if (videoBlob.size > 0) {
            console.log('Using video blob for transcription as fallback');
            transcribeAudio(videoBlob);
          }
        }
      };

      mediaRecorderRef.current = mediaRecorder;

      // Start recording with timeslice to ensure data is collected
      mediaRecorder.start(1000); // Collect data every second
      audioRecorder.start(1000); // Collect data every second

      // Store audio recorder reference for stopping
      (mediaRecorderRef as any).audioRecorder = audioRecorder;

      setIsRecording(true);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      // Also stop audio recorder
      if ((mediaRecorderRef as any).audioRecorder) {
        (mediaRecorderRef as any).audioRecorder.stop();
      }
      setIsRecording(false);
      stopCamera();
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      // Call backend API on port 8000
      const response = await fetch('http://localhost:8000/api/transcribe/', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setSubtitles(data.transcription || []);
        if (data.warning) {
          console.log('Transcription warning:', data.warning);
        }
      } else {
        console.error('Transcription failed:', response.status);
        // Use mock data as fallback
        setSubtitles([
          { start: 0.0, end: 2.5, text: "Hello, this is your doctor speaking." },
          { start: 2.5, end: 5.0, text: "Today we'll practice a simple memory exercise." },
          { start: 5.0, end: 8.0, text: "Please follow along with the instructions." }
        ]);
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      // Use mock data as fallback
      setSubtitles([
        { start: 0.0, end: 2.5, text: "Hello, this is your doctor speaking." },
        { start: 2.5, end: 5.0, text: "Today we'll practice a simple memory exercise." },
        { start: 5.0, end: 8.0, text: "Please follow along with the instructions." }
      ]);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSendVideo = () => {
    if (recordedVideo && videoTitle) {
      // In a real app, you would upload the video to a server here
      console.log('Sending video:', {
        title: videoTitle,
        description: videoDescription,
        patientId: selectedPatient?.id,
        videoBlob: recordedVideo,
        subtitles: subtitles
      });

      // Reset and close modal
      setIsRecordingModalOpen(false);
      setIsRecording(false);
      setRecordedVideo(null);
      setVideoTitle('');
      setVideoDescription('');
      setSubtitles([]);

      // Show success message (you could add a toast notification here)
      alert(`Video instruction "${videoTitle}" with ${subtitles.length} subtitles sent successfully to ${selectedPatient?.name}`);
    }
  };

  const handleModalClose = () => {
    if (isRecording) {
      handleStopRecording();
    }
    setIsRecordingModalOpen(false);
  };

  return (
    <DashboardLayout userType="doctor" userName="Dr. Smith">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Patients</h1>
            <p className="text-muted-foreground mt-2">Manage patient video instructions and monitor progress</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search patients by name..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient List */}
          <div className="lg:col-span-1">
            <Card>
              <div className="p-4 border-b">
                <h2 className="font-semibold">Patient List</h2>
              </div>
              <ScrollArea className="h-[600px]">
                <div className="p-4 space-y-2">
                  {filteredPatients.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient)}
                      className={`w-full p-4 rounded-lg border text-left transition-colors ${
                        selectedPatient?.id === patient.id
                          ? 'bg-secondary border-primary'
                          : 'hover:bg-secondary/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{patient.name}</p>
                          <p className="text-sm text-muted-foreground">Age: {patient.age}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground mt-1" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">{patient.diagnosis}</p>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="flex items-center gap-1">
                            <Video className="h-3 w-3" />
                            {patient.videosReceived} videos
                          </span>
                          <span className="text-green-600">{patient.completionRate}% rate</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </div>

          {/* Patient Details and Video History */}
          <div className="lg:col-span-2">
            {selectedPatient ? (
              <Card>
                <div className="p-6 border-b">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold">{selectedPatient.name}</h2>
                      <p className="text-sm text-muted-foreground mt-1">{selectedPatient.diagnosis}</p>
                    </div>
                    <Button
                      onClick={() => setIsRecordingModalOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Record New Instruction
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-secondary/50 rounded-lg">
                      <p className="text-2xl font-bold">{selectedPatient.videosReceived}</p>
                      <p className="text-xs text-muted-foreground">Videos Sent</p>
                    </div>
                    <div className="text-center p-3 bg-secondary/50 rounded-lg">
                      <p className="text-2xl font-bold">{selectedPatient.completionRate}%</p>
                      <p className="text-xs text-muted-foreground">Completion Rate</p>
                    </div>
                    <div className="text-center p-3 bg-secondary/50 rounded-lg">
                      <p className="text-sm font-medium mt-1">{selectedPatient.lastVisit}</p>
                      <p className="text-xs text-muted-foreground">Last Visit</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-semibold mb-4">Video Instruction History</h3>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {videoInstructions.map((video) => (
                        <div key={video.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-start gap-3">
                              <FileVideo className="h-5 w-5 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="font-medium">{video.title}</p>
                                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {video.dateSent}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {video.duration}
                                  </span>
                                </div>
                                {video.completedAt && (
                                  <p className="text-xs text-green-600 mt-1">
                                    Completed: {video.completedAt}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Badge
                              variant={
                                video.status === 'watched' ? 'default' :
                                video.status === 'in-progress' ? 'secondary' :
                                'outline'
                              }
                            >
                              {video.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="p-12 text-center">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a Patient</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a patient from the list to view their video instruction history
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Recording Modal */}
        <Dialog open={isRecordingModalOpen} onOpenChange={handleModalClose}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Record Video Instruction</DialogTitle>
              <DialogDescription>
                Record a new video instruction for {selectedPatient?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Camera Permission Error */}
              {cameraPermissionDenied && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Camera access denied. Please allow camera access in your browser settings to record video.
                  </AlertDescription>
                </Alert>
              )}

              {/* Video Preview/Recording Area */}
              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                <video
                  ref={videoRef}
                  autoPlay
                  muted={!recordedVideo}
                  controls={!!recordedVideo}
                  className="w-full h-full object-cover"
                />

                {/* Recording Indicator */}
                {isRecording && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Recording</span>
                  </div>
                )}

                {/* Transcribing Indicator */}
                {isTranscribing && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-full">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-sm font-medium">Transcribing...</span>
                  </div>
                )}

                {/* Placeholder when no camera */}
                {!streamRef.current && !recordedVideo && !cameraPermissionDenied && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera className="h-16 w-16 text-gray-500" />
                  </div>
                )}
              </div>

              {/* Tabs for Video Info and Subtitles */}
              {recordedVideo ? (
                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="info">Video Information</TabsTrigger>
                    <TabsTrigger value="subtitles">
                      Subtitles
                      {subtitles.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {subtitles.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Instruction Title *</label>
                      <Input
                        placeholder="Enter video instruction title..."
                        value={videoTitle}
                        onChange={(e) => setVideoTitle(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <textarea
                        className="w-full p-3 border rounded-lg text-sm"
                        rows={3}
                        placeholder="Add notes or instructions for the patient..."
                        value={videoDescription}
                        onChange={(e) => setVideoDescription(e.target.value)}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="subtitles">
                    <SubtitleEditor
                      subtitles={subtitles}
                      onSubtitlesChange={setSubtitles}
                      videoDuration={videoDuration}
                    />
                  </TabsContent>
                </Tabs>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Instruction Title *</label>
                    <Input
                      placeholder="Enter video instruction title..."
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      className="w-full p-3 border rounded-lg text-sm"
                      rows={3}
                      placeholder="Add notes or instructions for the patient..."
                      value={videoDescription}
                      onChange={(e) => setVideoDescription(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="flex justify-between">
                <div className="flex gap-2">
                  {!recordedVideo ? (
                    <>
                      {!isRecording ? (
                        <Button
                          onClick={handleStartRecording}
                          variant="destructive"
                          disabled={cameraPermissionDenied}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Start Recording
                        </Button>
                      ) : (
                        <Button onClick={handleStopRecording} variant="outline">
                          <StopCircle className="h-4 w-4 mr-2" />
                          Stop Recording
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      onClick={() => {
                        setRecordedVideo(null);
                        initializeCamera();
                      }}
                      variant="outline"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Record Again
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleModalClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendVideo}
                    disabled={!recordedVideo || !videoTitle}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send to Patient
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}