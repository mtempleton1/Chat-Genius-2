export interface WebSocketChannelEvent {
  type: "CHANNEL_CREATED" | "CHANNEL_UPDATED" | "CHANNEL_ARCHIVED";
  workspaceId: number;
  data: {
    id: number;
    name: string;
    description: string;
    isPrivate: boolean;
    workspaceId: number;
    topic?: string;
    archived?: boolean;
  };
}

export interface WebSocketMessageEvent {
  type: "MESSAGE_CREATED";
  workspaceId: number;
  data: {
    messageId: number;
    channelId: number;
    content: string;
    userId: number;
    workspaceId: number;
    createdAt: string;
  };
}

export type WebSocketEvent = WebSocketChannelEvent | WebSocketMessageEvent; 