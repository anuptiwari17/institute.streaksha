const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const sendOtpEmail = async (to, otp) => {
  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Your Streaksha OTP',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="font-size:24px;font-weight:900;margin-bottom:8px">Streaksha</h2>
        <p style="color:#666;margin-bottom:24px">Your one-time password</p>
        <div style="background:#f4f4f4;border-radius:12px;padding:24px;text-align:center">
          <span style="font-size:40px;font-weight:900;letter-spacing:8px">${otp}</span>
        </div>
        <p style="color:#999;font-size:12px;margin-top:24px">Expires in 10 minutes. Do not share this.</p>
      </div>
    `,
  });
};

const sendCredentialsEmail = async (to, { name, email, password, instituteName }) => {
  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Your Streaksha login credentials — ${instituteName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="font-size:24px;font-weight:900;margin-bottom:8px">Streaksha</h2>
        <p style="color:#666;margin-bottom:24px">Hi ${name}, your account is ready.</p>
        <div style="background:#f4f4f4;border-radius:12px;padding:24px">
          <p style="margin:0 0 8px"><strong>Institute:</strong> ${instituteName}</p>
          <p style="margin:0 0 8px"><strong>Email:</strong> ${email}</p>
          <p style="margin:0"><strong>Password:</strong> ${password}</p>
        </div>
        <p style="color:#999;font-size:12px;margin-top:24px">Login at streaksha.com and change your password after first login.</p>
      </div>
    `,
  });
};

module.exports = { sendOtpEmail, sendCredentialsEmail };