-- Fix the populate_sample_data_for_user function to handle multiple row inserts correctly
CREATE OR REPLACE FUNCTION public.populate_sample_data_for_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_session_id_1 UUID;
  v_session_id_2 UUID;
BEGIN
  -- Create sample live sessions (insert one at a time to get IDs)
  INSERT INTO public.live_sessions (user_id, frames_processed, helmets_detected, avg_fps, avg_confidence, started_at, ended_at)
  VALUES 
    (p_user_id, 1250, 89, 28.5, 92.3, now() - interval '2 days', now() - interval '2 days' + interval '15 minutes')
  RETURNING id INTO v_session_id_1;

  INSERT INTO public.live_sessions (user_id, frames_processed, helmets_detected, avg_fps, avg_confidence, started_at, ended_at)
  VALUES 
    (p_user_id, 890, 45, 29.1, 88.7, now() - interval '1 day', now() - interval '1 day' + interval '10 minutes')
  RETURNING id INTO v_session_id_2;

  INSERT INTO public.live_sessions (user_id, frames_processed, helmets_detected, avg_fps, avg_confidence, started_at, ended_at)
  VALUES 
    (p_user_id, 2100, 156, 27.8, 94.1, now() - interval '5 hours', now() - interval '4 hours' + interval '30 minutes');

  -- Create sample image upload detections
  INSERT INTO public.detections (user_id, source, detected_objects, confidence, created_at)
  VALUES
    (p_user_id, 'upload', '[{"label":"helmet","confidence":0.96,"x":120,"y":80,"width":180,"height":200}]'::jsonb, 96.0, now() - interval '3 days'),
    (p_user_id, 'upload', '[{"label":"helmet","confidence":0.89,"x":200,"y":150,"width":160,"height":180},{"label":"no-helmet","confidence":0.92,"x":450,"y":200,"width":170,"height":190}]'::jsonb, 90.5, now() - interval '2 days' + interval '3 hours'),
    (p_user_id, 'upload', '[{"label":"helmet","confidence":0.94,"x":300,"y":100,"width":175,"height":195}]'::jsonb, 94.0, now() - interval '1 day' + interval '8 hours'),
    (p_user_id, 'upload', '[{"label":"helmet","confidence":0.91,"x":150,"y":120,"width":165,"height":185},{"label":"helmet","confidence":0.88,"x":380,"y":140,"width":170,"height":190}]'::jsonb, 89.5, now() - interval '18 hours'),
    (p_user_id, 'upload', '[{"label":"no-helmet","confidence":0.87,"x":220,"y":180,"width":155,"height":175}]'::jsonb, 87.0, now() - interval '12 hours'),
    (p_user_id, 'upload', '[{"label":"helmet","confidence":0.97,"x":180,"y":90,"width":185,"height":205},{"label":"seatbelt","confidence":0.93,"x":190,"y":250,"width":80,"height":120}]'::jsonb, 95.0, now() - interval '6 hours'),
    (p_user_id, 'upload', '[{"label":"helmet","confidence":0.92,"x":250,"y":110,"width":170,"height":190}]'::jsonb, 92.0, now() - interval '3 hours'),
    (p_user_id, 'upload', '[{"label":"helmet","confidence":0.95,"x":140,"y":95,"width":178,"height":198},{"label":"helmet","confidence":0.90,"x":400,"y":130,"width":168,"height":188},{"label":"no-helmet","confidence":0.85,"x":650,"y":160,"width":160,"height":180}]'::jsonb, 90.0, now() - interval '1 hour');

  -- Create sample live detection entries linked to sessions
  INSERT INTO public.detections (user_id, source, session_id, detected_objects, confidence, created_at)
  VALUES
    (p_user_id, 'live', v_session_id_1, '[{"label":"helmet","confidence":0.93,"x":320,"y":140,"width":172,"height":192}]'::jsonb, 93.0, now() - interval '2 days' + interval '5 minutes'),
    (p_user_id, 'live', v_session_id_1, '[{"label":"helmet","confidence":0.91,"x":315,"y":135,"width":175,"height":195},{"label":"no-helmet","confidence":0.88,"x":580,"y":170,"width":165,"height":185}]'::jsonb, 89.5, now() - interval '2 days' + interval '8 minutes'),
    (p_user_id, 'live', v_session_id_2, '[{"label":"helmet","confidence":0.89,"x":280,"y":120,"width":168,"height":188}]'::jsonb, 89.0, now() - interval '1 day' + interval '4 minutes'),
    (p_user_id, 'live', v_session_id_2, '[{"label":"helmet","confidence":0.94,"x":290,"y":125,"width":170,"height":190}]'::jsonb, 94.0, now() - interval '1 day' + interval '7 minutes');
    
END;
$function$;