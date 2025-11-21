import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Upload, Video, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';
import { ChatBot } from '@/components/ChatBot';

interface Detection {
  id: string;
  source: string;
  created_at: string;
  detected_objects: Json;
}

interface SystemHealth {
  metric_name: string;
  metric_value: string;
  status: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalDetections: 0,
    imagesAnalyzed: 0,
    liveSessions: 0,
    accuracyRate: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Detection[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch total detections
      const { count: totalDetections } = await supabase
        .from('detections')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Fetch image uploads count
      const { count: imagesAnalyzed } = await supabase
        .from('detections')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('source', 'upload');

      // Fetch live sessions count
      const { count: liveSessions } = await supabase
        .from('live_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Calculate accuracy rate from detections
      const { data: detectionData } = await supabase
        .from('detections')
        .select('confidence')
        .eq('user_id', user?.id)
        .not('confidence', 'is', null);

      const avgConfidence = detectionData && detectionData.length > 0
        ? detectionData.reduce((sum, d) => sum + (Number(d.confidence) || 0), 0) / detectionData.length
        : 0;

      setStats({
        totalDetections: totalDetections || 0,
        imagesAnalyzed: imagesAnalyzed || 0,
        liveSessions: liveSessions || 0,
        accuracyRate: avgConfidence,
      });

      // Fetch recent activity
      const { data: recentData, error: recentError } = await supabase
        .from('detections')
        .select('id, source, created_at, detected_objects')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(4);

      if (recentError) throw recentError;
      setRecentActivity(recentData || []);

      // Fetch system health
      const { data: healthData, error: healthError } = await supabase
        .from('system_health')
        .select('metric_name, metric_value, status')
        .order('metric_name');

      if (healthError) throw healthError;
      setSystemHealth(healthData || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Total Detections',
      value: stats.totalDetections.toString(),
      icon: Shield,
      description: 'Helmet detections processed',
    },
    {
      title: 'Images Analyzed',
      value: stats.imagesAnalyzed.toString(),
      icon: Upload,
      description: 'Static images uploaded',
    },
    {
      title: 'Live Sessions',
      value: stats.liveSessions.toString(),
      icon: Video,
      description: 'Real-time detection sessions',
    },
    {
      title: 'Accuracy Rate',
      value: `${stats.accuracyRate.toFixed(1)}%`,
      icon: TrendingUp,
      description: 'Average detection accuracy',
    },
  ];

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-500/10 text-green-500';
      case 'degraded': return 'bg-yellow-500/10 text-yellow-500';
      case 'down': return 'bg-red-500/10 text-red-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user?.email}!
          </h1>
          <p className="text-muted-foreground">
            Monitor your helmet detection system performance
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest helmet detection results</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between border-b pb-3 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {item.source === 'upload' ? 'Image Upload' : 'Live Detection'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getTimeAgo(item.created_at)}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {Array.isArray(item.detected_objects) ? item.detected_objects.length : 0} objects
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Current system health metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {systemHealth.length > 0 ? (
                <div className="space-y-4">
                  {systemHealth.map((metric) => (
                    <div
                      key={metric.metric_name}
                      className="flex items-center justify-between border-b pb-3 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{metric.metric_name}</p>
                        <p className="text-xs text-muted-foreground">{metric.metric_value}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusColor(metric.status)}`}>
                        {metric.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No system health data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <ChatBot />
    </div>
  );
};

export default Dashboard;
