export interface MockNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  resourceType: string;
  resourceId: string;
  isRead: boolean;
  readAt: Date | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    id: 'notif-1',
    userId: 'user-1',
    type: 'file.shared',
    title: 'File shared with you',
    message: 'Jane Smith shared "Q4 Campaign Assets.zip" with you',
    resourceType: 'file',
    resourceId: 'file-2',
    isRead: false,
    readAt: null,
    metadata: {},
    createdAt: new Date(Date.now() - 1800000),
  },
  {
    id: 'notif-2',
    userId: 'user-1',
    type: 'workspace.invite',
    title: 'Workspace invitation',
    message: 'You were added to "Q4 Product Launch" workspace',
    resourceType: 'workspace',
    resourceId: 'ws-3',
    isRead: false,
    readAt: null,
    metadata: {},
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: 'notif-3',
    userId: 'user-1',
    type: 'comment.new',
    title: 'New comment',
    message: 'Bob Johnson commented on "Brand Guidelines 2024.pdf"',
    resourceType: 'file',
    resourceId: 'file-1',
    isRead: true,
    readAt: new Date(Date.now() - 43200000),
    metadata: {},
    createdAt: new Date(Date.now() - 172800000),
  },
];
