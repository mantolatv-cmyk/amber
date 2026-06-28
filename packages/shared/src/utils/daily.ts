/**
 * Daily.co API Helper
 *
 * Utility functions for interacting with the Daily.co video API.
 * Used for creating/managing rooms for tutoring sessions.
 */

const DAILY_API_BASE = "https://api.daily.co/v1";

function getDailyApiKey(): string {
  const key = process.env.DAILY_CO_API_KEY;
  if (!key) {
    console.warn("⚠️ DAILY_CO_API_KEY is not set.");
  }
  return key || "";
}

function dailyHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getDailyApiKey()}`,
  };
}

export interface DailyRoomConfig {
  /** Room name (must be unique). Auto-generated from session ID if not provided. */
  name: string;
  /** Room expiration as Unix timestamp (seconds). Default: 24 hours from now. */
  expiresAt?: number;
  /** Maximum number of participants. Default: 2 for 1:1 tutoring. */
  maxParticipants?: number;
  /** Whether the room is private. Default: true. */
  isPrivate?: boolean;
}

export interface DailyRoom {
  id: string;
  name: string;
  url: string;
  created_at: string;
  config: Record<string, unknown>;
}

/**
 * Create a new Daily.co room for a session.
 */
export async function createDailyRoom(config: DailyRoomConfig): Promise<DailyRoom | null> {
  const apiKey = getDailyApiKey();
  if (!apiKey) return null;

  try {
    const response = await fetch(`${DAILY_API_BASE}/rooms`, {
      method: "POST",
      headers: dailyHeaders(),
      body: JSON.stringify({
        name: config.name,
        privacy: config.isPrivate !== false ? "private" : "public",
        properties: {
          exp: config.expiresAt || Math.floor(Date.now() / 1000) + 24 * 60 * 60,
          enable_chat: true,
          start_audio_off: true,
          start_video_off: false,
          max_participants: config.maxParticipants || 2,
          enable_screenshare: true,
          enable_recording: false,
          eject_at_room_exp: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to create Daily room: ${response.status} ${errorText}`);
      return null;
    }

    const data = await response.json();
    console.log(`🎥 Daily room created: ${data.url}`);
    return data as DailyRoom;
  } catch (error) {
    console.error("Daily.co createRoom error:", error);
    return null;
  }
}

/**
 * Delete a Daily.co room by name.
 */
export async function deleteDailyRoom(roomName: string): Promise<boolean> {
  const apiKey = getDailyApiKey();
  if (!apiKey) return false;

  try {
    const response = await fetch(`${DAILY_API_BASE}/rooms/${roomName}`, {
      method: "DELETE",
      headers: dailyHeaders(),
    });

    return response.ok;
  } catch (error) {
    console.error("Daily.co deleteRoom error:", error);
    return false;
  }
}

/**
 * Create a meeting token for a specific room with user-specific settings.
 * Tokens provide access control (who can join) and can set display names.
 */
export async function createDailyToken(
  roomName: string,
  options: {
    userName: string;
    isOwner?: boolean;
    expiresAt?: number;
  }
): Promise<string | null> {
  const apiKey = getDailyApiKey();
  if (!apiKey) return null;

  try {
    const response = await fetch(`${DAILY_API_BASE}/meeting-tokens`, {
      method: "POST",
      headers: dailyHeaders(),
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          user_name: options.userName,
          is_owner: options.isOwner || false,
          exp: options.expiresAt || Math.floor(Date.now() / 1000) + 24 * 60 * 60,
        },
      }),
    });

    if (!response.ok) {
      console.error(`Failed to create Daily token: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error("Daily.co createToken error:", error);
    return null;
  }
}

/**
 * Create a room name from a session ID (truncated for readability).
 */
export function sessionRoomName(sessionId: string): string {
  return `session-${sessionId.substring(0, 8)}`;
}
