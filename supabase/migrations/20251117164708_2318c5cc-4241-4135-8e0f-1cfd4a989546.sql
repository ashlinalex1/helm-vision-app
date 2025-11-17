-- Create live_sessions table to track webcam detection sessions
CREATE TABLE public.live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  frames_processed INTEGER NOT NULL DEFAULT 0,
  helmets_detected INTEGER NOT NULL DEFAULT 0,
  avg_fps NUMERIC(5,2),
  avg_confidence NUMERIC(5,2),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- Create detections table to store all detection results
CREATE TABLE public.detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('upload', 'live')),
  session_id UUID REFERENCES public.live_sessions(id) ON DELETE SET NULL,
  image_data TEXT,
  detected_objects JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create system_health table for monitoring metrics
CREATE TABLE public.system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL UNIQUE,
  metric_value TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('operational', 'degraded', 'down')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;

-- RLS Policies for live_sessions
CREATE POLICY "Users can view their own sessions"
  ON public.live_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
  ON public.live_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.live_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for detections
CREATE POLICY "Users can view their own detections"
  ON public.detections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own detections"
  ON public.detections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for system_health (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view system health"
  ON public.system_health FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_detections_user_id ON public.detections(user_id);
CREATE INDEX idx_detections_created_at ON public.detections(created_at DESC);
CREATE INDEX idx_detections_source ON public.detections(source);
CREATE INDEX idx_live_sessions_user_id ON public.live_sessions(user_id);
CREATE INDEX idx_live_sessions_started_at ON public.live_sessions(started_at DESC);

-- Insert initial system health metrics
INSERT INTO public.system_health (metric_name, metric_value, status) VALUES
  ('API Server', 'Running', 'operational'),
  ('Detection Model', 'v2.1.0', 'operational'),
  ('Database', 'Connected', 'operational'),
  ('Storage', '89% Available', 'operational');