import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  constructor() {
    this.resend = null;
    this.init();
  }

  init() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey && apiKey.trim()) {
      this.resend = new Resend(apiKey.trim());
      console.log('⚡ Resend Email Service initialized successfully!');
    } else {
      console.log('ℹ️ RESEND_API_KEY not configured. Welcome emails will run in simulation mode.');
    }
  }

  async sendWelcomeEmail(toEmail, userName) {
    const subject = `Welcome to sPLIT, ${userName}! 🎉`;
    const appUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FBFBFA; margin: 0; padding: 30px 10px; color: #18181b; }
          .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e4e4e7; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
          .header { background: #18181b; padding: 28px 24px; text-align: center; }
          .logo { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
          .logo span { color: #10b981; }
          .content { padding: 32px 28px; line-height: 1.6; }
          h1 { font-size: 20px; font-weight: 700; color: #18181b; margin-top: 0; }
          p { font-size: 14px; color: #52525b; margin: 12px 0; }
          .feature-box { background: #f4f4f5; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px; color: #3f3f46; }
          .feature-item { margin: 8px 0; }
          .btn-container { text-align: center; margin: 28px 0 16px; }
          .btn { background: #10b981; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 14px; display: inline-block; }
          .footer { border-top: 1px solid #f4f4f5; padding: 20px 28px; text-align: center; font-size: 12px; color: #a1a1aa; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">sP<span>LIT</span></div>
          </div>
          <div class="content">
            <h1>Welcome aboard, ${userName}! 🚀</h1>
            <p>Your sPLIT account is officially ready. You can now easily track personal spending, create group expenses with friends, and settle debts with zero stress.</p>
            
            <div class="feature-box">
              <div class="feature-item">✨ <strong>Smart Debt Simplification:</strong> Minimizes cross-payments so friends settle debts in the fewest possible transfers.</div>
              <div class="feature-item">🔗 <strong>1-Click Group Invites:</strong> Share custom invite links via WhatsApp or Instagram.</div>
              <div class="feature-item">⚡ <strong>Real-time Balances:</strong> Powered by Cloud PostgreSQL & Redis.</div>
            </div>

            <div class="btn-container">
              <a href="${appUrl}" class="btn">Open Your Dashboard</a>
            </div>
          </div>
          <div class="footer">
            © 2026 sPLIT Expense Tracker • Built for smart group settlements
          </div>
        </div>
      </body>
      </html>
    `;

    if (this.resend) {
      try {
        const { data, error } = await this.resend.emails.send({
          from: 'sPLIT App <onboarding@resend.dev>',
          to: [toEmail],
          subject,
          html: htmlContent
        });

        if (error) {
          console.warn(`⚠️ Resend notice for ${toEmail}:`, error.message);
          return { success: false, error: error.message };
        }

        console.log(`✉️ Real welcome email delivered via Resend to ${toEmail}! Email ID: ${data?.id}`);
        return { success: true, emailId: data?.id };
      } catch (err) {
        console.warn(`❌ Resend send error for ${toEmail}:`, err.message);
        return { success: false, error: err.message };
      }
    } else {
      console.log(`\n========================================`);
      console.log(`✉️ [SIMULATED WELCOME EMAIL]`);
      console.log(`To: ${toEmail}`);
      console.log(`Subject: ${subject}`);
      console.log(`========================================\n`);
      return { success: true, simulated: true };
    }
  }
}

export default new EmailService();
