/**
 * User-specific topic tracking via Supabase.
 * Manages which topics each user has completed.
 */

import { supabase } from './supabase'

export interface UserReadTopic {
  id: string
  user_id: string
  topic_id: string
  read_at: string
}

/**
 * Fetch all topic IDs the current user has completed.
 * Returns empty array if user is not authenticated or on error.
 */
export async function getUserCompletedTopicIds(): Promise<string[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('user_read_topics')
      .select('topic_id')
      .eq('user_id', user.id)
      .order('read_at', { ascending: false })

    if (error) {
      console.error('Error fetching completed topics:', error)
      return []
    }

    return data?.map((row) => row.topic_id) ?? []
  } catch (err) {
    console.error('Failed to get completed topics:', err)
    return []
  }
}

/**
 * Fetch full reading history for the current user.
 * Returns empty array if user is not authenticated or on error.
 */
export async function getUserReadingHistory(): Promise<UserReadTopic[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('user_read_topics')
      .select('*')
      .eq('user_id', user.id)
      .order('read_at', { ascending: false })

    if (error) {
      console.error('Error fetching reading history:', error)
      return []
    }

    return data ?? []
  } catch (err) {
    console.error('Failed to get reading history:', err)
    return []
  }
}

/**
 * Mark a topic as completed for the current user.
 * Returns true on success, false on failure.
 * Handles duplicate entries gracefully (upsert behavior).
 */
export async function markTopicAsCompleted(topicId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('Cannot mark topic as completed: user not authenticated')
      return false
    }

    const { error } = await supabase
      .from('user_read_topics')
      .upsert(
        {
          user_id: user.id,
          topic_id: topicId,
          read_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,topic_id',
          ignoreDuplicates: false, // Update read_at on duplicate
        }
      )

    if (error) {
      console.error('Error marking topic as completed:', error)
      return false
    }

    console.log(`Topic ${topicId} marked as completed`)
    return true
  } catch (err) {
    console.error('Failed to mark topic as completed:', err)
    return false
  }
}

/**
 * Check if a specific topic has been completed by the current user.
 */
export async function isTopicCompleted(topicId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase
      .from('user_read_topics')
      .select('id')
      .eq('user_id', user.id)
      .eq('topic_id', topicId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking topic completion:', error)
      return false
    }

    return !!data
  } catch (err) {
    console.error('Failed to check topic completion:', err)
    return false
  }
}
