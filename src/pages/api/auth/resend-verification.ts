import type { APIRoute } from 'astro';
import { db } from '../../../db/index';
import { users, emailVerifications } from '../../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { generateVerificationCode, VERIFICATION_EXPIRY_MS } from '../../../lib/auth/tokens';
import { sendVerificationEmail } from '../../../lib/auth/email';
import type { Locale } from '../../../lib/i18n/index';

export const POST: APIRoute = async ({ request, locals }) => {
  const formData = await request.formData();
  const userId = formData.get('userId') as string;
  const lang = (locals.lang ?? 'en') as Locale;

  if (!userId) {
    return new Response('Missing userId', { status: 400 });
  }

  const user = db.select().from(users).where(eq(users.id, userId)).get();
  if (!user || user.isVerified) {
    return new Response('Invalid request', { status: 400 });
  }

  // Rate limit: 60 seconds between resends
  const last = db
    .select()
    .from(emailVerifications)
    .where(eq(emailVerifications.userId, userId))
    .orderBy(desc(emailVerifications.createdAt))
    .get();

  if (last && Date.now() - last.createdAt.getTime() < 60000) {
    return new Response('Please wait before requesting another code', { status: 429 });
  }

  const code = generateVerificationCode();
  db.insert(emailVerifications).values({
    userId,
    code,
    expiresAt: new Date(Date.now() + VERIFICATION_EXPIRY_MS),
  }).run();

  await sendVerificationEmail(user.email, code, lang);

  return new Response('Code sent', { status: 200 });
};
