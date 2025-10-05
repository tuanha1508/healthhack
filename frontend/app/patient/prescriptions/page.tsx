"use client";

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/Card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Pill,
  Calendar,
  User,
  CheckCircle,
  AlertCircle,
  Clock,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Prescription {
  id: string;
  patient_name: string;
  doctor_name: string;
  medications: string[];
  created_at: string;
  status: string;
  read: boolean;
  read_at?: string;
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/prescription/list');
      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data.prescriptions);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (prescriptionId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/prescription/${prescriptionId}/read`, {
        method: 'PUT'
      });
      if (response.ok) {
        // Update local state
        setPrescriptions(prescriptions.map(p =>
          p.id === prescriptionId ? { ...p, read: true, read_at: new Date().toISOString() } : p
        ));
      }
    } catch (error) {
      console.error('Error marking prescription as read:', error);
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadPrescription = (prescription: Prescription) => {
    // Create text content
    const content = `
PRESCRIPTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Patient: ${prescription.patient_name}
Doctor: ${prescription.doctor_name}
Date: ${formatDate(prescription.created_at)}
Status: ${prescription.status.toUpperCase()}

PRESCRIBED MEDICATIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${prescription.medications.map((med, idx) => `${idx + 1}. ${med}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT:
Please follow your doctor's instructions carefully.
If you have any questions or concerns about these
medications, contact your healthcare provider.

Prescription ID: ${prescription.id}
Generated: ${new Date().toLocaleString()}
    `.trim();

    // Create blob and download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Prescription_${prescription.patient_name}_${new Date(prescription.created_at).toLocaleDateString().replace(/\//g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const downloadAllPrescriptions = () => {
    // Create JSON backup of all prescriptions
    const content = JSON.stringify(prescriptions, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `All_Prescriptions_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout userType="patient" userName="Patient">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Prescriptions</h1>
            <p className="text-muted-foreground mt-2">
              View medications prescribed by your doctor
            </p>
          </div>
          {prescriptions.length > 0 && (
            <Button
              onClick={downloadAllPrescriptions}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download All (Backup)
            </Button>
          )}
        </div>

        {/* Prescriptions List */}
        {isLoading ? (
          <Card>
            <div className="p-8 text-center text-muted-foreground">
              Loading prescriptions...
            </div>
          </Card>
        ) : prescriptions.length === 0 ? (
          <Card>
            <div className="p-8 text-center">
              <Pill className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">No Prescriptions Yet</h3>
              <p className="text-sm text-muted-foreground">
                Your doctor hasn't sent any prescriptions yet.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((prescription) => (
              <Card
                key={prescription.id}
                className={`${!prescription.read ? 'border-blue-500 border-2' : ''}`}
              >
                <div className="p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Pill className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">New Prescription</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {prescription.doctor_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(prescription.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!prescription.read ? (
                        <Badge variant="default" className="bg-blue-600">
                          New
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Read
                        </Badge>
                      )}
                      <Badge
                        variant={prescription.status === 'active' ? 'default' : 'secondary'}
                        className={prescription.status === 'active' ? 'bg-green-600' : ''}
                      >
                        {prescription.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Medications List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Prescribed Medications:</h4>
                      <span className="text-xs text-muted-foreground">
                        {prescription.medications.length} medication(s)
                      </span>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <ul className="space-y-2">
                        {prescription.medications.map((medication, index) => (
                          <li
                            key={index}
                            className="flex items-center gap-2 text-sm font-medium"
                          >
                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span>{medication}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Important Notice */}
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Please follow your doctor's instructions. If you have any questions or concerns about these medications, contact your healthcare provider.
                    </AlertDescription>
                  </Alert>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      {!prescription.read && (
                        <button
                          onClick={() => markAsRead(prescription.id)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Mark as read
                        </button>
                      )}

                      {prescription.read && prescription.read_at && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Read on {formatDate(prescription.read_at)}
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => downloadPrescription(prescription)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
