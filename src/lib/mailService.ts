import nodemailer from 'nodemailer';
import { getSiteConfigWithSecretsDB, logCorreoEnviadoDB } from '@/lib/db';
import { CorreoEnviado } from '@/types';

export interface SendMailInput {
  remitente?: string;
  destinatarios: string[];
  asunto: string;
  cuerpo: string;
  html?: string;
  enviadoPor: string;
}

export async function sendZohoMail(input: SendMailInput): Promise<CorreoEnviado> {
  const { config, smtpPass } = await getSiteConfigWithSecretsDB();

  const host = config.zohoSmtpHost || process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com';
  const port = Number(config.zohoSmtpPort || process.env.ZOHO_SMTP_PORT || 465);
  const authUser = config.zohoSmtpUser || process.env.ZOHO_SMTP_USER || config.emailGeneral;
  const authPass = smtpPass || process.env.ZOHO_SMTP_PASS || '';
  const remitente = input.remitente || authUser || 'lalibertadavanza@llabrown.com.ar';

  const cleanRecipients = input.destinatarios
    .map((d) => d.trim().toLowerCase())
    .filter((d) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d));

  if (cleanRecipients.length === 0) {
    throw new Error('No hay destinatarios con formato de correo válido.');
  }

  const recordBase: CorreoEnviado = {
    id: `mail-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    remitente,
    destinatarios: cleanRecipients,
    asunto: input.asunto.trim(),
    cuerpo: input.cuerpo.trim(),
    estado: 'simulado',
    enviadoPor: input.enviadoPor,
    createdAt: new Date().toISOString(),
  };

  if (!authUser || !authPass) {
    recordBase.estado = 'simulado';
    recordBase.errorDetalle =
      'SMTP de Zoho pendiente de configurar (falta Contraseña de Aplicación de Zoho Mail en Panel → Correos Zoho). El correo quedó respaldado en base de datos.';
    await logCorreoEnviadoDB(recordBase);
    return recordBase;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user: authUser,
        pass: authPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });

    const htmlBody =
      input.html ||
      `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #371859; color: #ffffff; padding: 20px 24px;">
          <strong style="font-size: 16px;">La Libertad Avanza · Almirante Brown</strong>
          <div style="font-size: 12px; color: #39b5e6; margin-top: 4px;">Comunicación Institucional Oficial</div>
        </div>
        <div style="padding: 24px; color: #1d1d1d; font-size: 14px; line-height: 1.65; white-space: pre-wrap;">${input.cuerpo
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')}</div>
        <div style="background: #f5f4f8; padding: 14px 24px; font-size: 12px; color: #475569; border-top: 1px solid #e2e8f0;">
          Sede Central: ${config.sedeDireccion} · WhatsApp: ${config.whatsappDisplay} · <a href="https://www.llabrown.com.ar" style="color: #371859; font-weight: bold;">www.llabrown.com.ar</a>
        </div>
      </div>`;

    await transporter.sendMail({
      from: `"La Libertad Avanza Almirante Brown" <${authUser}>`,
      replyTo: remitente,
      to: cleanRecipients.length === 1 ? cleanRecipients[0] : authUser,
      bcc: cleanRecipients.length > 1 ? cleanRecipients : undefined,
      subject: input.asunto.trim(),
      text: input.cuerpo.trim(),
      html: htmlBody,
    });

    recordBase.estado = 'enviado';
  } catch (err) {
    recordBase.estado = 'error';
    recordBase.errorDetalle = (err as Error).message || 'Error conectando con Zoho SMTP';
  }

  await logCorreoEnviadoDB(recordBase);
  return recordBase;
}

export async function verifyZohoSmtpConnection(): Promise<{ ok: boolean; message: string }> {
  const { config, smtpPass } = await getSiteConfigWithSecretsDB();
  const host = config.zohoSmtpHost || process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com';
  const port = Number(config.zohoSmtpPort || process.env.ZOHO_SMTP_PORT || 465);
  const authUser = config.zohoSmtpUser || process.env.ZOHO_SMTP_USER || '';
  const authPass = smtpPass || process.env.ZOHO_SMTP_PASS || '';

  if (!authUser || !authPass) {
    return {
      ok: false,
      message: 'Cargá tu usuario Zoho y la Contraseña de Aplicación SMTP antes de probar la conexión.',
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user: authUser, pass: authPass },
      connectionTimeout: 8000,
    });
    await transporter.verify();
    return { ok: true, message: `Conexión SMTP verificada con ${host}:${port} (${authUser}).` };
  } catch (err) {
    return { ok: false, message: `Error SMTP Zoho: ${(err as Error).message}` };
  }
}
