import { useState, useRef } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload as UploadIcon, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8080';

const Upload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectionResult, setDetectionResult] = useState<{
    image: string;
    detections: Array<{
      label: string;
      confidence: number;
      x: number;
      y: number;
      width: number;
      height: number;
    }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setDetectionResult(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    
    setIsAnalyzing(true);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await axios.post(`${API_URL}/predict`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        const imageData = `data:image/png;base64,${response.data.image}`;
        const detections = response.data.detections;
        
        setDetectionResult({
          image: imageData,
          detections: detections
        });
        
        // Save detection to database
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          await supabase.from('detections').insert({
            user_id: user.id,
            source: 'upload',
            image_data: imageData,
            detected_objects: detections,
            confidence: detections.length > 0 
              ? detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length 
              : null
          });
        }
        
        toast({
          title: 'Analysis Complete',
          description: `Detected ${response.data.detections.length} objects`,
        });
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setDetectionResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Image Upload</h1>
          <p className="text-muted-foreground">
            Upload an image to detect helmets and seatbelts using our AI model
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Upload Image</CardTitle>
              <CardDescription>Select an image file to analyze</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <label
                  htmlFor="file-upload"
                  className="flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/50 transition-colors hover:bg-secondary"
                >
                  <UploadIcon className="mb-3 h-12 w-12 text-muted-foreground" />
                  <p className="mb-2 text-sm font-medium text-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG or JPEG (MAX. 10MB)</p>
                  <input
                    id="file-upload"
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>

                {selectedFile && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      Selected: {selectedFile.name}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="flex-1"
                      >
                        {isAnalyzing ? 'Analyzing...' : 'Analyze Image'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleReset}
                        disabled={isAnalyzing}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Image preview and detection results</CardDescription>
            </CardHeader>
            <CardContent>
              {detectionResult ? (
                <div className="space-y-4">
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-secondary/50">
                    <img
                      src={detectionResult.image}
                      alt="Detection result"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  {detectionResult.detections.length > 0 ? (
                    <div className="space-y-2">
                      <h3 className="font-medium">Detected Objects:</h3>
                      <ul className="space-y-1">
                        {detectionResult.detections.map((det, index) => (
                          <li key={index} className="text-sm">
                            {det.label} ({Math.round(det.confidence * 100)}%)
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No objects detected</p>
                  )}
                </div>
              ) : preview ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-secondary/50">
                  <img
                    src={preview}
                    alt="Preview"
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-64 w-full flex-col items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground">
                  <ImageIcon className="mb-3 h-12 w-12" />
                  <p>Preview will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Upload;
