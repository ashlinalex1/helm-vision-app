import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useLiveSession = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionStarted = useRef(false);

  const startSession = useCallback(async (userId: string) => {
    if (sessionStarted.current) return sessionId;

    try {
      const { data, error } = await supabase
        .from('live_sessions')
        .insert({
          user_id: userId,
          frames_processed: 0,
          helmets_detected: 0,
        })
        .select()
        .single();

      if (error) throw error;
      
      sessionStarted.current = true;
      setSessionId(data.id);
      return data.id;
    } catch (error) {
      console.error('Error starting session:', error);
      return null;
    }
  }, [sessionId]);

  const updateSession = useCallback(async (
    sessionId: string,
    stats: {
      frames_processed: number;
      helmets_detected: number;
      avg_fps: number;
      avg_confidence: number;
    }
  ) => {
    try {
      const { error } = await supabase
        .from('live_sessions')
        .update({
          frames_processed: stats.frames_processed,
          helmets_detected: stats.helmets_detected,
          avg_fps: stats.avg_fps,
          avg_confidence: stats.avg_confidence,
        })
        .eq('id', sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating session:', error);
    }
  }, []);

  const endSession = useCallback(async (sessionId: string) => {
    if (!sessionId) return;

    try {
      const { error } = await supabase
        .from('live_sessions')
        .update({
          ended_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw error;
      
      sessionStarted.current = false;
      setSessionId(null);
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }, []);

  const saveDetection = useCallback(async (
    userId: string,
    sessionId: string | null,
    detections: Array<{ label: string; confidence: number }>,
    imageData?: string
  ) => {
    try {
      const avgConfidence = detections.length > 0
        ? detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length
        : null;

      const { error } = await supabase
        .from('detections')
        .insert({
          user_id: userId,
          source: 'live',
          session_id: sessionId,
          image_data: imageData,
          detected_objects: detections,
          confidence: avgConfidence,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving detection:', error);
    }
  }, []);

  return {
    sessionId,
    startSession,
    updateSession,
    endSession,
    saveDetection,
  };
};
