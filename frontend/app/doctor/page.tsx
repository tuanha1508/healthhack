"use client";

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/Card';
import { Badge } from '@/components/ui/badge';
import { FileVideo, Calendar, Clock, CheckCircle, AlertCircle, Pill } from 'lucide-react';

interface Activity {
  id: string;
  type: 'video' | 'prescription';
  title: string;
  date: string;
  status?: 'watched' | 'unwatched' | 'in-progress' | 'read' | 'unread' | 'active';
  completedAt?: string;
  patientName?: string;
  medications?: string[];
}

export default function DoctorDashboard() {
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    setIsLoading(true);
    try {
      // Fetch both videos and prescriptions
      const [videosResponse, prescriptionsResponse] = await Promise.all([
        fetch('https://57315631503a.ngrok-free.app/api/videos/list'),
        fetch('https://57315631503a.ngrok-free.app/api/prescription/list')
      ]);

      const allActivities: Activity[] = [];

      // Process videos
      if (videosResponse.ok) {
        const videosData = await videosResponse.json();
        const videoActivities: Activity[] = videosData.videos.map((video: any) => ({
          id: video.id,
          type: 'video' as const,
          title: video.type.replace('Doctor Instruction: ', ''),
          date: video.date,
          status: video.status as 'watched' | 'unwatched' | 'in-progress',
          completedAt: video.completedAt,
          patientName: 'Current Patient'
        }));
        allActivities.push(...videoActivities);
      }

      // Process prescriptions
      if (prescriptionsResponse.ok) {
        const prescriptionsData = await prescriptionsResponse.json();
        const prescriptionActivities: Activity[] = prescriptionsData.prescriptions.map((prescription: any) => ({
          id: prescription.id,
          type: 'prescription' as const,
          title: `Prescribed ${prescription.medications.length} medication${prescription.medications.length > 1 ? 's' : ''}`,
          date: new Date(prescription.created_at).toLocaleDateString(),
          status: prescription.read ? 'read' : 'unread',
          completedAt: prescription.read_at ? new Date(prescription.read_at).toLocaleDateString() : undefined,
          patientName: prescription.patient_name,
          medications: prescription.medications
        }));
        allActivities.push(...prescriptionActivities);
      }

      // Sort all activities by date (most recent first)
      allActivities.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });

      // Take the 8 most recent activities
      setRecentActivity(allActivities.slice(0, 8));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'watched':
      case 'read':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'unread':
      case 'unwatched':
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getActivityIcon = (type: string) => {
    if (type === 'prescription') {
      return null;
    }
    return <FileVideo className="h-5 w-5 text-muted-foreground mt-0.5" />;
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
                      {getActivityIcon(activity.type)}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{activity.title}</p>
                          {activity.status && getStatusIcon(activity.status)}
                        </div>

                        {/* Show medications list for prescriptions */}
                        {activity.type === 'prescription' && activity.medications && (
                          <div className="mt-1">
                            <p className="text-xs text-muted-foreground mb-1">Medications:</p>
                            <div className="flex flex-wrap gap-1">
                              {activity.medications.map((med, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {med.charAt(0).toUpperCase() + med.slice(1)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {activity.type === 'prescription' ? 'Prescribed' : 'Sent'}: {activity.date}
                          </span>
                          {activity.completedAt && (
                            <span className="text-green-600">
                              {activity.type === 'prescription' ? 'Read' : 'Completed'}: {activity.completedAt}
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
                        activity.status === 'watched' || activity.status === 'read' ? 'default' :
                        activity.status === 'in-progress' ? 'secondary' :
                        'outline'
                      }
                      className={
                        activity.status === 'watched' || activity.status === 'read' ? 'bg-green-500' :
                        activity.status === 'unread' ? 'bg-blue-600 text-white' : ''
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