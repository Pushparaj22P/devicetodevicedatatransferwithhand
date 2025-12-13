import { supabase } from '@/integrations/supabase/client';
import { encryptData, generateEncryptionKey, decryptData, generateSessionId, hashGesture } from './encryption';

export interface TransferData {
  type: 'text' | 'contact' | 'credentials' | 'link';
  content: string;
  title?: string;
}

export interface GestureSession {
  id: string;
  gesture_hash: string;
  sender_id: string;
  data_type: string;
  data_title: string | null;
  data_content: string;
  encrypted_content: string | null;
  encryption_key: string | null;
  status: 'waiting' | 'matched' | 'completed' | 'expired';
  created_at: string;
  expires_at: string;
  matched_at: string | null;
  completed_at: string | null;
}

export async function createGestureSession(
  gesturePoints: { x: number; y: number }[],
  data: TransferData
): Promise<{ session: GestureSession; encryptionKey: string } | null> {
  try {
    const gestureHash = hashGesture(gesturePoints);
    if (!gestureHash) {
      console.error('Failed to generate gesture hash');
      return null;
    }

    const encryptionKey = await generateEncryptionKey();
    const encryptedContent = await encryptData(data.content, encryptionKey);
    const senderId = generateSessionId();

    const { data: session, error } = await supabase
      .from('gesture_sessions')
      .insert({
        gesture_hash: gestureHash,
        sender_id: senderId,
        data_type: data.type,
        data_title: data.title || null,
        data_content: data.content, // Store plain for now, encrypted version also stored
        encrypted_content: encryptedContent,
        encryption_key: encryptionKey, // In production, use different key exchange
        status: 'waiting',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return null;
    }

    return { session: session as GestureSession, encryptionKey };
  } catch (error) {
    console.error('Error creating gesture session:', error);
    return null;
  }
}

export async function findMatchingSession(
  gesturePoints: { x: number; y: number }[]
): Promise<GestureSession | null> {
  try {
    const gestureHash = hashGesture(gesturePoints);
    if (!gestureHash) {
      console.error('Failed to generate gesture hash');
      return null;
    }

    // Find a waiting session with matching hash
    const { data: sessions, error } = await supabase
      .from('gesture_sessions')
      .select('*')
      .eq('gesture_hash', gestureHash)
      .eq('status', 'waiting')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error finding session:', error);
      return null;
    }

    if (!sessions || sessions.length === 0) {
      return null;
    }

    const session = sessions[0] as GestureSession;

    // Update session status to matched
    const { error: updateError } = await supabase
      .from('gesture_sessions')
      .update({ 
        status: 'matched',
        matched_at: new Date().toISOString()
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('Error updating session:', updateError);
    }

    return session;
  } catch (error) {
    console.error('Error finding matching session:', error);
    return null;
  }
}

export async function completeSession(sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('gesture_sessions')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    return !error;
  } catch (error) {
    console.error('Error completing session:', error);
    return false;
  }
}

export function subscribeToSessionUpdates(
  sessionId: string,
  callback: (session: GestureSession) => void
): () => void {
  const channel = supabase
    .channel(`session-${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'gesture_sessions',
        filter: `id=eq.${sessionId}`,
      },
      (payload) => {
        callback(payload.new as GestureSession);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function decryptSessionData(session: GestureSession): Promise<string | null> {
  if (!session.encrypted_content || !session.encryption_key) {
    return session.data_content;
  }

  try {
    return await decryptData(session.encrypted_content, session.encryption_key);
  } catch (error) {
    console.error('Error decrypting data:', error);
    return session.data_content; // Fallback to plain content
  }
}
