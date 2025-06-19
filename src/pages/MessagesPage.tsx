import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getUserConversations } from '../lib/supabase/chatService'
import { supabase } from '../lib/supabase/client'
import type { ConversationWithUsers } from '../lib/supabase/types'
import ConversationList from '../components/chat/ConversationList'
import ChatWindow from '../components/chat/ChatWindow'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useNotifications } from '../lib/notifications/NotificationContext'

function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationWithUsers[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithUsers | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  const navigate = useNavigate()
  const { conversationId } = useParams()
  const { refreshUnreadCount } = useNotifications()

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        navigate('/anmelden?redirect=/nachrichten')
        return
      }
      
      setCurrentUserId(user.id)
    }

    getCurrentUser()
  }, [navigate])

  // Load conversations
  useEffect(() => {
    if (!currentUserId) return

    const loadConversations = async () => {
      setIsLoading(true)
      setError(null)

      const { data, error: loadError } = await getUserConversations(currentUserId)
      
      if (loadError) {
        setError(loadError)
      } else {
        setConversations(data || [])
        
        // If conversationId in URL, find and select that conversation
        if (conversationId && data) {
          const conversation = data.find(c => c.id === conversationId)
          if (conversation) {
            setSelectedConversation(conversation)
          }
        }
      }
      
      setIsLoading(false)
    }

    loadConversations()
  }, [currentUserId, refreshTrigger, conversationId])

  const handleConversationSelect = (conversationId: string) => {
    // Update URL without navigating to new page
    navigate(`/nachrichten/${conversationId}`, { replace: true })
    
    // Find and set the selected conversation
    const conversation = conversations.find(c => c.id === conversationId)
    if (conversation) {
      setSelectedConversation(conversation)
      // Refresh unread count when selecting a conversation (messages might be marked as read)
      refreshUnreadCount()
    }
  }

  const handleConversationUpdate = () => {
    // Trigger refresh of conversations
    setRefreshTrigger(prev => prev + 1)
    // Refresh unread count in header
    refreshUnreadCount()
  }

  const handleBackToList = () => {
    navigate('/nachrichten', { replace: true })
    setSelectedConversation(null)
  }

  const handleConversationDeleted = (deletedConversationId: string) => {
    console.log('handleConversationDeleted called for:', deletedConversationId)
    console.log('Current conversations:', conversations.map(c => c.id))
    
    // Entferne gelöschte Konversation aus der Liste
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== deletedConversationId)
      console.log('After deletion, conversations:', filtered.map(c => c.id))
      return filtered
    })
    
    // Wenn die gelöschte Konversation ausgewählt war, gehe zurück zur Übersicht
    if (selectedConversation?.id === deletedConversationId) {
      console.log('Selected conversation was deleted, navigating back')
      setSelectedConversation(null)
      navigate('/nachrichten', { replace: true })
    }
  }

  if (!currentUserId) {
    return (
      <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 80px)' }}>
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="bg-gray-50" style={{ height: 'calc(100vh - 80px)' }}>
      <div className="container-custom h-full py-4">
        <div className="bg-white rounded-xl shadow-sm h-full flex overflow-hidden" style={{ height: 'calc(100% - 2rem)' }}>
          {/* Mobile Back Button - nur wenn Konversation ausgewählt */}
          {selectedConversation && (
            <div className="lg:hidden absolute top-4 left-4 z-10">
              <button
                onClick={handleBackToList}
                className="p-2 bg-white text-gray-400 hover:text-gray-600 transition-colors rounded-lg shadow-md"
                aria-label="Zurück zur Übersicht"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Conversations Sidebar */}
          <div className={`
            w-full lg:w-80 xl:w-96 border-r border-gray-200 flex-shrink-0
            ${selectedConversation ? 'hidden lg:block' : 'block'}
          `}>
            <ConversationList
              conversations={conversations}
              currentUserId={currentUserId}
              selectedConversationId={selectedConversation?.id}
              onConversationSelect={handleConversationSelect}
              onConversationUpdate={handleConversationUpdate}
              onConversationDeleted={handleConversationDeleted}
              isLoading={isLoading}
              error={error}
            />
          </div>

          {/* Chat Area */}
          <div className={`
            flex-1 min-w-0
            ${selectedConversation ? 'block' : 'hidden lg:flex lg:items-center lg:justify-center'}
          `}>
            {selectedConversation ? (
              <ChatWindow
                conversation={selectedConversation}
                currentUserId={currentUserId}
                onBack={handleBackToList}
                onConversationDeleted={handleConversationDeleted}
                onMessageSent={handleConversationUpdate}
              />
            ) : (
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 21l1.98-5.874A8.955 8.955 0 013 12a8 8 0 018-8c4.418 0 8 3.582 8 8z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-600 mb-2">
                  Wählen Sie eine Konversation
                </h2>
                <p className="text-gray-500">
                  Klicken Sie auf eine Konversation links, um zu chatten
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MessagesPage 