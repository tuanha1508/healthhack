"use client";

import DashboardLayout from '@/components/DashboardLayout';
import { Card, StatCard } from '@/components/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Heart,
  Activity,
  Thermometer,
  Weight,
  Calendar,
  Clock,
  Pill,
  FileText,
  TrendingUp
} from 'lucide-react';

export default function PatientDashboard() {
  // Cognitive metrics (will be loaded from database later)
  const cognitiveMetrics = {
    lastAssessment: '-',
    nextAssessment: '-',
    voiceAnalysisCount: '0',
    consistencyScore: '-'
  };

  return (
    <DashboardLayout userType="patient" userName="Current Patient">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Overview</h1>
          <p className="text-muted-foreground mt-2">Your cognitive health at a glance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Voice Analyses"
            value={cognitiveMetrics.voiceAnalysisCount}
            change="This month"
            changeType="neutral"
            icon={<Activity className="w-6 h-6 text-muted-foreground" />}
          />
          <StatCard
            title="Consistency Score"
            value={cognitiveMetrics.consistencyScore}
            change="Stable pattern"
            changeType="positive"
            icon={<TrendingUp className="w-6 h-6 text-muted-foreground" />}
          />
          <StatCard
            title="Last Assessment"
            value={cognitiveMetrics.lastAssessment}
            change="Completed"
            changeType="positive"
            icon={<Calendar className="w-6 h-6 text-muted-foreground" />}
          />
          <StatCard
            title="Next Assessment"
            value={cognitiveMetrics.nextAssessment}
            change="Scheduled"
            changeType="neutral"
            icon={<Clock className="w-6 h-6 text-muted-foreground" />}
          />
        </div>

        {/* Cognitive Health Summary */}
        <Card title="Cognitive Health Summary" subtitle="Current status and trends">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Voice Pattern</span>
                <Badge variant="default" className="text-xs">Stable</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Consistent speech patterns detected</p>
              <Progress value={85} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">Last analyzed: Nov 8, 2024</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Memory Function</span>
                <Badge variant="default" className="text-xs">Normal</Badge>
              </div>
              <p className="text-sm text-muted-foreground">No decline detected</p>
              <Progress value={92} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">Last tested: Nov 5, 2024</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Response Time</span>
                <Badge variant="secondary" className="text-xs">Monitored</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Within expected range</p>
              <Progress value={78} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">Ongoing monitoring</p>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions" subtitle="Common tasks">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Activity className="w-8 h-8" />
              <span>Start Voice Recording</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <FileText className="w-8 h-8" />
              <span>View Reports</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Calendar className="w-8 h-8" />
              <span>Schedule Assessment</span>
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}