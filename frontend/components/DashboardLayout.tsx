"use client";

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Calendar,
  FileText,
  Home,
  MessageSquare,
  Pill,
  Users,
  Bell,
  Settings,
  Heart,
  BarChart3
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DashboardLayoutProps {
  children: ReactNode;
  userType: 'patient' | 'doctor';
  userName?: string;
}

export default function DashboardLayout({ children, userType, userName = 'User' }: DashboardLayoutProps) {
  const pathname = usePathname();

  const patientNavItems = [
    { name: 'Overview', href: '/patient', icon: BarChart3 },
    { name: 'Diagnostics', href: '/patient/diagnostics', icon: Activity },
  ];

  const doctorNavItems = [
    { name: 'Dashboard', href: '/doctor', icon: BarChart3 },
    { name: 'Patients', href: '/doctor/patients', icon: Users },
  ];

  const navItems = userType === 'patient' ? patientNavItems : doctorNavItems;

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex w-full">
        <Sidebar>
          <SidebarHeader className="p-4 border-b">
            <Link href="/" className="flex items-center space-x-2">
              <Activity className="h-6 w-6" />
              <span className="text-xl font-bold">HealthCare</span>
            </Link>
            <Badge variant="secondary" className="mt-2 w-fit">
              {userType === 'patient' ? 'Patient Portal' : 'Doctor Portal'}
            </Badge>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link href={item.href}>
                            <Icon className="h-4 w-4" />
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-sm font-semibold">{userName[0]}</span>
                </div>
                <span className="text-sm font-medium">{userName}</span>
              </div>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="border-b px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <SidebarTrigger />
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}