import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, VideoOff } from 'lucide-react';

const Live = () => {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className="min-h-screen bg-secondary/30">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Live Detection</h1>
          <p className="text-muted-foreground">
            Real-time helmet detection using your camera
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Camera Feed</CardTitle>
              <CardDescription>Live video stream with detection overlay</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video w-full rounded-lg bg-secondary/50 flex items-center justify-center">
                {isActive ? (
                  <div className="text-center">
                    <Video className="mx-auto mb-2 h-16 w-16 text-primary animate-pulse" />
                    <p className="text-sm text-muted-foreground">Camera active - Detection running</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <VideoOff className="mx-auto mb-2 h-16 w-16 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Camera inactive</p>
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-3">
                <Button
                  onClick={() => setIsActive(!isActive)}
                  className="flex-1"
                  variant={isActive ? 'destructive' : 'default'}
                >
                  {isActive ? 'Stop Detection' : 'Start Detection'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detection Stats</CardTitle>
                <CardDescription>Current session metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Frames Processed</span>
                    <span className="text-sm text-muted-foreground">
                      {isActive ? '1,247' : '0'}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Helmets Detected</span>
                    <span className="text-sm text-muted-foreground">
                      {isActive ? '847' : '0'}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">FPS</span>
                    <span className="text-sm text-muted-foreground">
                      {isActive ? '30' : '0'}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Confidence</span>
                    <span className="text-sm text-muted-foreground">
                      {isActive ? '94.2%' : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detection Log</CardTitle>
                <CardDescription>Recent detections</CardDescription>
              </CardHeader>
              <CardContent>
                {isActive ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">00:23</span>
                      <span className="font-medium text-primary">Helmet Detected</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">00:18</span>
                      <span className="font-medium text-primary">Helmet Detected</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">00:12</span>
                      <span className="font-medium text-primary">Helmet Detected</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No active detections</p>
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
