import { Resend } from 'resend';
import { env } from '../config/env.js';

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function settings() {
  if (!env.EMAIL_DELIVERY_ENABLED) return null;
  return {
    client: new Resend(env.RESEND_API_KEY),
    from: env.EMAIL_FROM,
    replyTo: env.EMAIL_REPLY_TO || undefined,
    recipient: env.CONTACT_RECIPIENT
  };
}

async function send(client, payload) {
  const { data, error } = await client.emails.send(payload);
  if (error) throw new Error(`Resend recusou o e-mail: ${error.message}`);
  return data;
}

export function contactTemplates(contact) {
  const name = escapeHtml(contact.name);
  const subject = escapeHtml(contact.subject);
  const message = escapeHtml(contact.message).replaceAll('\n', '<br>');
  return {
    notification: {
      subject: `[Faculdade Perto] ${contact.subject}`,
      text: `Nova mensagem de ${contact.name} (${contact.email})\n\nAssunto: ${contact.subject}\n\n${contact.message}`,
      html: `<h1>Nova mensagem</h1><p><strong>Nome:</strong> ${name}</p><p><strong>E-mail:</strong> ${escapeHtml(contact.email)}</p><p><strong>Assunto:</strong> ${subject}</p><p>${message}</p>`
    },
    confirmation: {
      subject: 'Recebemos sua mensagem — Faculdade Perto',
      text: `Olá, ${contact.name}. Recebemos sua mensagem sobre “${contact.subject}”. Nossa equipe fará a triagem e responderá pelo e-mail informado quando necessário.`,
      html: `<p>Olá, ${name}.</p><p>Recebemos sua mensagem sobre <strong>${subject}</strong>. Nossa equipe fará a triagem e responderá pelo e-mail informado quando necessário.</p>`
    }
  };
}

export async function sendContactEmails(contact) {
  const config = settings();
  if (!config) return { enabled: false, notificationId: null, confirmationId: null, confirmationError: null };

  const templates = contactTemplates(contact);
  const notification = await send(config.client, {
    from: config.from,
    to: [config.recipient],
    replyTo: contact.email,
    subject: templates.notification.subject,
    text: templates.notification.text,
    html: templates.notification.html
  });
  try {
    const confirmation = await send(config.client, {
      from: config.from,
      to: [contact.email],
      replyTo: config.replyTo,
      subject: templates.confirmation.subject,
      text: templates.confirmation.text,
      html: templates.confirmation.html
    });
    return {
      enabled: true,
      notificationId: notification?.id || null,
      confirmationId: confirmation?.id || null,
      confirmationError: null
    };
  } catch (error) {
    console.warn(JSON.stringify({ level: 'warn', event: 'contact_confirmation_pending', message: error.message }));
    return {
      enabled: true,
      notificationId: notification?.id || null,
      confirmationId: null,
      confirmationError: error.message
    };
  }
}
