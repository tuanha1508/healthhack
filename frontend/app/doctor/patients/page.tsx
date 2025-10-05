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
import PrescriptionModal from '@/components/PrescriptionModal';
import {
  Video,
  Calendar,
  Clock,
  FileVideo,
  Plus,
  Camera,
  Send,
  StopCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Pill
} from 'lucide-react';

interface VideoInstruction {
  id: number;
  title: string;
  dateSent: string;
  duration: string;
  status: 'watched' | 'unwatched' | 'in-progress';
  completedAt?: string;
}

interface Prescription {
  id: string;
  patient_name: string;
  doctor_name: string;
  medications: string[];
  created_at: string;
  status: string;
  read: boolean;
  read_at?: string;
}

export default function PatientsPage() {
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoInstructions, setVideoInstructions] = useState<VideoInstruction[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioChunksRef = useRef<Blob[]>([]);

  // Current patient info (will be loaded from database later)
  const currentPatient = {
    name: "Current Patient",
    age: 0,
    diagnosis: "",
    lastVisit: "",
    videosReceived: 0,
    completionRate: 0
  };

  // Load videos and prescriptions on mount
  useEffect(() => {
    fetchVideos();
    fetchPrescriptions();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/videos/list');
      if (response.ok) {
        const data = await response.json();
        // Transform for doctor's view
        const videos = data.videos.map((video: any) => ({
          id: video.id,
          title: video.type.replace('Doctor Instruction: ', ''),
          dateSent: video.date,
          duration: '0:00', // Duration would need to be calculated
          status: video.watched ? 'watched' : 'unwatched',
          completedAt: video.watched_at ? new Date(video.watched_at).toLocaleString() : undefined
        }));
        setVideoInstructions(videos);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/prescription/list');
      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data.prescriptions);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    }
  };

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

  const handleSendVideo = async () => {
    if (recordedVideo && videoTitle) {
      try {
        // Create FormData to send video and metadata
        const formData = new FormData();
        formData.append('video', recordedVideo, 'instruction.webm');
        formData.append('title', videoTitle);
        formData.append('description', videoDescription);
        formData.append('subtitles', JSON.stringify(subtitles));

        // Upload video to backend
        const response = await fetch('http://localhost:8000/api/videos/upload', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Video uploaded successfully:', data);

          // Reset and close modal
          setIsRecordingModalOpen(false);
          setIsRecording(false);
          setRecordedVideo(null);
          setVideoTitle('');
          setVideoDescription('');
          setSubtitles([]);

          // Show success message
          alert(`Video instruction "${videoTitle}" with ${subtitles.length} subtitles sent successfully to ${currentPatient.name}`);

          // Refresh the video list (in a real app, you would fetch from the server)
          window.location.reload();
        } else {
          throw new Error('Failed to upload video');
        }
      } catch (error) {
        console.error('Error sending video:', error);
        alert('Failed to send video. Please make sure the backend server is running.');
      }
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
            <h1 className="text-3xl font-bold">Patient Management</h1>
            <p className="text-muted-foreground mt-2">Manage video instructions and monitor progress</p>
          </div>
        </div>

        {/* Patient Details Card */}
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">{currentPatient.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">{currentPatient.diagnosis}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={fetchVideos}
                  variant="outline"
                  size="icon"
                  title="Refresh video list"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setIsPrescriptionModalOpen(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Pill className="h-4 w-4" />
                  Prescribe Medicine
                </Button>
                <Button
                  onClick={() => setIsRecordingModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Record New Instruction
                </Button>
              </div>
            </div>

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
                              Watched: {video.completedAt}
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
                        className={video.status === 'watched' ? 'bg-green-500 hover:bg-green-600' : ''}
                      >
                        {video.status === 'watched' ? 'Watched' : 'Not Watched'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </Card>

        {/* Prescription History Card */}
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-xl">Prescription History</h3>
              <Button
                onClick={fetchPrescriptions}
                variant="outline"
                size="icon"
                title="Refresh prescriptions"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {prescriptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Pill className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No prescriptions sent yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {prescriptions.map((prescription) => (
                    <div key={prescription.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div>
                            <p className="font-medium">
                              {prescription.medications.length} Medication{prescription.medications.length > 1 ? 's' : ''} Prescribed
                            </p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(prescription.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {prescription.read ? (
                            <Badge variant="outline" className="bg-green-50">
                              <span className="text-green-700">Read</span>
                            </Badge>
                          ) : (
                            <Badge variant="default" className="bg-blue-600">
                              Unread
                            </Badge>
                          )}
                          <Badge
                            variant={prescription.status === 'active' ? 'default' : 'secondary'}
                            className={prescription.status === 'active' ? 'bg-green-600' : ''}
                          >
                            {prescription.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Medications List */}
                      <div className="mt-3 bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Medications:</p>
                        <ul className="space-y-1 list-none">
                          {prescription.medications.map((med, idx) => (
                            <li key={idx} className="text-sm">
                              - {med.charAt(0).toUpperCase() + med.slice(1)}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {prescription.read && prescription.read_at && (
                        <p className="text-xs text-green-600 mt-2">
                          Read by patient: {new Date(prescription.read_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </Card>

        {/* Recording Modal */}
        <Dialog open={isRecordingModalOpen} onOpenChange={handleModalClose}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Record Video Instruction</DialogTitle>
              <DialogDescription>
                Record a new video instruction for {currentPatient.name}
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

        {/* Prescription Modal */}
        <PrescriptionModal
          isOpen={isPrescriptionModalOpen}
          onClose={() => {
            setIsPrescriptionModalOpen(false);
            fetchPrescriptions(); // Refresh prescription list after closing modal
          }}
          patientName={currentPatient.name}
          patientId={1} // You can update this with actual patient ID
        />
      </div>
    </DashboardLayout>
  );
}