"use client";

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/Card';
import { Badge } from '@/components/ui/badge';
import { FileVideo, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface VideoActivity {
  id: number;
  title: string;
  date: string;
  status: 'watched' | 'unwatched' | 'in-progress';
  completedAt?: string;
  patientName?: string;
}

export default function DoctorDashboard() {
  const [recentActivity, setRecentActivity] = useState<VideoActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/videos/list');
      if (response.ok) {
        const data = await response.json();
        // Transform and sort videos by date (most recent first)
        const activities = data.videos
          .map((video: any) => ({
            id: video.id,
            title: video.type.replace('Doctor Instruction: ', ''),
            date: video.date,
            status: video.status as 'watched' | 'unwatched' | 'in-progress',
            completedAt: video.completedAt,
            patientName: 'Current Patient' // In a real app, this would come from the API
          }))
          .slice(0, 5); // Show only the 5 most recent activities
        setRecentActivity(activities);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      // Set some mock data if API fails
      setRecentActivity([
        {
          id: 1,
          title: "Memory Exercise",
          date: "2024-01-05",
          status: "watched",
          completedAt: "2024-01-05",
          patientName: "Current Patient"
        },
        {
          id: 2,
          title: "Daily Routine",
          date: "2024-01-04",
          status: "in-progress",
          patientName: "Current Patient"
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'watched':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <DashboardLayout userType="doctor" userName="Dr. Smith">
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
          <p className="text-muted-foreground">Monitor patient progress and manage video instructions</p>
        </div>

        {/* Recent Activity */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Patient Activity</h2>
            {isLoading ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Loading activity...</p>
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <FileVideo className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{activity.title}</p>
                          {getStatusIcon(activity.status)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Sent: {activity.date}
                          </span>
                          {activity.completedAt && (
                            <span className="text-green-600">
                              Completed: {activity.completedAt}
                            </span>
                          )}
                        </div>
                        {activity.patientName && (
                          <p className="text-xs text-muted-foreground">
                            Patient: {activity.patientName}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={
                        activity.status === 'watched' ? 'default' :
                        activity.status === 'in-progress' ? 'secondary' :
                        'outline'
                      }
                    >
                      {activity.status}
                    </Badge>
                  </div>
                ))}
                <div className="text-center pt-2">
                  <a href="/doctor/patients" className="text-sm text-primary hover:underline">
                    View all patient activities →
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">No recent activity</p>
                <div className="text-center">
                  <a href="/doctor/patients" className="text-sm text-primary hover:underline">
                    Go to Patient Management to record instructions →
                  </a>
                </div>
              </div>
            )}
          </div>
        </Card>

      </div>
    </DashboardLayout>
  );
}