import { useState, useRef, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Circle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const API_URL = 'https://hopeful-transformation-production-8990.up.railway.app';


const Live = () => {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    framesProcessed: 0,
    helmetsDetected: 0,
    fps: 0,
    confidence: 0,
  });
  const [detectionLog, setDetectionLog] = useState<Array<{time: string; label: string; confidence: number}>>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>();
  const lastProcessedTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const lastFpsUpdate = useRef<number>(0);
  const { toast } = useToast();

  // Initialize webcam
  useEffect(() => {
    if (!isActive) return;

    const initWebcam = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'environment' },
          audio: false,
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          await videoRef.current.play();
          processVideo();
        }
      } catch (err) {
        console.error('Error accessing webcam:', err);
        setError('Could not access webcam. Please check permissions.');
        setIsActive(false);
      } finally {
        setIsLoading(false);
      }
    };

    initWebcam();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive]);

  // Process video frames
  const processVideo = async () => {
    if (!videoRef.current || !canvasRef.current || !isActive) return;

    const now = performance.now();
    const delta = now - lastProcessedTime.current;
    
    // Process at ~10fps to reduce load
    if (delta > 190) {
      lastProcessedTime.current = now - (delta % 190);
      
      // Capture frame
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      try {
        // Convert canvas to blob and send to API
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.2);
        });
        
        if (blob) {
          const formData = new FormData();
          formData.append('file', blob, 'frame.jpg');
          
          const response = await axios.post(`${API_URL}/predict-webcam`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          
          if (response.data.success) {
            // Update stats
            frameCount.current++;
            const helmetCount = response.data.detections.filter((d: any) => 
              d.label.toLowerCase().includes('helmet')
            ).length;
            
            // Update FPS counter every second
            if (now - lastFpsUpdate.current > 1000) {
              setStats(prev => ({
                framesProcessed: frameCount.current,
                helmetsDetected: prev.helmetsDetected + helmetCount,
                fps: Math.round((frameCount.current * 1000) / (now - lastFpsUpdate.current) * 10) / 10,
                confidence: response.data.detections[0]?.confidence * 100 || 0,
              }));
              lastFpsUpdate.current = now;
              frameCount.current = 0;
            }
            
            // Display the annotated image from the backend
            const img = new Image();
            img.onload = () => {
              const canvas = canvasRef.current;
              if (!canvas) return;
              
              const ctx = canvas.getContext('2d');
              if (!ctx) return;
              
              // Clear previous frame
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              
              // Draw the annotated image from the backend
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = `data:image/png;base64,${response.data.image}`;
            
            // Update detection log (max 5 items)
            if (response.data.detections.length > 0) {
              const newLog = response.data.detections.map((det: any) => ({
                time: new Date().toLocaleTimeString(),
                label: det.label,
                confidence: det.confidence * 100,
              }));
              
              setDetectionLog(prev => [...newLog, ...prev].slice(0, 5));
            }
          }
        }
      } catch (err) {
        console.error('Error processing frame:', err);
      }
    }
    
    // Continue processing
    animationFrameRef.current = requestAnimationFrame(processVideo);
  };

  const toggleWebcam = () => {
    if (isActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
    setIsActive(!isActive);
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Live Detection</h1>
          <p className="text-muted-foreground">
            Real-time helmet and seatbelt detection using your camera
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Camera Feed</CardTitle>
              <CardDescription>Live video stream with detection overlay</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-secondary/50">
                {isActive ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 h-full w-full object-cover"
                      style={{ display: 'none' }}
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute bottom-4 left-4 flex items-center">
                      <div className="mr-2 h-3 w-3 rounded-full bg-red-500"></div>
                      <span className="text-sm font-medium text-white">
                        {isLoading ? 'Initializing...' : 'Live'}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center">
                    <VideoOff className="mb-3 h-16 w-16 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {error ? error : 'Camera is inactive'}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex gap-3">
                <Button
                  onClick={toggleWebcam}
                  className="flex-1"
                  variant={isActive ? 'destructive' : 'default'}
                  disabled={isLoading}
                >
                  {isActive ? (
                    <>
                      <VideoOff className="mr-2 h-4 w-4" />
                      Stop Detection
                    </>
                  ) : (
                    <>
                      <Video className="mr-2 h-4 w-4" />
                      Start Detection
                    </>
                  )}
                </Button>
              </div>
              
              {error && (
                <div className="mt-4 flex items-center rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detection Stats</CardTitle>
                <CardDescription>Current session metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Status', value: isActive ? 'Active' : 'Inactive', icon: (
                    <div className={`h-3 w-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                  )},
                  { label: 'Frames Processed', value: stats.framesProcessed },
                  { label: 'Helmets Detected', value: stats.helmetsDetected },
                  { label: 'FPS', value: stats.fps.toFixed(1) },
                  { label: 'Confidence', value: stats.confidence > 0 ? `${stats.confidence.toFixed(1)}%` : 'N/A' },
                ].map((stat, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {'icon' in stat && <span className="mr-2">{stat.icon}</span>}
                        <span className="text-sm font-medium">{stat.label}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {stat.value}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detection Log</CardTitle>
                <CardDescription>Recent detections</CardDescription>
              </CardHeader>
              <CardContent>
                {detectionLog.length > 0 ? (
                  <div className="space-y-2">
                    {detectionLog.map((log, index) => (
                      <div key={index} className="flex items-start justify-between border-b pb-2 last:border-0 last:pb-0">
                        <div className="flex items-center">
                          <Circle className="mr-2 h-2 w-2 text-green-500 fill-current" />
                          <div>
                            <p className="text-sm font-medium">{log.label}</p>
                            <p className="text-xs text-muted-foreground">{log.time}</p>
                          </div>
                        </div>
                        <span className="text-sm font-medium">
                          {log.confidence.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-32 items-center justify-center text-center text-muted-foreground">
                    <p>No detections yet. Start the camera to begin.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Live;