// ── Admin user list ────────────────────────────────────────────────────────────

export type AdminUserRole   = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER' | 'GUEST';
export type AdminUserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

export interface MockAdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  avatar?: string;
  storageUsed: number;
  storageQuota: number;
  createdAt: string;
  lastLoginAt?: string;
}

export const MOCK_ADMIN_USERS: MockAdminUser[] = [
  { id: '1', name: 'Amara Okonkwo',          email: 'amara@example.com',   role: 'ADMIN',   status: 'ACTIVE',    storageUsed: 4_294_967_296,  storageQuota: 53_687_091_200,  createdAt: new Date(Date.now() - 86400000 * 90).toISOString(), lastLoginAt: new Date(Date.now() - 3600000).toISOString() },
  { id: '2', name: 'Chidi Eze',              email: 'chidi@example.com',   role: 'MANAGER', status: 'ACTIVE',    storageUsed: 2_147_483_648,  storageQuota: 10_737_418_240,  createdAt: new Date(Date.now() - 86400000 * 30).toISOString(), lastLoginAt: new Date(Date.now() - 86400000).toISOString() },
  { id: '3', name: 'Ngozi Adaora',           email: 'ngozi@example.com',   role: 'MEMBER',  status: 'PENDING',   storageUsed: 0,              storageQuota: 10_737_418_240,  createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: '4', name: 'Emeka Obi',              email: 'emeka@example.com',   role: 'MEMBER',  status: 'ACTIVE',    storageUsed: 805_306_368,    storageQuota: 10_737_418_240,  createdAt: new Date(Date.now() - 86400000 * 14).toISOString(), lastLoginAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: '5', name: 'Funmilayo Ransome-Kuti', email: 'funmi@example.com',   role: 'VIEWER',  status: 'SUSPENDED', storageUsed: 1_073_741_824,  storageQuota: 5_368_709_120,   createdAt: new Date(Date.now() - 86400000 * 60).toISOString(), lastLoginAt: new Date(Date.now() - 86400000 * 14).toISOString() },
  { id: '6', name: 'Adebayo Falola',         email: 'adebayo@example.com', role: 'MEMBER',  status: 'ACTIVE',    storageUsed: 3_221_225_472,  storageQuota: 10_737_418_240,  createdAt: new Date(Date.now() - 86400000 * 15).toISOString(), lastLoginAt: new Date(Date.now() - 7200000).toISOString() },
  { id: '7', name: 'Ifeoma Nwosu',           email: 'ifeoma@example.com',  role: 'MEMBER',  status: 'ACTIVE',    storageUsed: 524_288_000,    storageQuota: 10_737_418_240,  createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),  lastLoginAt: new Date(Date.now() - 1800000).toISOString() },
  { id: '8', name: 'Babatunde Lawal',        email: 'babs@example.com',    role: 'GUEST',   status: 'ACTIVE',    storageUsed: 0,              storageQuota: 1_073_741_824,   createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
];

export const MOCK_ADMIN_WORKSPACES: { id: string; name: string }[] = [
  { id: 'ws1', name: 'Marketing Team' },
  { id: 'ws2', name: 'Engineering Docs' },
  { id: 'ws3', name: 'Q4 Product Launch' },
  { id: 'ws4', name: 'Finance & Legal' },
];

// ── Admin file list ────────────────────────────────────────────────────────────

