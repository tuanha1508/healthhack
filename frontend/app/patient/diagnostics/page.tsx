"use client";

import React, { useState, useRef, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import YouTubePlayer from '@/components/YouTubePlayer';
import { Card } from '@/components/Card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Clock, Video, MessageSquare, Send, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

interface TranscriptItem {
  timestamp: number;
  text: string;
}

interface Diagnostic {
  id: number;
  date: string;
  time: string;
  type: string;
  status: 'completed' | 'pending' | 'in-progress';
  video_url?: string;
  summary: string;
  transcript?: TranscriptItem[];
}

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

// Hardcoded transcript for testing
const BRAIN_FOOD_TRANSCRIPT: TranscriptItem[] = [
  { timestamp: 6, text: "Your Brain on Food" },
  { timestamp: 9, text: "If you sucked all of the moisture out of your brain" },
  { timestamp: 12, text: "and broke it down to its constituent nutritional content," },
  { timestamp: 16, text: "what would it look like?" },
  { timestamp: 18, text: "Most of the weight of your dehydrated brain would come from fats," },
  { timestamp: 22, text: "also known as lipids." },
  { timestamp: 24, text: "In the remaining brain matter, you would find proteins and amino acids," },
  { timestamp: 28, text: "traces of micronutrients," },
  { timestamp: 30, text: "and glucose." },
  { timestamp: 32, text: "The brain is, of course, more than just the sum of its nutritional parts," },
  { timestamp: 37, text: "but each component does have a distinct impact on functioning," },
  { timestamp: 41, text: "development," },
  { timestamp: 42, text: "mood," },
  { timestamp: 43, text: "and energy." },
  { timestamp: 44, text: "So that post-lunch apathy," },
  { timestamp: 46, text: "or late-night alertness you might be feeling," },
  { timestamp: 49, text: "well, that could simply be the effects of food on your brain." },
  { timestamp: 54, text: "Of the fats in your brain, the superstars are omegas 3 and 6." },
  { timestamp: 59, text: "These essential fatty acids," },
  { timestamp: 61, text: "which have been linked to preventing degenerative brain conditions," },
  { timestamp: 65, text: "must come from our diets." },
  { timestamp: 67, text: "So eating omega-rich foods," },
  { timestamp: 69, text: "like nuts," },
  { timestamp: 69, text: "seeds," },
  { timestamp: 70, text: "and fatty fish," },
  { timestamp: 71, text: "is crucial to the creation and maintenance of cell membranes." },
  { timestamp: 76, text: "And while omegas are good fats for your brain," },
  { timestamp: 79, text: "long-term consumption of other fats, like trans and saturated fats," },
  { timestamp: 83, text: "may compromise brain health." },
  { timestamp: 86, text: "Meanwhile, proteins and amino acids," },
  { timestamp: 89, text: "the building block nutrients of growth and development," },
  { timestamp: 92, text: "manipulate how we feel and behave." },
  { timestamp: 95, text: "Amino acids contain the precursors to neurotransmitters," },
  { timestamp: 99, text: "the chemical messengers that carry signals between neurons," },
  { timestamp: 103, text: "affecting things like mood," },
  { timestamp: 105, text: "sleep," },
  { timestamp: 106, text: "attentiveness," },
  { timestamp: 107, text: "and weight." },
  { timestamp: 109, text: "They're one of the reasons we might feel calm after eating a large plate of pasta," },
  { timestamp: 113, text: "or more alert after a protein-rich meal." },
  { timestamp: 116, text: "The complex combinations of compounds in food" },
  { timestamp: 119, text: "can stimulate brain cells to release mood-altering norepinephrine," },
  { timestamp: 124, text: "dopamine," },
  { timestamp: 126, text: "and serotonin." },
  { timestamp: 127, text: "But getting to your brain cells is tricky," },
  { timestamp: 129, text: "and amino acids have to compete for limited access." },
  { timestamp: 133, text: "A diet with a range of foods helps maintain a balanced combination" },
  { timestamp: 137, text: "of brain messengers," },
  { timestamp: 139, text: "and keeps your mood from getting skewed in one direction or the other." },
  { timestamp: 143, text: "Like the other organs in our bodies," },
  { timestamp: 145, text: "our brains also benefit from a steady supply of micronutrients." },
  { timestamp: 150, text: "Antioxidants in fruits and vegetables" },
  { timestamp: 152, text: "strengthen the brain to fight off free radicals that destroy brain cells," },
  { timestamp: 157, text: "enabling your brain to work well for a longer period of time." },
  { timestamp: 161, text: "And without powerful micronutrients," },
  { timestamp: 163, text: "like the vitamins B6," },
  { timestamp: 164, text: "B12," },
  { timestamp: 165, text: "and folic acid," },
  { timestamp: 167, text: "our brains would be susceptible to brain disease and mental decline." },
  { timestamp: 171, text: "Trace amounts of the minerals iron," },
  { timestamp: 173, text: "copper," },
  { timestamp: 174, text: "zinc," },
  { timestamp: 175, text: "and sodium" },
  { timestamp: 176, text: "are also fundamental to brain health and early cognitive development." },
  { timestamp: 181, text: "In order for the brain to efficiently transform and synthesize" },
  { timestamp: 184, text: "these valuable nutrients," },
  { timestamp: 186, text: "it needs fuel, and lots of it." },
  { timestamp: 188, text: "While the human brain only makes up about 2% of our body weight," },
  { timestamp: 192, text: "it uses up to 20% of our energy resources." },
  { timestamp: 196, text: "Most of this energy comes from carbohydrates" },
  { timestamp: 199, text: "that our body digests into glucose, or blood sugar." },
  { timestamp: 204, text: "The frontal lobes are so sensitive to drops in glucose, in fact," },
  { timestamp: 208, text: "that a change in mental function is one of the primary signals" },
  { timestamp: 211, text: "of nutrient deficiency." },
  { timestamp: 214, text: "Assuming that we are getting glucose regularly," },
  { timestamp: 217, text: "how does the specific type of carbohydrates we eat affect our brains?" },
  { timestamp: 222, text: "Carbs come in three forms:" },
  { timestamp: 224, text: "starch," },
  { timestamp: 224, text: "sugar," },
  { timestamp: 225, text: "and fiber." },
  { timestamp: 227, text: "While on most nutrition labels," },
  { timestamp: 228, text: "they are all lumped into one total carb count," },
  { timestamp: 232, text: "the ratio of the sugar and fiber subgroups to the whole amount" },
  { timestamp: 236, text: "affect how the body and brain respond." },
  { timestamp: 239, text: "A high glycemic food, like white bread," },
  { timestamp: 242, text: "causes a rapid release of glucose into the blood," },
  { timestamp: 245, text: "and then comes the dip." },
  { timestamp: 247, text: "Blood sugar shoots down, and with it, our attention span and mood." },
  { timestamp: 252, text: "On the other hand, oats, grains, and legumes have slower glucose release," },
  { timestamp: 257, text: "enabling a steadier level of attentiveness." },
  { timestamp: 261, text: "For sustained brain power," },
  { timestamp: 263, text: "opting for a varied diet of nutrient-rich foods is critical." },
  { timestamp: 267, text: "When it comes to what you bite, chew, and swallow," },
  { timestamp: 269, text: "your choices have a direct and long-lasting effect" },
  { timestamp: 273, text: "on the most powerful organ in your body." }
];

export default function DiagnosticsPage() {
  // Hardcoded test video for demonstration
  const testDiagnostic: Diagnostic = {
    id: 1,
    date: "December 15, 2024",
    time: "10:30 AM",
    type: "Educational: Your Brain on Food",
    status: 'completed',
    video_url: "https://www.youtube.com/watch?v=xyQY8a-ng6g",
    summary: "Learn about how nutrition affects your brain function, mood, and cognitive performance.",
    transcript: BRAIN_FOOD_TRANSCRIPT
  };

  const [diagnosticHistory, setDiagnosticHistory] = useState<Diagnostic[]>([testDiagnostic]);
  const [selectedDiagnostic, setSelectedDiagnostic] = useState<Diagnostic | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);


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
    <DashboardLayout userType="patient" userName="John Doe">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Medical Video Library</h1>
          <p className="text-muted-foreground mt-2">Watch educational videos and ask questions about the content</p>
        </div>

        {/* Diagnostics List */}
        <Card title="Available Videos" subtitle="Click on any video to watch and learn">
          <div className="space-y-4">
            {diagnosticHistory.map((diagnostic) => (
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
            ))}
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
            {/* Left side - YouTube Player */}
            <div className="w-[70%]">
              {selectedDiagnostic?.video_url && (
                <YouTubePlayer
                  videoUrl={selectedDiagnostic.video_url}
                  transcript={selectedDiagnostic.transcript || []}
                  currentTime={currentTime}
                  isPlaying={isPlaying}
                  onTimeUpdate={setCurrentTime}
                  onPlayPause={handlePlayPause}
                />
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