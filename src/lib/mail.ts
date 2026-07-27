import nodemailer from "nodemailer";

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  name: string
) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.warn(
      "[Email] GMAIL_USER / GMAIL_APP_PASSWORD no configurados. Enlace de recuperación:",
      resetUrl
    );
    return { ok: true, preview: resetUrl, mocked: true as const };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"ArcadaLab" <${user}>`,
    to,
    subject: "Recuperación de contraseña — ArcadaLab",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Hola ${name},</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p><a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#1A5F7A;color:#fff;text-decoration:none;border-radius:8px">Restablecer contraseña</a></p>
        <p style="color:#666;font-size:13px">Este enlace expira en 1 hora. Si no solicitaste esto, ignora este correo.</p>
      </div>
    `,
  });

  return { ok: true, mocked: false as const };
}
