export const MOCK_STORAGE_DATA = {
  total: 53687091200,
  byWorkspace: [
    { id: 'ws-1', name: 'Marketing Team', storageUsed: 10737418240, storageQuota: 107374182400 },
    { id: 'ws-2', name: 'Engineering Docs', storageUsed: 32212254720, storageQuota: 214748364800 },
    { id: 'ws-3', name: 'Q4 Product Launch', storageUsed: 8589934592, storageQuota: 53687091200 },
  ],
  byMimeType: [
    { mimeType: 'video/mp4', size: 21474836480, count: 45 },
    { mimeType: 'application/pdf', size: 10737418240, count: 234 },
    { mimeType: 'image/png', size: 8589934592, count: 890 },
    { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 5368709120, count: 156 },
    { mimeType: 'application/zip', size: 7516192768, count: 23 },
  ],
};

export const MOCK_ACTIVITY_TIMELINE = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toISOString().split('T')[0],
    uploads: Math.floor(Math.random() * 25) + 5,
    bytes: Math.floor(Math.random() * 1073741824) + 104857600,
  };
});

export const MOCK_SYSTEM_STATS = {
  users: 47,
  files: 3842,
  workspaces: 12,
  storageUsed: 107374182400,
};
