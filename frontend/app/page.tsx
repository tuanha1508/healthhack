import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  ChevronRight
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
      </main>
    </div>
  );
}