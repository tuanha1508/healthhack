import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Users,
  Shield,
  Bell,
  Activity,
  ChevronRight,
  Lock,
  Zap,
  Heart
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8">
      <main className="max-w-5xl w-full space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center mb-4">
            <Activity className="h-12 w-12" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight">
            HealthCare Portal
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive health management for patients and doctors
          </p>
        </div>

        {/* Portal Selection */}
        <div className="grid md:grid-cols-2 gap-8 mt-16">
          {/* Patient Portal */}
          <Link href="/patient">
            <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer group border-2 hover:border-primary/50">
              <CardHeader>
                <div className="w-14 h-14 bg-secondary rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <User className="w-7 h-7" />
                </div>
                <CardTitle className="text-2xl">Patient Dashboard</CardTitle>
                <CardDescription className="mt-2">
                  Access your health records, appointments, medications, and wellness tracking tools.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center group-hover:translate-x-1 transition-transform">
                  <span className="text-sm font-medium">Enter Patient Portal</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Doctor Portal */}
          <Link href="/doctor">
            <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer group border-2 hover:border-primary/50">
              <CardHeader>
                <div className="w-14 h-14 bg-secondary rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Users className="w-7 h-7" />
                </div>
                <CardTitle className="text-2xl">Doctor Dashboard</CardTitle>
                <CardDescription className="mt-2">
                  Manage patient records, create video instructions, and monitor treatment progress.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center group-hover:translate-x-1 transition-transform">
                  <span className="text-sm font-medium">Enter Doctor Portal</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Features */}
        <Card className="mt-16">
          <CardHeader>
            <CardTitle>Key Features</CardTitle>
            <CardDescription>Everything you need for comprehensive health management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-sm">Secure Access</p>
                  <p className="text-xs text-muted-foreground">End-to-end encrypted data protection</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-sm">Real-time Updates</p>
                  <p className="text-xs text-muted-foreground">Instant notifications and alerts</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-sm">Comprehensive Care</p>
                  <p className="text-xs text-muted-foreground">Complete health management suite</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust Badges */}
        <div className="flex justify-center items-center space-x-4 pt-8">
          <Badge variant="secondary" className="px-4 py-2">
            <Shield className="w-3 h-3 mr-1" />
            HIPAA Compliant
          </Badge>
          <Badge variant="secondary" className="px-4 py-2">
            <Lock className="w-3 h-3 mr-1" />
            256-bit Encryption
          </Badge>
          <Badge variant="secondary" className="px-4 py-2">
            <Activity className="w-3 h-3 mr-1" />
            24/7 Monitoring
          </Badge>
        </div>
      </main>
    </div>
  );
}