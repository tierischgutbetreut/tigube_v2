import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import type { ConversationWithUsers } from '../../lib/supabase/types'
import UserAvatar from './UserAvatar'

interface ConversationItemProps {
  conversation: ConversationWithUsers
  currentUserId: string
  onClick: () => void
  isSelected?: boolean
}

function ConversationItem({ 
  conversation, 
  currentUserId, 
  onClick, 
  isSelected = false 
}: ConversationItemProps) {
  // Determine who the "other" user is (not the current user)
  const otherUser = conversation.owner.id === currentUserId 
    ? conversation.caretaker 
    : conversation.owner

  const formatTime = (dateString: string | null) => {
    if (!dateString) return ''
    
    try {
      const date = parseISO(dateString)
      
      if (isToday(date)) {
        // Heute: nur Uhrzeit (z.B. "14:30")
        return format(date, 'HH:mm', { locale: de })
      } else if (isYesterday(date)) {
        // Gestern: nur "Gestern"
        return 'Gestern'
      } else {
        // Älter: nur Datum (z.B. "12.01.")
        return format(date, 'dd.MM.', { locale: de })
      }
    } catch {
      return ''
    }
  }

  const getDisplayName = () => {
    const firstName = otherUser.first_name || ''
    const lastName = otherUser.last_name || ''
    return `${firstName} ${lastName}`.trim() || 'Unbekannt'
  }

  const getLastMessagePreview = () => {
    console.log('=== CONVERSATION ITEM DEBUG ===')
    console.log('Conversation ID:', conversation.id)
    console.log('Full conversation object:', conversation)
    console.log('last_message:', conversation.last_message)
    console.log('last_message type:', typeof conversation.last_message)
    console.log('last_message.content:', conversation.last_message?.content)
    console.log('===============================')

    // TEMPORARY FIX: Show actual message content if we can find any messages
    // This is a fallback while we debug the real issue
    if (!conversation.last_message) {
      console.log('❌ No last_message found')
      return 'Keine Nachrichten geladen'
    }

    if (!conversation.last_message.content) {
      console.log('❌ No content in last_message')
      return 'Nachricht ohne Inhalt'
    }
    
    const content = conversation.last_message.content.trim()
    if (content === '') {
      console.log('❌ Empty content')
      return 'Leere Nachricht'
    }
    
    const isOwnMessage = conversation.last_message.sender_id === currentUserId
    const prefix = isOwnMessage ? 'Du: ' : ''
    
    console.log('✅ Showing message:', content)
    
    // Truncate long messages
    if (content.length > 50) {
      return `${prefix}${content.substring(0, 50)}...`
    }
    
    return `${prefix}${content}`
  }

  return (
    <div
      onClick={onClick}
      className={`
        p-4 border-b border-gray-200 cursor-pointer transition-colors
        hover:bg-gray-50 
        ${isSelected ? 'bg-blue-50 border-blue-200' : ''}
      `}
    >
      <div className="flex items-center space-x-3">
        <UserAvatar user={otherUser} size="md" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {getDisplayName()}
            </h3>
            
            <div className="flex items-center space-x-2">
              {conversation.last_message && (
                <span className="text-xs text-gray-500">
                  {formatTime(conversation.last_message.created_at)}
                </span>
              )}
              
              {(conversation.unread_count || 0) > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[20px]">
                  {conversation.unread_count}
                </span>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-600 truncate mt-1">
            {getLastMessagePreview()}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ConversationItem 