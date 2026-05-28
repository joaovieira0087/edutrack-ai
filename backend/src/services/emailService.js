const nodemailer = require('nodemailer');

// Configuração do transporte SMTP (Brevo ou Gmail)
// Fallback via console.log quando variáveis SMTP não estão configuradas
const createTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  // Se as variáveis SMTP não estiverem configuradas, retorna null (modo dev)
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('[EmailService] ⚠️  Variáveis SMTP não configuradas. Usando fallback via console.log.');
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT) || 587,
    secure: false, // STARTTLS (porta 587)
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

/**
 * Gera o template HTML do e-mail de recuperação de senha
 * @param {string} userName - Nome do usuário
 * @param {string} code - Código OTP de 4 dígitos
 * @returns {string} HTML formatado
 */
const buildResetEmailHTML = (userName, code) => {
  const digits = code.split('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperação de Senha — EduTrack AI</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <!-- Hack de Pré-Visualização (Anti-Preview Snippet) -->
  <div style="display: none; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; font-size: 1px;">
    Seu código de verificação da EduTrack AI chegou.
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; padding: 40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); overflow: hidden;">
          
          <!-- Header com fundo branco puro para fundir com a logo -->
          <tr>
            <td style="background-color: #ffffff; padding: 32px 40px 16px; text-align: center;">
              <img src="https://i.imgur.com/f3E22Wx.png" alt="EduTrack AI Logo" style="max-width: 160px; height: auto; display: block; margin: 0 auto; padding-top: 12px;" />
              <h2 style="color: #0f172a; font-size: 18px; font-weight: 700; margin: 16px 0 0 0; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">Recuperação de Acesso</h2>
            </td>
          </tr>

          <!-- Corpo do e-mail -->
          <tr>
            <td style="padding: 16px 40px 24px;">
              <p style="color: #1f2937; font-size: 16px; margin: 0 0 12px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">Olá, <strong>${userName || 'Estudante'}</strong>!</p>
              <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                Recebemos uma solicitação para redefinir a senha da sua conta. Use o código abaixo para prosseguir:
              </p>

              <!-- Código OTP com destaque visual premium -->
              <div style="text-align: center; margin: 0 0 24px 0;">
                <div style="display: inline-block; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 36px;">
                  <span style="font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #1e40af; font-family: sans-serif;">
                    ${digits.join('')}
                  </span>
                </div>
                <!-- Aviso de expiração refinado -->
                <p style="color: #6b7280; font-size: 12px; margin: 12px 0 0 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                  Este código é válido por 10 minutos.
                </p>
              </div>

              <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                Se você não solicitou a redefinição de senha, ignore este e-mail com segurança. Sua conta permanecerá intacta.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 28px; border-top: 1px solid #f1f5f9; background-color: #f9fafb;">
              <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0 0 4px 0;">
                © ${new Date().getFullYear()} EduTrack AI — Assistente Educacional Personalizado
              </p>
              <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0; font-weight: 600;">
                Equipe EduTrack AI
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * Envia o e-mail de recuperação de senha com o código OTP
 * @param {string} toEmail - E-mail do destinatário
 * @param {string} userName - Nome do usuário para personalização
 * @param {string} code - Código OTP de 4 dígitos
 */
const sendResetCodeEmail = async (toEmail, userName, code) => {
  const transporter = createTransporter();
  const fromAddress = process.env.SMTP_FROM || 'noreply@edutrack.app';

  const mailOptions = {
    from: `"EduTrack AI" <${fromAddress}>`,
    to: toEmail,
    subject: 'EduTrack AI — Código de Recuperação de Senha',
    html: buildResetEmailHTML(userName, code)
  };

  // Fallback: Se SMTP não configurado, loga no console (modo desenvolvimento)
  if (!transporter) {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║  📧 FALLBACK DE E-MAIL (SMTP não configurado)           ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║  Para: ${toEmail}`);
    console.log(`║  Usuário: ${userName || 'N/A'}`);
    console.log(`║  Código OTP: ${code}`);
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    return { success: true, fallback: true };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] ✅ E-mail enviado para ${toEmail} — MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] ❌ Falha ao enviar e-mail para ${toEmail}:`, error.message);
    // Em caso de falha SMTP, usa o fallback via console
    console.log(`[EmailService] 🔄 Fallback ativado — Código OTP para ${toEmail}: ${code}`);
    return { success: true, fallback: true, error: error.message };
  }
};

module.exports = { sendResetCodeEmail };
