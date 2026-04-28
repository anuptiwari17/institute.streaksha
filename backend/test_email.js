require('dotenv').config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function test() {
  const result = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: 'anuptiwari050@gmail.com',
    subject: 'Test from Streaksha',
    html: '<h1>It works</h1>',
  });
  console.log(result);
}

test();