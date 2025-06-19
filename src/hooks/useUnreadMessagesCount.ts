import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth/AuthContext'
import { getUserConversations } from '../lib/supabase/chatService'

export function useUnreadMessagesCount() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const { isAuthenticated, userProfile } = useAuth()

  const updateUnreadCount = async () => {
    if (!isAuthenticated || !userProfile?.id) {
      setUnreadCount(0)
      return
    }

    setIsLoading(true)
    try {
      const { data: conversations, error } = await getUserConversations(userProfile.id)
      
      if (error || !conversations) {
        setUnreadCount(0)
        return
      }

      // Calculate total unread messages across all conversations
      const totalUnread = conversations.reduce((total, conversation) => {
        return total + (conversation.unread_count || 0)
      }, 0)

      // Debug logging
      if (import.meta.env.DEV) {
        console.log('Unread messages count:', {
          conversations: conversations.length,
          conversationsWithUnread: conversations.filter(c => (c.unread_count || 0) > 0),
          totalUnread,
          conversationDetails: conversations.map(c => ({
            id: c.id,
            unread_count: c.unread_count,
            last_message: c.last_message?.content
          }))
        })
      }

      setUnreadCount(totalUnread)
    } catch (error) {
      console.error('Error fetching unread count:', error)
      setUnreadCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  // Update count when authentication state changes
  useEffect(() => {
    updateUnreadCount()
  }, [isAuthenticated, userProfile?.id])

  // Poll for updates every 30 seconds when user is authenticated
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(updateUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [isAuthenticated])

  return {
    unreadCount,
    isLoading,
    refresh: updateUnreadCount
  }
} 