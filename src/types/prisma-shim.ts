/**
 * Recursive shim type for prisma query results.
 * Allows property access, array iteration, method calls — no @prisma/client needed.
 * Real types replace this once @prisma/client is installed and prisma generate is run.
 */

// A value that is simultaneously an object, array, and callable
export interface PrismaResult {
  // Callable (covers .map(), .reduce(), .filter(), .find() etc. returning PrismaResult)
  (...args: unknown[]): PrismaResult;
  // Index signature for property access (covers .id, ._sum, ._count, etc.)
  [k: string]: PrismaResult;
  // Explicit common methods to help inference
  toString(): string;
  valueOf(): unknown;
  [Symbol.iterator](): Iterator<PrismaResult>;
  [Symbol.toPrimitive](hint: string): string | number | boolean;
}

type DbResult  = Promise<PrismaResult>;
type ModelProxy = { [method: string]: (...args: unknown[]) => DbResult };

export type PrismaLike = {
  [model: string]: ModelProxy;
  $transaction: (ops: DbResult[]) => Promise<PrismaResult[]>;
  $connect:     () => DbResult;
  $disconnect:  () => DbResult;
};
