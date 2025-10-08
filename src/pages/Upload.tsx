import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload as UploadIcon, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Upload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = () => {
    if (!selectedFile) return;
    
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      toast({
        title: 'Analysis Complete',
        description: 'Helmet detected in the image with 94.5% confidence',
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Image Upload</h1>
          <p className="text-muted-foreground">
            Upload an image to detect helmets using our AI model
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
                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="w-full"
                    >
                      {isAnalyzing ? 'Analyzing...' : 'Analyze Image'}
                    </Button>
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
              {preview ? (
                <div className="space-y-4">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full rounded-lg border"
                  />
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
                  <div className="text-center">
                    <ImageIcon className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No image selected</p>
                  </div>
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
