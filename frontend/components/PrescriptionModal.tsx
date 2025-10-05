"use client";

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  Upload,
  X,
  Loader2,
  CheckCircle,
  Pill,
  FileText,
  Plus,
  Trash2
} from 'lucide-react';

interface GeneticVariant {
  rsid?: string;
  genotype?: string;
  gene?: string;
  star?: string;
}

interface PatientContext {
  age?: number;
  sex?: string;
  ancestry?: string;
  comorbidities?: string[];
  current_medications?: string[];
  allergies?: string[];
}

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientId?: number;
}

interface AlternativeMedication {
  name: string;
  description: string;
  benefits: string[];
  considerations: string[];
}

interface MedicationResult {
  medication: string;
  risk_level?: string;
  recommendation?: string;
  can_prescribe?: boolean;
  evidence?: string;
  alternatives?: AlternativeMedication[];
  raw_data?: any; // Store original API response
  error?: string;
  selected_alternative?: string; // Track which medication is selected
}

export default function PrescriptionModal({
  isOpen,
  onClose,
  patientName,
  patientId
}: PrescriptionModalProps) {
  const [medications, setMedications] = useState<string[]>(['']);
  const [rsidVariants, setRsidVariants] = useState<Array<{rsid: string, genotype: string}>>([{ rsid: '', genotype: '' }]);
  const [geneVariants, setGeneVariants] = useState<Array<{gene: string, star: string}>>([{ gene: '', star: '' }]);
  const [context, setContext] = useState<PatientContext>({
    age: undefined,
    sex: '',
    ancestry: '',
    comorbidities: [],
    current_medications: [],
    allergies: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<MedicationResult[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [inputMethod, setInputMethod] = useState<'manual' | 'file'>('manual');
  const [prescriptions, setPrescriptions] = useState<string[]>([]); // Track added prescriptions
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddMedication = () => {
    setMedications([...medications, '']);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleMedicationChange = (index: number, value: string) => {
    const updatedMedications = [...medications];
    updatedMedications[index] = value;
    setMedications(updatedMedications);
  };

  const handleAddRsidVariant = () => {
    setRsidVariants([...rsidVariants, { rsid: '', genotype: '' }]);
  };

  const handleRemoveRsidVariant = (index: number) => {
    setRsidVariants(rsidVariants.filter((_, i) => i !== index));
  };

  const handleRsidVariantChange = (index: number, field: 'rsid' | 'genotype', value: string) => {
    const updatedVariants = [...rsidVariants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    setRsidVariants(updatedVariants);
  };

  const handleAddGeneVariant = () => {
    setGeneVariants([...geneVariants, { gene: '', star: '' }]);
  };

  const handleRemoveGeneVariant = (index: number) => {
    setGeneVariants(geneVariants.filter((_, i) => i !== index));
  };

  const handleGeneVariantChange = (index: number, field: 'gene' | 'star', value: string) => {
    const updatedVariants = [...geneVariants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    setGeneVariants(updatedVariants);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.type === 'application/pdf' || file.name.endsWith('.csv') || file.name.endsWith('.pdf')) {
        setUploadedFile(file);
      } else {
        alert('Please upload a CSV or PDF file');
      }
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzeWithAI = async (medication: string, apiResponse: any): Promise<MedicationResult> => {
    try {
      const response = await fetch('http://localhost:8000/api/prescription/analyze-prescription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medication,
          api_response: apiResponse
        })
      });

      if (response.ok) {
        const aiResult = await response.json();
        console.log('AI Analysis Result:', aiResult);
        return {
          ...aiResult,
          raw_data: apiResponse
        };
      } else {
        console.error('AI analysis failed, returning raw data');
        return {
          medication,
          raw_data: apiResponse,
          error: 'AI analysis unavailable'
        };
      }
    } catch (error) {
      console.error('Error calling AI analysis:', error);
      return {
        medication,
        raw_data: apiResponse,
        error: 'AI analysis failed'
      };
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setResults([]);

    try {
      const validMedications = medications.filter(med => med.trim() !== '');

      if (validMedications.length === 0) {
        alert('Please enter at least one medication');
        setIsLoading(false);
        return;
      }

      const allResults: MedicationResult[] = [];

      if (inputMethod === 'file' && uploadedFile) {
        // Use file upload endpoint
        for (const medication of validMedications) {
          const formData = new FormData();
          formData.append('file', uploadedFile);
          formData.append('medication_name', medication);

          // Add context as JSON string
          const contextStr = JSON.stringify({
            ...context,
            comorbidities: context.comorbidities?.filter(c => c.trim() !== ''),
            current_medications: context.current_medications?.filter(m => m.trim() !== ''),
            allergies: context.allergies?.filter(a => a.trim() !== '')
          });
          formData.append('context', contextStr);

          try {
            const response = await fetch('https://healthhack-mscs-epirisk.onrender.com/v1/score-file', {
              method: 'POST',
              body: formData
            });

            if (response.ok) {
              const data = await response.json();
              console.log('═══════════════════════════════════════════════════');
              console.log(`API Response for "${medication}" (file upload):`, data);
              console.log('Full API Response Object:', JSON.stringify(data, null, 2));
              console.log('═══════════════════════════════════════════════════');

              // Send to AI for analysis
              const aiAnalysis = await analyzeWithAI(medication, data);
              allResults.push(aiAnalysis);
            } else {
              const errorData = await response.json().catch(() => null);
              console.error(`API Error for "${medication}" (file upload):`, errorData);
              allResults.push({
                medication,
                error: errorData?.detail || `Failed to analyze ${medication}`
              });
            }
          } catch (error) {
            console.error(`Error analyzing ${medication}:`, error);
            allResults.push({
              medication,
              error: `Network error for ${medication}`
            });
          }
        }
      } else {
        // Use manual input endpoint
        // Combine rsid and gene variants
        const validRsidVariants = rsidVariants.filter(v => v.rsid && v.genotype);
        const validGeneVariants = geneVariants.filter(v => v.gene && v.star);

        const allVariants: GeneticVariant[] = [
          ...validRsidVariants.map(v => ({ rsid: v.rsid, genotype: v.genotype })),
          ...validGeneVariants.map(v => ({ gene: v.gene, star: v.star }))
        ];

        if (allVariants.length === 0) {
          alert('Please enter at least one genetic variant');
          setIsLoading(false);
          return;
        }

        for (const medication of validMedications) {
          const requestData = {
            variants: allVariants,
            medication_name: medication,
            context: {
              ...context,
              comorbidities: context.comorbidities?.filter(c => c.trim() !== ''),
              current_medications: context.current_medications?.filter(m => m.trim() !== ''),
              allergies: context.allergies?.filter(a => a.trim() !== '')
            }
          };

          try {
            console.log('═══════════════════════════════════════════════════');
            console.log(`Sending Request for "${medication}" (manual input):`, requestData);
            console.log('═══════════════════════════════════════════════════');

            const response = await fetch('https://healthhack-mscs-epirisk.onrender.com/v1/score', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestData)
            });

            if (response.ok) {
              const data = await response.json();
              console.log('═══════════════════════════════════════════════════');
              console.log(`API Response for "${medication}" (manual input):`, data);
              console.log('Full API Response Object:', JSON.stringify(data, null, 2));
              console.log('═══════════════════════════════════════════════════');

              // Send to AI for analysis
              const aiAnalysis = await analyzeWithAI(medication, data);
              allResults.push(aiAnalysis);
            } else {
              const errorData = await response.json().catch(() => null);
              console.error('═══════════════════════════════════════════════════');
              console.error(`API Error for "${medication}" (manual input):`, errorData);
              console.error('Full Error Response:', JSON.stringify(errorData, null, 2));
              console.error('═══════════════════════════════════════════════════');
              allResults.push({
                medication,
                error: errorData?.detail || `Failed to analyze ${medication}`
              });
            }
          } catch (error) {
            console.error('═══════════════════════════════════════════════════');
            console.error(`Network Error for "${medication}":`, error);
            console.error('═══════════════════════════════════════════════════');
            allResults.push({
              medication,
              error: `Network error for ${medication}`
            });
          }
        }
      }

      setResults(allResults);
    } catch (error) {
      console.error('Error submitting prescription:', error);
      alert('An error occurred while processing the prescription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleArrayInput = (field: keyof PatientContext, value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item !== '');
    setContext({ ...context, [field]: items });
  };

  const handleAddToScribe = (medicationName: string) => {
    // Case-insensitive duplicate check
    const isDuplicate = prescriptions.some(
      med => med.toLowerCase() === medicationName.toLowerCase()
    );

    if (!isDuplicate) {
      setPrescriptions([...prescriptions, medicationName]);
    }
  };

  const handleSelectAlternative = (resultIndex: number, alternativeName: string) => {
    const updatedResults = [...results];
    updatedResults[resultIndex].selected_alternative = alternativeName;
    setResults(updatedResults);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Prescribe Medication with Genetic Scoring
          </DialogTitle>
          <DialogDescription>
            Prescribe medication for {patientName} with personalized genetic risk assessment
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
          <div className="space-y-6">
            {/* Medications Section */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Medications</Label>
              <div className="space-y-2">
                {medications.map((medication, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Enter medication name (e.g., codeine, warfarin)"
                      value={medication}
                      onChange={(e) => handleMedicationChange(index, e.target.value)}
                    />
                    {medications.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveMedication(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddMedication}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Medication
                </Button>
              </div>
            </div>

            {/* Genetic Data Input */}
            <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as 'manual' | 'file')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Manual Input</TabsTrigger>
                <TabsTrigger value="file">Upload File</TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="space-y-4">
                <div className="space-y-6">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Enter genetic variants using either rsID + Genotype format OR Gene + Star Allele format
                    </AlertDescription>
                  </Alert>

                  {/* rsID + Genotype Section */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">rsID + Genotype Format</Label>
                    <div className="space-y-2">
                      {rsidVariants.map((variant, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder="rsID (e.g., rs3892097)"
                            value={variant.rsid}
                            onChange={(e) => handleRsidVariantChange(index, 'rsid', e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            placeholder="Genotype (e.g., AA)"
                            value={variant.genotype}
                            onChange={(e) => handleRsidVariantChange(index, 'genotype', e.target.value)}
                            className="flex-1"
                          />
                          {rsidVariants.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handleRemoveRsidVariant(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddRsidVariant}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another rsID + Genotype
                      </Button>
                    </div>
                  </div>

                  {/* Gene + Star Allele Section */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Gene + Star Allele Format</Label>
                    <div className="space-y-2">
                      {geneVariants.map((variant, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder="Gene (e.g., CYP2D6)"
                            value={variant.gene}
                            onChange={(e) => handleGeneVariantChange(index, 'gene', e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            placeholder="Star Allele (e.g., *4/*4)"
                            value={variant.star}
                            onChange={(e) => handleGeneVariantChange(index, 'star', e.target.value)}
                            className="flex-1"
                          />
                          {geneVariants.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handleRemoveGeneVariant(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddGeneVariant}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another Gene + Star Allele
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="file" className="space-y-4">
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Upload Genetic Data</Label>
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      Upload a CSV or PDF file containing genetic variants (rsID + Genotype or Gene + Star Allele)
                    </AlertDescription>
                  </Alert>

                  {!uploadedFile ? (
                    <div
                      className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm font-medium mb-1">Click to upload file</p>
                      <p className="text-xs text-muted-foreground">CSV or PDF files only</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{uploadedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(uploadedFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleRemoveFile}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Patient Context */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Patient Context (Optional)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input
                    type="number"
                    placeholder="Enter age"
                    value={context.age || ''}
                    onChange={(e) => setContext({ ...context, age: parseInt(e.target.value) || undefined })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sex</Label>
                  <Input
                    placeholder="Male/Female"
                    value={context.sex || ''}
                    onChange={(e) => setContext({ ...context, sex: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ancestry</Label>
                  <Input
                    placeholder="e.g., European, Asian"
                    value={context.ancestry || ''}
                    onChange={(e) => setContext({ ...context, ancestry: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Comorbidities</Label>
                  <Input
                    placeholder="Comma-separated (e.g., diabetes, hypertension)"
                    onChange={(e) => handleArrayInput('comorbidities', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current Medications</Label>
                  <Input
                    placeholder="Comma-separated"
                    onChange={(e) => handleArrayInput('current_medications', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Allergies</Label>
                  <Input
                    placeholder="Comma-separated"
                    onChange={(e) => handleArrayInput('allergies', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Prescription List (Scribe) */}
            {prescriptions.length > 0 && (
              <div className="space-y-3 bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold text-green-800">
                    Prescription List ({prescriptions.length})
                  </Label>
                  <Badge variant="default" className="bg-green-600">
                    Ready to Prescribe
                  </Badge>
                </div>
                <div className="space-y-2">
                  {prescriptions.map((med, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3 border border-green-200">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{med}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPrescriptions(prescriptions.filter((_, i) => i !== idx));
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results Section */}
            {results.length > 0 && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">Prescription Recommendations</Label>
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div key={index} className="border rounded-lg p-5 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-lg">{result.medication}</h4>
                          {result.risk_level && (
                            <Badge
                              variant={
                                result.risk_level === 'low' ? 'default' :
                                result.risk_level === 'moderate' ? 'secondary' :
                                'destructive'
                              }
                              className="mt-1"
                            >
                              {result.risk_level.toUpperCase()} RISK
                            </Badge>
                          )}
                        </div>
                        {prescriptions.includes(result.medication) && (
                          <Badge variant="outline" className="bg-green-50">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Added to Scribe
                          </Badge>
                        )}
                      </div>

                      {result.error ? (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{result.error}</AlertDescription>
                        </Alert>
                      ) : (
                        <>
                          {/* Recommendation */}
                          {result.recommendation && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="text-sm font-medium text-blue-900">
                                {result.recommendation}
                              </p>
                            </div>
                          )}

                          {/* Evidence (for moderate/high risk) */}
                          {result.evidence && (
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold">Evidence & Reasoning:</Label>
                              <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-sm">
                                  {result.evidence}
                                </AlertDescription>
                              </Alert>
                            </div>
                          )}

                          {/* Action Buttons */}
                          {result.can_prescribe ? (
                            <Button
                              onClick={() => handleAddToScribe(result.medication)}
                              disabled={prescriptions.includes(result.medication)}
                              className="w-full"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {prescriptions.includes(result.medication) ? 'Added to Scribe' : 'Add to Scribe'}
                            </Button>
                          ) : (
                            result.alternatives && result.alternatives.length > 0 && (
                              <div className="space-y-3">
                                <Label className="text-sm font-semibold">Alternative Medications:</Label>
                                <div className="space-y-3">
                                  {result.alternatives.map((alt, altIndex) => (
                                    <div
                                      key={altIndex}
                                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                        result.selected_alternative === alt.name
                                          ? 'border-blue-500 bg-blue-50'
                                          : 'hover:border-gray-400'
                                      }`}
                                      onClick={() => handleSelectAlternative(index, alt.name)}
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <h5 className="font-medium">{alt.name}</h5>
                                        {result.selected_alternative === alt.name && (
                                          <Badge variant="default">Selected</Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-muted-foreground mb-3">
                                        {alt.description}
                                      </p>

                                      <div className="space-y-2">
                                        <div>
                                          <Label className="text-xs font-semibold text-green-700">Benefits:</Label>
                                          <ul className="list-disc list-inside text-xs text-green-600 space-y-1 mt-1">
                                            {alt.benefits.map((benefit, i) => (
                                              <li key={i}>{benefit}</li>
                                            ))}
                                          </ul>
                                        </div>

                                        <div>
                                          <Label className="text-xs font-semibold text-orange-700">Considerations:</Label>
                                          <ul className="list-disc list-inside text-xs text-orange-600 space-y-1 mt-1">
                                            {alt.considerations.map((consideration, i) => (
                                              <li key={i}>{consideration}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>

                                      {result.selected_alternative === alt.name && (
                                        <Button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddToScribe(alt.name);
                                          }}
                                          disabled={prescriptions.includes(alt.name)}
                                          className="w-full mt-3"
                                          size="sm"
                                        >
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          {prescriptions.includes(alt.name) ? 'Added to Scribe' : 'Add to Scribe'}
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {prescriptions.length > 0 && (
              <Button
                variant="default"
                onClick={async () => {
                  try {
                    const response = await fetch('http://localhost:8000/api/prescription/finalize', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        patient_id: patientId,
                        patient_name: patientName,
                        medications: prescriptions,
                        doctor_name: "Dr. Smith"
                      })
                    });

                    if (response.ok) {
                      const data = await response.json();
                      onClose();
                      // Reset state
                      setPrescriptions([]);
                      setResults([]);
                      setMedications(['']);
                    }
                  } catch (error) {
                    console.error('Error finalizing prescription:', error);
                  }
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Finalize & Send to Patient ({prescriptions.length})
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={isLoading || medications.filter(m => m.trim()).length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Analyze & Prescribe
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}