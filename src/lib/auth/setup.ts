import { db } from '../../db/index';
import { users } from '../../db/schema';
import { count } from 'drizzle-orm';

export function isFirstUser(): boolean {
  const result = db.select({ count: count() }).from(users).get();
  return !result || result.count === 0;
}
