"use client";

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Download,
  Upload,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Pill,
  Activity,
  AlertCircle,
  ChevronRight,
  File,
  Eye,
  Printer,
  Share2,
  FolderOpen,
  TestTube,
  Heart,
  Brain,
  Bone
} from 'lucide-react';

interface MedicalRecord {
  id: number;
  type: 'visit' | 'lab' | 'imaging' | 'prescription' | 'procedure';
  title: string;
  date: string;
  doctor: string;
  department: string;
  status: 'completed' | 'pending' | 'in-review';
  summary?: string;
  attachments?: number;
}

interface LabResult {
  id: number;
  testName: string;
  value: string;
  normalRange: string;
  status: 'normal' | 'high' | 'low';
  date: string;
}

interface Document {
  id: number;
  name: string;
  type: string;
  size: string;
  uploadedDate: string;
  category: string;
}

export default function HealthRecords() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Sample data
  const medicalHistory: MedicalRecord[] = [
    {
      id: 1,
      type: 'visit',
      title: 'Annual Physical Examination',
      date: 'Oct 28, 2024',
      doctor: 'Dr. Sarah Johnson',
      department: 'General Practice',
      status: 'completed',
      summary: 'Routine checkup completed. All vitals normal.',
      attachments: 3
    },
    {
      id: 2,
      type: 'lab',
      title: 'Complete Blood Count (CBC)',
      date: 'Nov 8, 2024',
      doctor: 'Dr. Michael Chen',
      department: 'Laboratory',
      status: 'completed',
      attachments: 1
    },
    {
      id: 3,
      type: 'imaging',
      title: 'Chest X-Ray',
      date: 'Sep 15, 2024',
      doctor: 'Dr. Emily Wang',
      department: 'Radiology',
      status: 'completed',
      summary: 'Clear lung fields, no abnormalities detected.',
      attachments: 2
    },
    {
      id: 4,
      type: 'prescription',
      title: 'Medication Prescription',
      date: 'Nov 5, 2024',
      doctor: 'Dr. Sarah Johnson',
      department: 'General Practice',
      status: 'completed',
      summary: 'Prescribed Metformin 500mg, twice daily'
    },
    {
      id: 5,
      type: 'procedure',
      title: 'ECG Test',
      date: 'Aug 20, 2024',
      doctor: 'Dr. Robert Smith',
      department: 'Cardiology',
      status: 'completed',
      summary: 'Normal sinus rhythm, no irregularities.',
      attachments: 1
    }
  ];

  const recentLabResults: LabResult[] = [
    { id: 1, testName: 'Glucose', value: '95 mg/dL', normalRange: '70-100 mg/dL', status: 'normal', date: 'Nov 8, 2024' },
    { id: 2, testName: 'Cholesterol', value: '210 mg/dL', normalRange: '<200 mg/dL', status: 'high', date: 'Nov 8, 2024' },
    { id: 3, testName: 'Hemoglobin', value: '14.5 g/dL', normalRange: '13.5-17.5 g/dL', status: 'normal', date: 'Nov 8, 2024' },
    { id: 4, testName: 'Blood Pressure', value: '120/80 mmHg', normalRange: '<120/80 mmHg', status: 'normal', date: 'Nov 8, 2024' },
    { id: 5, testName: 'TSH', value: '2.5 mIU/L', normalRange: '0.4-4.0 mIU/L', status: 'normal', date: 'Nov 8, 2024' },
    { id: 6, testName: 'Vitamin D', value: '18 ng/mL', normalRange: '20-50 ng/mL', status: 'low', date: 'Nov 8, 2024' }
  ];

  const documents: Document[] = [
    { id: 1, name: 'Annual_Physical_Report_2024.pdf', type: 'PDF', size: '2.4 MB', uploadedDate: 'Oct 28, 2024', category: 'Medical Reports' },
    { id: 2, name: 'Blood_Test_Results_Nov.pdf', type: 'PDF', size: '1.1 MB', uploadedDate: 'Nov 8, 2024', category: 'Lab Results' },
    { id: 3, name: 'Chest_XRay_Sept2024.jpg', type: 'Image', size: '3.5 MB', uploadedDate: 'Sep 15, 2024', category: 'Imaging' },
    { id: 4, name: 'Prescription_Nov2024.pdf', type: 'PDF', size: '245 KB', uploadedDate: 'Nov 5, 2024', category: 'Prescriptions' },
    { id: 5, name: 'Insurance_Card.pdf', type: 'PDF', size: '500 KB', uploadedDate: 'Jan 15, 2024', category: 'Insurance' },
    { id: 6, name: 'Vaccination_Record.pdf', type: 'PDF', size: '1.8 MB', uploadedDate: 'Jun 20, 2024', category: 'Immunization' }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'visit': return <Stethoscope className="w-4 h-4" />;
      case 'lab': return <TestTube className="w-4 h-4" />;
      case 'imaging': return <Brain className="w-4 h-4" />;
      case 'prescription': return <Pill className="w-4 h-4" />;
      case 'procedure': return <Heart className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'in-review': return 'outline';
      case 'normal': return 'default';
      case 'high': return 'destructive';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'normal': return '✓ Normal';
      case 'high': return '↑ High';
      case 'low': return '↓ Low';
      default: return status;
    }
  };

  return (
    <DashboardLayout userType="patient" userName="John Doe">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Health Records</h1>
          <p className="text-muted-foreground mt-2">Access your complete medical history and documents</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{medicalHistory.length}</p>
                  <p className="text-xs text-muted-foreground">Total Records</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                  <TestTube className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{recentLabResults.length}</p>
                  <p className="text-xs text-muted-foreground">Lab Results</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{documents.length}</p>
                  <p className="text-xs text-muted-foreground">Documents</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-bold">Last Visit</p>
                  <p className="text-xs text-muted-foreground">Oct 28, 2024</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search records, tests, or doctors..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="history">Medical History</TabsTrigger>
            <TabsTrigger value="labs">Lab Results</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Medical History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Medical History</CardTitle>
                <CardDescription>Your complete medical visit history and procedures</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {medicalHistory.map((record) => (
                  <div key={record.id} className="border rounded-lg p-4 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                            {getTypeIcon(record.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold">{record.title}</h4>
                              <Badge variant={getStatusVariant(record.status)} className="text-xs">
                                {record.status}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center">
                                <User className="w-3 h-3 mr-1" />
                                {record.doctor}
                              </span>
                              <span>{record.department}</span>
                              <span className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {record.date}
                              </span>
                            </div>
                          </div>
                        </div>
                        {record.summary && (
                          <p className="text-sm text-muted-foreground pl-13">{record.summary}</p>
                        )}
                        {record.attachments && (
                          <div className="pl-13">
                            <Badge variant="secondary" className="text-xs">
                              <File className="w-3 h-3 mr-1" />
                              {record.attachments} attachment{record.attachments > 1 ? 's' : ''}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lab Results Tab */}
          <TabsContent value="labs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Laboratory Results</CardTitle>
                <CardDescription>Recent test results and health metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your latest lab results from Nov 8, 2024. Discuss any concerns with your healthcare provider.
                  </AlertDescription>
                </Alert>
                <div className="space-y-3">
                  {recentLabResults.map((result) => (
                    <div key={result.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{result.testName}</h4>
                            <Badge variant={getStatusVariant(result.status)}>
                              {getStatusLabel(result.status)}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 mt-2 text-sm">
                            <span className="font-semibold">{result.value}</span>
                            <span className="text-muted-foreground">Normal range: {result.normalRange}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{result.date}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-4">
                  <Button variant="outline">
                    <Printer className="w-4 h-4 mr-2" />
                    Print Results
                  </Button>
                  <Button>
                    View Full Report
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Medical Documents</CardTitle>
                    <CardDescription>Upload and manage your medical documents</CardDescription>
                  </div>
                  <Button>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="border rounded-lg p-4 hover:bg-secondary/50 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{doc.name}</p>
                          <div className="flex items-center space-x-3 mt-1 text-xs text-muted-foreground">
                            <span>{doc.type}</span>
                            <span>{doc.size}</span>
                            <span>{doc.uploadedDate}</span>
                          </div>
                          <Badge variant="secondary" className="mt-2 text-xs">
                            {doc.category}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}