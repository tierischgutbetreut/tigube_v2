import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import type { MessageWithSender } from '../../lib/supabase/types'
import UserAvatar from './UserAvatar'

interface MessageBubbleProps {
  message: MessageWithSender
  isOwnMessage: boolean
  showAvatar?: boolean
  showTimestamp?: boolean
}

function MessageBubble({ 
  message, 
  isOwnMessage, 
  showAvatar = true, 
  showTimestamp = true 
}: MessageBubbleProps) {
  const formatTime = (dateString: string | null) => {
    if (!dateString) return ''
    
    try {
      const date = parseISO(dateString)
      
      if (isToday(date)) {
        // Heute: nur Uhrzeit (z.B. "14:30")
        return format(date, 'HH:mm', { locale: de })
      } else if (isYesterday(date)) {
        // Gestern: "Gestern" + Uhrzeit (z.B. "Gestern 14:30")
        return `Gestern ${format(date, 'HH:mm', { locale: de })}`
      } else {
        // Älter: Datum + Uhrzeit (z.B. "12.01. 14:30")
        return format(date, 'dd.MM. HH:mm', { locale: de })
      }
    } catch {
      return ''
    }
  }

  const getMessageTypeColor = (type: string | null) => {
    switch (type) {
      case 'system':
        return 'bg-gray-100 text-gray-600'
      case 'image':
        return 'bg-primary-50 text-primary-800'
      default:
        return isOwnMessage 
          ? 'bg-primary-500 text-white' 
          : 'bg-primary-100 text-primary-800'
    }
  }

  if (message.message_type === 'system') {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-end space-x-2 mb-4 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {/* Avatar */}
      {showAvatar && !isOwnMessage && (
        <UserAvatar user={message.sender} size="sm" />
      )}
      {showAvatar && isOwnMessage && (
        <div className="w-8 h-8" /> // Spacer for alignment
      )}

      {/* Message Content */}
      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-xs lg:max-w-md`}>
        {/* Sender Name (only for incoming messages) */}
        {!isOwnMessage && showAvatar && (
          <span className="text-xs text-gray-500 mb-1 px-2">
            {message.sender.first_name} {message.sender.last_name}
          </span>
        )}

        {/* Message Bubble */}
        <div className={`
          px-4 py-2 rounded-lg shadow-sm
          ${getMessageTypeColor(message.message_type)}
          ${isOwnMessage ? 'rounded-br-sm' : 'rounded-bl-sm'}
        `}>
          {message.message_type === 'image' ? (
            <div>
              <img 
                src={message.content} 
                alt="Geteiltes Bild" 
                className="max-w-full h-auto rounded"
                loading="lazy"
              />
            </div>
          ) : (
            <p className="text-sm break-words whitespace-pre-wrap">
              {message.content}
            </p>
          )}
        </div>

        {/* Timestamp and Status */}
        {showTimestamp && (
          <div className={`flex items-center space-x-1 mt-1 px-2 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <span className="text-xs text-gray-400">
              {formatTime(message.created_at)}
            </span>
            
            {/* Read Status (for own messages) */}
            {isOwnMessage && (
              <span className="text-xs text-gray-400">
                {message.read_at ? '✓✓' : '✓'}
              </span>
            )}

            {/* Edited indicator */}
            {message.edited_at && (
              <span className="text-xs text-gray-400 italic">
                bearbeitet
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageBubble 