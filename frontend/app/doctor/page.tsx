"use client";

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/Card';
import { Users, Video, Calendar, TrendingUp } from 'lucide-react';

export default function DoctorDashboard() {
  return (
    <DashboardLayout userType="doctor" userName="Current Doctor">
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
          <p className="text-muted-foreground">Monitor patient progress and manage video instructions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            title="Current Patient"
            value="1"
            description="Active"
            icon={<Users className="h-4 w-4" />}
          />
          <Card
            title="Videos Sent"
            value="23"
            description="Total"
            icon={<Video className="h-4 w-4" />}
          />
          <Card
            title="Next Review"
            value="Dec 8"
            description="Scheduled"
            icon={<Calendar className="h-4 w-4" />}
          />
          <Card
            title="Completion Rate"
            value="92%"
            description="Patient engagement"
            icon={<TrendingUp className="h-4 w-4" />}
          />
        </div>

        {/* Recent Activity */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}