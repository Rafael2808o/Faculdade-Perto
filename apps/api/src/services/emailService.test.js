import { describe, expect, it } from 'vitest';
import { contactTemplates } from './emailService.js';

describe('e-mails transacionais', () => {
  it('escapa texto enviado pelo usuário antes de montar o HTML', () => {
    const templates = contactTemplates({ name: '<b>Nome</b>', email: 'pessoa@example.com', subject: 'Dúvida', message: '<script>alert(1)</script>' });
    expect(templates.notification.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(templates.notification.html).not.toContain('<script>');
  });
});
