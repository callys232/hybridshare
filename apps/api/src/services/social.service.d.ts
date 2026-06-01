import type { ShareComposerData } from '@hybridshare/shared/types/social';
import type { PaginationQuery } from '../utils/paginate';
export declare class SocialService {
    publishPost(userId: string, data: ShareComposerData): Promise<any>;
    publishNow(shareId: string, userId: string): Promise<any>;
    listPosts(userId: string, query: PaginationQuery): Promise<{
        items: any;
        meta: import("@hybridshare/shared/utils/format").PaginationMeta;
    }>;
    cancelPost(id: string, userId: string): Promise<void>;
    getPostAnalytics(postId: string, userId: string): Promise<any>;
}
export declare const socialService: SocialService;
//# sourceMappingURL=social.service.d.ts.map