"use client";

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/Card';
import { Users, Video, Calendar, TrendingUp } from 'lucide-react';

export default function DoctorDashboard() {
  return (
    <DashboardLayout userType="doctor" userName="Dr. Smith">
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
          <p className="text-muted-foreground">Monitor patient progress and manage video instructions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            title="Total Patients"
            value="24"
            description="Active patients"
            icon={<Users className="h-4 w-4" />}
          />
          <Card
            title="Videos Sent"
            value="156"
            description="This month"
            icon={<Video className="h-4 w-4" />}
          />
          <Card
            title="Upcoming Reviews"
            value="8"
            description="Next 7 days"
            icon={<Calendar className="h-4 w-4" />}
          />
          <Card
            title="Completion Rate"
            value="87%"
            description="+5% from last month"
            icon={<TrendingUp className="h-4 w-4" />}
          />
        </div>

        {/* Recent Activity */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium">John Doe completed memory exercise</p>
                  <p className="text-sm text-muted-foreground">2 hours ago</p>
                </div>
                <span className="text-sm text-green-600 font-medium">Completed</span>
              </div>
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium">Mary Smith received new video instruction</p>
                  <p className="text-sm text-muted-foreground">5 hours ago</p>
                </div>
                <span className="text-sm text-blue-600 font-medium">Sent</span>
              </div>
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium">Robert Johnson diagnostic review scheduled</p>
                  <p className="text-sm text-muted-foreground">Yesterday</p>
                </div>
                <span className="text-sm text-orange-600 font-medium">Pending</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Emma Wilson completed cognitive assessment</p>
                  <p className="text-sm text-muted-foreground">2 days ago</p>
                </div>
                <span className="text-sm text-green-600 font-medium">Completed</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}