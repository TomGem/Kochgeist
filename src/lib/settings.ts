import { db } from '../db/index';
import { settings } from '../db/schema';
import { eq } from 'drizzle-orm';

export function getSetting(key: string): string | null {
  const row = db.select().from(settings).where(eq(settings.key, key)).get();
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  const existing = db.select().from(settings).where(eq(settings.key, key)).get();
  if (existing) {
    db.update(settings)
      .set({ value, updatedAt: new Date() })
      .where(eq(settings.key, key))
      .run();
  } else {
    db.insert(settings).values({ key, value }).run();
  }
}

export function deleteSetting(key: string): void {
  db.delete(settings).where(eq(settings.key, key)).run();
}
