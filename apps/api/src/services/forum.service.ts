import { getPrisma } from '../config/database';
import { logger } from '../utils/logger';

const prisma = getPrisma();

export const forumService = {
  // ─── Threads ────────────────────────────────────────────────────────────────

  async listThreads(forumId: string, params: {
    page?: number;
    limit?: number;
    sort?: 'latest' | 'popular' | 'unanswered';
    search?: string;
    isPinned?: boolean;
  } = {}) {
    const { page = 1, limit = 20, sort = 'latest', search, isPinned } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { forumId, status: 'PUBLISHED' };
    if (search) where.title = { contains: search, mode: 'insensitive' };
    if (isPinned !== undefined) where.isPinned = isPinned;

    const orderBy = sort === 'popular'
      ? [{ viewCount: 'desc' as const }]
      : sort === 'unanswered'
        ? [{ replyCount: 'asc' as const }, { createdAt: 'desc' as const }]
        : [{ isPinned: 'desc' as const }, { lastActivityAt: 'desc' as const }];

    const [items, total] = await Promise.all([
      prisma.forumThread.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          posts: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { author: { select: { id: true, name: true, avatar: true } } },
          },
        },
      }),
      prisma.forumThread.count({ where }),
    ]);

    return {
      items: items.map((t) => ({ ...t, latestPost: t.posts[0] ?? null })),
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  },

  async getThread(threadId: string, userId?: string) {
    const thread = await prisma.forumThread.findUniqueOrThrow({
      where: { id: threadId },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        posts: {
          where: { parentId: null, status: 'PUBLISHED' },
          orderBy: [{ isAnswer: 'desc' }, { upvotes: 'desc' }, { createdAt: 'asc' }],
          include: {
            author: { select: { id: true, name: true, avatar: true, role: true } },
            replies: {
              where: { status: 'PUBLISHED' },
              include: { author: { select: { id: true, name: true, avatar: true } } },
              orderBy: { createdAt: 'asc' },
            },
            likes: userId ? { where: { userId } } : false,
          },
        },
      },
    });

    // Increment view count
    prisma.forumThread.update({ where: { id: threadId }, data: { viewCount: { increment: 1 } } }).catch(() => {});

    return {
      ...thread,
      posts: thread.posts.map((p) => ({
        ...p,
        hasLiked: Array.isArray(p.likes) && p.likes.length > 0,
        likes: undefined,
      })),
    };
  },

  async createThread(data: {
    forumId: string;
    authorId: string;
    title: string;
    content: string;
    tags?: string[];
    courseId?: string;
  }) {
    const thread = await prisma.forumThread.create({
      data: {
        forumId: data.forumId,
        authorId: data.authorId,
        title: data.title.trim(),
        status: 'PUBLISHED',
        isPinned: false,
        isLocked: false,
        viewCount: 0,
        replyCount: 0,
        lastActivityAt: new Date(),
      },
    });

    // Create the opening post
    await prisma.forumPost.create({
      data: {
        threadId: thread.id,
        authorId: data.authorId,
        content: data.content.trim(),
        status: 'PUBLISHED',
        isAnswer: false,
        upvotes: 0,
      },
    });

    return thread;
  },

  // ─── Posts ──────────────────────────────────────────────────────────────────

  async createPost(
    threadId: string,
    authorId: string,
    data: { content: string; parentId?: string }
  ) {
    // Check thread isn't locked
    const thread = await prisma.forumThread.findUniqueOrThrow({ where: { id: threadId } });
    if (thread.isLocked) {
      throw Object.assign(new Error('This thread is locked'), { statusCode: 403 });
    }

    const post = await prisma.forumPost.create({
      data: {
        threadId,
        authorId,
        parentId: data.parentId ?? null,
        content: data.content.trim(),
        status: 'PUBLISHED',
        isAnswer: false,
        upvotes: 0,
      },
      include: { author: { select: { id: true, name: true, avatar: true, role: true } } },
    });

    // Update thread stats
    await prisma.forumThread.update({
      where: { id: threadId },
      data: { replyCount: { increment: 1 }, lastActivityAt: new Date() },
    });

    return post;
  },

  async editPost(postId: string, userId: string, content: string) {
    const post = await prisma.forumPost.findUniqueOrThrow({ where: { id: postId } });
    if (post.authorId !== userId) {
      throw Object.assign(new Error('Cannot edit someone else\'s post'), { statusCode: 403 });
    }
    return prisma.forumPost.update({ where: { id: postId }, data: { content: content.trim() } });
  },

  async deletePost(postId: string, userId: string, isAdmin = false) {
    const post = await prisma.forumPost.findUniqueOrThrow({ where: { id: postId } });
    if (post.authorId !== userId && !isAdmin) {
      throw Object.assign(new Error('Cannot delete someone else\'s post'), { statusCode: 403 });
    }
    await prisma.forumPost.update({ where: { id: postId }, data: { status: 'REMOVED' } });
    if (!post.parentId) {
      await prisma.forumThread.update({
        where: { id: post.threadId },
        data: { replyCount: { decrement: 1 } },
      });
    }
  },

  async toggleLike(postId: string, userId: string) {
    const existing = await prisma.forumPostLike.findUnique({ where: { postId_userId: { postId, userId } } });
    if (existing) {
      await prisma.forumPostLike.delete({ where: { id: existing.id } });
      await prisma.forumPost.update({ where: { id: postId }, data: { upvotes: { decrement: 1 } } });
      return { liked: false };
    } else {
      await prisma.forumPostLike.create({ data: { postId, userId } });
      await prisma.forumPost.update({ where: { id: postId }, data: { upvotes: { increment: 1 } } });
      return { liked: true };
    }
  },

  async markAnswer(postId: string, threadAuthorId: string, userId: string) {
    if (threadAuthorId !== userId) {
      throw Object.assign(new Error('Only the thread author can mark an answer'), { statusCode: 403 });
    }
    const post = await prisma.forumPost.findUniqueOrThrow({ where: { id: postId } });
    // Unmark existing answer
    await prisma.forumPost.updateMany({
      where: { threadId: post.threadId, isAnswer: true },
      data: { isAnswer: false },
    });
    return prisma.forumPost.update({ where: { id: postId }, data: { isAnswer: true } });
  },

  async pinThread(threadId: string, adminId: string) {
    const thread = await prisma.forumThread.findUniqueOrThrow({ where: { id: threadId } });
    return prisma.forumThread.update({ where: { id: threadId }, data: { isPinned: !thread.isPinned } });
  },

  async lockThread(threadId: string, adminId: string) {
    const thread = await prisma.forumThread.findUniqueOrThrow({ where: { id: threadId } });
    return prisma.forumThread.update({ where: { id: threadId }, data: { isLocked: !thread.isLocked } });
  },

  async getDefaultForum() {
    return prisma.forum.findFirst({ where: { isDefault: true } });
  },

  async ensureDefaultForum(courseId?: string) {
    const existing = await prisma.forum.findFirst({
      where: courseId ? { courseId } : { isDefault: true },
    });
    if (existing) return existing;
    return prisma.forum.create({
      data: {
        name: courseId ? 'Course Discussion' : 'General Community',
        slug: courseId ? `course-${courseId}` : 'general',
        description: 'Ask questions, share ideas, and connect with fellow learners.',
        isDefault: !courseId,
        courseId: courseId ?? null,
      },
    });
  },
};
