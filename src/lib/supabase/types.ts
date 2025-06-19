import type { Database } from './database.types'

// Base types from database
export type User = Database['public']['Tables']['users']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Message = Database['public']['Tables']['messages']['Row']

export type ConversationInsert = Database['public']['Tables']['conversations']['Insert']
export type MessageInsert = Database['public']['Tables']['messages']['Insert']

// Extended types for UI
export interface ConversationWithUsers extends Conversation {
  owner: Pick<User, 'id' | 'first_name' | 'last_name' | 'profile_photo_url'>
  caretaker: Pick<User, 'id' | 'first_name' | 'last_name' | 'profile_photo_url'>
  last_message?: {
    content: string
    created_at: string
    sender_id: string
  }
  unread_count: number
}

export interface MessageWithSender extends Message {
  sender: Pick<User, 'id' | 'first_name' | 'last_name' | 'profile_photo_url'>
}

// Request types
export interface CreateConversationRequest {
  owner_id: string
  caretaker_id: string
}

export interface SendMessageRequest {
  conversation_id: string
  content: string
  message_type?: string
}

export interface GetMessagesOptions {
  conversation_id: string
  limit?: number
  offset?: number
  before?: string
}

export interface UnreadCount {
  conversation_id: string
  count: number
}