export interface MockAdminFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  workspaceName: string;
  uploaderName: string;
  uploaderAvatar?: string;
  isShared: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export const MOCK_ADMIN_FILES: MockAdminFile[] = [
  { id: 'f1', name: 'Q4 Brand Guidelines.pdf',        mimeType: 'application/pdf',    size: 8_388_608,   workspaceName: 'Marketing Team',    uploaderName: 'Amara Okonkwo', isShared: true,  isDeleted: false, createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),  updatedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'f2', name: 'Product Roadmap 2026.xlsx',      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 2_097_152, workspaceName: 'Engineering Docs', uploaderName: 'Chidi Eze', isShared: false, isDeleted: false, createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),  updatedAt: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: 'f3', name: 'Investor Pitch Deck.pptx',       mimeType: 'application/vnd.ms-powerpoint', size: 22_020_096, workspaceName: 'Q4 Product Launch', uploaderName: 'Amara Okonkwo', isShared: true, isDeleted: false, createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'f4', name: 'Onboarding Video.mp4',           mimeType: 'video/mp4',          size: 185_000_000, workspaceName: 'HR Workspace',      uploaderName: 'Ngozi Adaora',  isShared: false, isDeleted: false, createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: 'f5', name: 'Service Agreement - Acme.docx',  mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 540_000, workspaceName: 'Finance & Legal', uploaderName: 'Emeka Obi', isShared: true, isDeleted: false, createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'f6', name: 'Old Marketing Brief.docx',       mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 340_000, workspaceName: 'Marketing Team',  uploaderName: 'Amara Okonkwo', isShared: false, isDeleted: true, createdAt: new Date(Date.now() - 86400000 * 30).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: 'f7', name: 'Architecture Diagram v3.png',    mimeType: 'image/png',          size: 1_800_000,   workspaceName: 'Engineering Docs',  uploaderName: 'Chidi Eze',     isShared: false, isDeleted: false, createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),  updatedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'f8', name: 'Analytics Export May 2026.csv',  mimeType: 'text/csv',           size: 120_000,     workspaceName: 'Engineering Docs',  uploaderName: 'Ngozi Adaora',  isShared: false, isDeleted: false, createdAt: new Date(Date.now() - 86400000).toISOString(),      updatedAt: new Date(Date.now() - 3600000).toISOString() },
];

// ── Admin dashboard stats ──────────────────────────────────────────────────────

export const MOCK_ADMIN_STATS = {
  totalUsers: 47,
  activeUsers: 43,
  totalFiles: 3842,
  cloudAddonSubscribers: 12,
  totalStorageUsedBytes: '107374182400',
  planDistribution: { STARTER: 28, PROFESSIONAL: 14, ENTERPRISE: 5 },
};

// ── Admin analytics ────────────────────────────────────────────────────────────

export const MOCK_ADMIN_ANALYTICS = {
  enrollmentTimeline: [120,145,132,178,165,210,198,245,230,278,265,310,298,340,325,380,365,420,408,455,443,490,478,520,510,545,530,580,565,612],
  revenueTimeline:    [2400,2800,2650,3200,3050,3800,3600,4200,4050,4800,4650,5200,5050,5800,5650,6200,6050,6800,6650,7200,7050,7800,7650,8200,8050,8800,8650,9200,9050,9800],
  enrollmentByDay:    [48,62,54,73,69,42,35],
  completionByDay:    [12,18,15,22,19,11,8],
  revenueByMonth:     [18400,22500,19800,28900,32100,27600,35200,38900,41200,45600,48900,52300],
  topCourses: [
    { title: 'Complete React Developer',  enrollments: 1204, completionRate: 72, revenue: 28900 },
    { title: 'Full-Stack Node.js',        enrollments: 987,  completionRate: 68, revenue: 23700 },
    { title: 'TypeScript Masterclass',    enrollments: 843,  completionRate: 81, revenue: 20200 },
    { title: 'System Design',            enrollments: 756,  completionRate: 65, revenue: 18100 },
    { title: 'Advanced Python & ML',      enrollments: 698,  completionRate: 74, revenue: 16700 },
  ],
  funnelSteps: [
    { label: 'Course Page Viewed',   value: 24820, pct: 100 },
    { label: 'Enrollment Started',   value: 8947,  pct: 36  },
    { label: 'Checkout Initiated',   value: 4201,  pct: 17  },
    { label: 'Payment Completed',    value: 3105,  pct: 13  },
    { label: 'First Lesson Watched', value: 2878,  pct: 12  },
    { label: 'Course Completed',     value: 1842,  pct: 7   },
  ],
  summary: { totalUsers: 4820, totalEnrollments: 18247, totalRevenue: 284900, avgCompletion: 68 },
};
