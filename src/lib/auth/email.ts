import nodemailer from 'nodemailer';
import type { Locale } from '../i18n/index';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@kochgeist.app';
const APP_URL = process.env.APP_URL || 'http://localhost:4321';

const isConfigured = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

async function sendMail(to: string, subject: string, html: string): Promise<void> {
  if (transporter) {
    await transporter.sendMail({ from: SMTP_FROM, to, subject, html });
  } else {
    console.log(`\n[EMAIL] To: ${to}`);
    console.log(`[EMAIL] Subject: ${subject}`);
    console.log(`[EMAIL] Body:\n${html.replace(/<[^>]+>/g, '')}\n`);
  }
}

const verificationSubjects: Record<string, string> = {
  en: 'Your Kochgeist verification code',
  de: 'Dein Kochgeist-Bestätigungscode',
  fr: 'Votre code de vérification Kochgeist',
  it: 'Il tuo codice di verifica Kochgeist',
  es: 'Tu código de verificación de Kochgeist',
  pt: 'Seu código de verificação Kochgeist',
};

const resetSubjects: Record<string, string> = {
  en: 'Reset your Kochgeist password',
  de: 'Setze dein Kochgeist-Passwort zurück',
  fr: 'Réinitialisez votre mot de passe Kochgeist',
  it: 'Reimposta la tua password Kochgeist',
  es: 'Restablece tu contraseña de Kochgeist',
  pt: 'Redefina sua senha Kochgeist',
};

export async function sendVerificationEmail(to: string, code: string, locale: Locale): Promise<void> {
  const subject = verificationSubjects[locale] || verificationSubjects.en;
  const html = `
    <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h1 style="font-family: 'Plus Jakarta Sans', sans-serif; color: #a33700; font-size: 24px;">Kochgeist</h1>
      <p style="font-size: 16px; color: #333;">Your verification code:</p>
      <div style="background: #f7f6f3; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #a33700;">${code}</span>
      </div>
      <p style="font-size: 14px; color: #666;">This code expires in 15 minutes.</p>
    </div>
  `;
  await sendMail(to, subject, html);
}

export async function sendPasswordResetEmail(to: string, token: string, locale: Locale): Promise<void> {
  const subject = resetSubjects[locale] || resetSubjects.en;
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  const html = `
    <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h1 style="font-family: 'Plus Jakarta Sans', sans-serif; color: #a33700; font-size: 24px;">Kochgeist</h1>
      <p style="font-size: 16px; color: #333;">Click the link below to reset your password:</p>
      <div style="margin: 24px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: #a33700; color: white; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: bold;">${locale === 'de' ? 'Passwort zurücksetzen' : 'Reset Password'}</a>
      </div>
      <p style="font-size: 14px; color: #666;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    </div>
  `;
  await sendMail(to, subject, html);
}
