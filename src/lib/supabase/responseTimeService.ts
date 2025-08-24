import { supabase } from './client';

export interface ResponseTimeData {
  averageResponseTime: number; // in Minuten
  responseTimeText: string;
  messageCount: number;
}

/**
 * Berechnet die durchschnittliche Antwortzeit eines Caretakers
 * basierend auf den Chat-Nachrichten in den letzten 30 Tagen
 */
export async function calculateCaretakerResponseTime(
  caretakerId: string
): Promise<ResponseTimeData | null> {
  try {
    // Hole alle Konversationen des Caretakers aus den letzten 30 Tagen
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('id, created_at')
      .eq('caretaker_id', caretakerId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (conversationsError || !conversations) {
      console.error('Error fetching conversations:', conversationsError);
      return null;
    }

    if (conversations.length === 0) {
      return null; // Keine Konversationen gefunden
    }

    const conversationIds = conversations.map(c => c.id);
    let totalResponseTime = 0;
    let responseCount = 0;

    // Für jede Konversation die Antwortzeit berechnen
    for (const conversationId of conversationIds) {
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id, sender_id, created_at, conversation_id')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError || !messages || messages.length < 2) {
        continue; // Mindestens 2 Nachrichten für eine Antwortzeit
      }

      // Finde die erste Nachricht (sollte vom Owner sein)
      const firstMessage = messages[0];
      
      // Finde die erste Antwort des Caretakers
      const caretakerResponse = messages.find(msg => 
        msg.sender_id === caretakerId && 
        new Date(msg.created_at!) > new Date(firstMessage.created_at!)
      );

      if (caretakerResponse) {
        const responseTimeMs = new Date(caretakerResponse.created_at!).getTime() - 
                              new Date(firstMessage.created_at!).getTime();
        const responseTimeMinutes = responseTimeMs / (1000 * 60);
        
        totalResponseTime += responseTimeMinutes;
        responseCount++;
      }
    }

    if (responseCount === 0) {
      return null; // Keine Antworten gefunden
    }

    const averageResponseTime = totalResponseTime / responseCount;
    
    // Konvertiere in benutzerfreundlichen Text
    const responseTimeText = formatResponseTime(averageResponseTime);

    return {
      averageResponseTime,
      responseTimeText,
      messageCount: responseCount
    };

  } catch (error) {
    console.error('Error calculating response time:', error);
    return null;
  }
}

/**
 * Formatiert die Antwortzeit in benutzerfreundlichen Text
 */
function formatResponseTime(minutes: number): string {
  if (minutes < 30) {
    return 'unter 30 Minuten';
  } else if (minutes < 60) {
    return 'unter 1 Stunde';
  } else if (minutes < 120) {
    return '1-2 Stunden';
  } else if (minutes < 180) {
    return '2-3 Stunden';
  } else if (minutes < 1440) { // 24 Stunden
    return 'innerhalb 24 Stunden';
  } else {
    return 'mehr als 24 Stunden';
  }
}

/**
 * Holt die Antwortzeit für einen Caretaker (mit Caching)
 */
export async function getCaretakerResponseTime(
  caretakerId: string
): Promise<string | null> {
  try {
    const responseTimeData = await calculateCaretakerResponseTime(caretakerId);
    return responseTimeData?.responseTimeText || null;
  } catch (error) {
    console.error('Error getting caretaker response time:', error);
    return null;
  }
}
