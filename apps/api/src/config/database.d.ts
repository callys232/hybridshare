import { PrismaClient } from "@prisma/client";
export declare const prisma: any;
export declare function connectDatabase(): Promise<void>;
export declare function disconnectDatabase(): Promise<void>;
export declare function checkDatabaseHealth(): Promise<boolean>;
export declare function getPrisma(): PrismaClient;
//# sourceMappingURL=database.d.ts.map