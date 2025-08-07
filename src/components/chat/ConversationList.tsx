import { useState, useMemo, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import type { ConversationWithUsers } from '../../lib/supabase/types'
import ConversationItem from './ConversationItem'
import LoadingSpinner from '../ui/LoadingSpinner'
import { subscribeToConversations, ConnectionManager } from '../../lib/supabase/chatService'

interface ConversationListProps {
  conversations: ConversationWithUsers[]
  currentUserId: string
  selectedConversationId?: string
  onConversationSelect: (conversationId: string) => void
  onConversationUpdate?: (conversations: ConversationWithUsers[]) => void
  onConversationDeleted?: (deletedConversationId: string) => void
  isLoading?: boolean
  error?: string | null
}

function ConversationList({ 
  conversations, 
  currentUserId,
  selectedConversationId,
  onConversationSelect,
  onConversationUpdate,
  onConversationDeleted,
  isLoading = false,
  error = null
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const connectionManagerRef = useRef<ConnectionManager>(new ConnectionManager())

  // Setup real-time conversation updates
  useEffect(() => {
    const setupRealtimeSubscriptions = () => {
      const connectionManager = connectionManagerRef.current

      // Subscribe to conversation updates
      const conversationsSubscription = subscribeToConversations(
        currentUserId,
        (updatedConversation) => {
          // Trigger parent component to refresh conversations
          onConversationUpdate?.(conversations)
        },
        (deletedConversationId) => {
          // Handle conversation deletion
          onConversationDeleted?.(deletedConversationId)
        },
        (error) => {
          console.error('Conversations subscription error:', error)
        }
      )

      connectionManager.addSubscription('conversations', conversationsSubscription)
    }

    // Monitor online status
    const handleOnlineStatus = () => {
      if (navigator.onLine) {
        // Reconnect when coming back online
        connectionManagerRef.current.handleReconnect(setupRealtimeSubscriptions)
      }
    }

    setupRealtimeSubscriptions()

    // Add online/offline listeners
    window.addEventListener('online', handleOnlineStatus)
    window.addEventListener('offline', handleOnlineStatus)

    return () => {
      // Cleanup subscriptions
      connectionManagerRef.current.removeAllSubscriptions()
      window.removeEventListener('online', handleOnlineStatus)
      window.removeEventListener('offline', handleOnlineStatus)
    }
  }, [currentUserId, conversations, onConversationUpdate, onConversationDeleted])

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations
    }

    const query = searchQuery.toLowerCase()
    
    return conversations.filter((conversation) => {
      const otherUser = conversation.owner.id === currentUserId 
        ? conversation.caretaker 
        : conversation.owner
      
      const fullName = `${otherUser.first_name || ''} ${otherUser.last_name || ''}`.toLowerCase()
      const lastMessage = conversation.last_message?.content?.toLowerCase() || ''
      
      return fullName.includes(query) || lastMessage.includes(query)
    })
  }, [conversations, currentUserId, searchQuery])

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 font-medium">Fehler beim Laden der Nachrichten</p>
          <p className="text-gray-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search Header */}
      <div className="bg-white border-b-2 border-gray-200 px-4 py-4 h-[72px] flex items-center">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Konversationen durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center">
              {searchQuery ? (
                <>
                  <p className="text-gray-500 font-medium">Keine Ergebnisse gefunden</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Versuche einen anderen Suchbegriff
                  </p>
                </>
              ) : (
                <>
                  <p className="text-gray-500 font-medium">Noch keine Nachrichten</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Kontaktiere einen Betreuer, um zu chatten
                  </p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div>
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                currentUserId={currentUserId}
                onClick={() => onConversationSelect(conversation.id)}
                isSelected={selectedConversationId === conversation.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      {filteredConversations.length > 0 && (
        <div className="p-2 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            {filteredConversations.length} von {conversations.length} Konversationen
          </p>
        </div>
      )}
    </div>
  )
}

export default ConversationList 