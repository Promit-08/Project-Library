import { supabase } from '../lib/supabase';

export type NotificationType = 'like' | 'dislike' | 'comment' | 'rating';

export async function createNotification({
  userId,
  actorId,
  projectId,
  type,
  content
}: {
  userId: string;
  actorId: string;
  projectId: string;
  type: NotificationType;
  content: string;
}) {
  console.log('Attempting to create notification:', { userId, actorId, projectId, type });
  
  // For testing purposes, we'll allow notifying yourself if you are the developer
  // Ideally: if (userId === actorId) return;

  try {
    const { error } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: userId,
          actor_id: actorId,
          project_id: projectId,
          type,
          content,
          is_read: false
        }
      ]);

    if (error) {
      console.error('Supabase error inserting notification:', error);
      throw error;
    }
    console.log('Notification created successfully');
  } catch (error) {
    console.error('Error in createNotification:', error);
  }
}
