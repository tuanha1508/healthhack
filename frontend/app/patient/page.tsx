"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Video,
  Calendar,
  Clock,
  Activity,
  CheckCircle2,
  Circle,
  PlayCircle,
  AlertCircle,
  Pill
} from 'lucide-react';

interface VideoItem {
  id: string | number;
  date: string;
  time: string;
  type: string;
  summary: string;
  watched: boolean;
}

interface ActivityItem {
  id: string | number;
  type: 'video_watched' | 'video_added' | 'prescription_received' | 'prescription_read';
  title: string;
  description: string;
  timestamp: string;
  icon: React.ReactNode;
  medications?: string[];
}

export default function PatientDashboard() {
  const router = useRouter();
  const [unwatchedVideos, setUnwatchedVideos] = useState<VideoItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchVideosAndActivity();
  }, []);

  const fetchVideosAndActivity = async () => {
    setIsLoading(true);
    try {
      // Fetch both videos and prescriptions
      const [videosResponse, prescriptionsResponse] = await Promise.all([
        fetch('https://57315631503a.ngrok-free.app/api/videos/list'),
        fetch('https://57315631503a.ngrok-free.app/api/prescription/list')
      ]);

      const activities: ActivityItem[] = [];

      // Process videos
      if (videosResponse.ok) {
        const videosData = await videosResponse.json();

        // Filter unwatched videos
        const unwatched = videosData.videos.filter((v: any) => !v.watched);
        setUnwatchedVideos(unwatched);

        // Add activities for recently watched videos
        videosData.videos
          .filter((v: any) => v.watched)
          .slice(0, 3)
          .forEach((v: any) => {
            activities.push({
              id: `video-${v.id}`,
              type: 'video_watched',
              title: `Watched: ${v.type}`,
              description: v.summary,
              timestamp: v.watched_at || '2 hours ago',
              icon: <CheckCircle2 className="w-4 h-4 text-green-500" />
            });
          });

        // Add activities for new videos
        videosData.videos
          .filter((v: any) => !v.watched)
          .slice(0, 2)
          .forEach((v: any) => {
            activities.push({
              id: `video-new-${v.id}`,
              type: 'video_added',
              title: `New video: ${v.type}`,
              description: v.summary,
              timestamp: v.date,
              icon: <AlertCircle className="w-4 h-4 text-blue-500" />
            });
          });
      }

      // Process prescriptions
      if (prescriptionsResponse.ok) {
        const prescriptionsData = await prescriptionsResponse.json();

        // Add activities for read prescriptions
        prescriptionsData.prescriptions
          .filter((p: any) => p.read)
          .slice(0, 2)
          .forEach((p: any) => {
            activities.push({
              id: `prescription-read-${p.id}`,
              type: 'prescription_read',
              title: `Prescription reviewed`,
              description: `${p.medications.length} medication${p.medications.length > 1 ? 's' : ''} from ${p.doctor_name}`,
              timestamp: p.read_at ? new Date(p.read_at).toLocaleString() : '',
              icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
              medications: p.medications
            });
          });

        // Add activities for new prescriptions
        prescriptionsData.prescriptions
          .filter((p: any) => !p.read)
          .slice(0, 2)
          .forEach((p: any) => {
            activities.push({
              id: `prescription-new-${p.id}`,
              type: 'prescription_received',
              title: `New prescription from ${p.doctor_name}`,
              description: `${p.medications.length} medication${p.medications.length > 1 ? 's' : ''} prescribed`,
              timestamp: new Date(p.created_at).toLocaleString(),
              icon: <Pill className="w-4 h-4 text-blue-500" />,
              medications: p.medications
            });
          });
      }

      // Sort activities by timestamp (most recent first)
      activities.sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateB.getTime() - dateA.getTime();
      });

      setRecentActivity(activities.slice(0, 8));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsWatched = async (videoId: string | number) => {
    try {
      const response = await fetch(`https://57315631503a.ngrok-free.app/api/videos/${videoId}/watched`, {
        method: 'POST',
      });

      if (response.ok) {
        // Refresh the data
        fetchVideosAndActivity();
      }
    } catch (error) {
      console.error('Error marking video as watched:', error);
    }
  };

  const handleWatchVideo = (videoId: string | number) => {
    // Mark as watched and navigate to diagnostics page
    markAsWatched(videoId);
    router.push('/patient/diagnostics');
  };

  return (
    <DashboardLayout userType="patient" userName="Current Patient">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Overview</h1>
          <p className="text-muted-foreground mt-2">Your recent activity and new content</p>
        </div>

        {/* Unwatched Videos Section */}
        {unwatchedVideos.length > 0 && (
          <Card title="New Videos from Your Doctor" subtitle="Videos you haven't watched yet">
            <div className="space-y-3">
              {unwatchedVideos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Circle className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{video.type}</h4>
                        <Badge variant="secondary" className="text-xs">New</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{video.summary}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {video.date}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {video.time}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleWatchVideo(video.id)}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Watch Now
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Recent Activity */}
        <Card title="Recent Activity">
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No recent activity. Check back later for updates.
              </p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-accent/50 rounded-lg transition-colors">
                  <div className="mt-1">
                    {activity.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{activity.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>

                    {/* Show medications for prescription activities */}
                    {(activity.type === 'prescription_received' || activity.type === 'prescription_read') && activity.medications && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {activity.medications.slice(0, 3).map((med, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {med}
                          </Badge>
                        ))}
                        {activity.medications.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{activity.medications.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-2">{activity.timestamp}</p>
                  </div>

                  {/* Add action button for new prescriptions */}
                  {activity.type === 'prescription_received' && (
                    <Button
                      onClick={() => router.push('/patient/prescriptions')}
                      size="sm"
                      variant="outline"
                    >
                      View
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}