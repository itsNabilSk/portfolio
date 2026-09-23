import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

// Simple HTML escaping helper for email safety
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const POST: APIRoute = async ({ request }) => {
  try {
    let name = '';
    let email = '';
    let opportunityType = '';
    let message = '';
    let honeypot = '';

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await request.json().catch(() => ({}));
      name = String(data.name || '').trim();
      email = String(data.email || '').trim();
      opportunityType = String(data.opportunityType || data.subject || '').trim();
      message = String(data.message || '').trim();
      honeypot = String(data.hp_company || data.website || data._hp || '').trim();
    } else {
      const formData = await request.formData().catch(() => new FormData());
      name = String(formData.get('name') || '').trim();
      email = String(formData.get('email') || '').trim();
      opportunityType = String(formData.get('opportunityType') || formData.get('subject') || '').trim();
      message = String(formData.get('message') || '').trim();
      honeypot = String(formData.get('hp_company') || formData.get('website') || formData.get('_hp') || '').trim();
    }

    // 1. Honeypot check (silently trap spam bots)
    if (honeypot.length > 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Message received successfully.',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. Server-side validation
    if (!name || name.length < 2) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Please provide your name or organization (minimum 2 characters).',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (name.length > 120) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Name is too long (maximum 120 characters).',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Please provide a valid email address.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (email.length > 150) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email address is too long (maximum 150 characters).',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!message || message.length < 10) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Please provide your project requirements or role details (minimum 10 characters).',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (message.length > 4000) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Message is too long (maximum 4000 characters).',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const cleanOpportunity = opportunityType || 'General Engineering Inquiry';

    // 3. Check Resend API Key
    const resendApiKey = process.env.RESEND_API_KEY;
    const recipientEmail = process.env.CONTACT_EMAIL || 'mohammednabilshaikhwork@gmail.com';
    const senderEmail = process.env.RESEND_FROM_EMAIL || 'Nabil Shaikh Portfolio <onboarding@resend.dev>';

    if (!resendApiKey) {
      console.warn('[Contact API] RESEND_API_KEY is not configured in environment variables.');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email delivery service is currently not configured with RESEND_API_KEY. Please contact directly via direct email.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 4. Send Email via Resend
    const resend = new Resend(resendApiKey);

    const textContent = `NEW PORTFOLIO INQUIRY\n\nName / Organization:\n${name}\n\nEmail:\n${email}\n\nOpportunity Type:\n${cleanOpportunity}\n\nProject Requirements / Role Details:\n${message}\n\nSubmitted from:\nNabil Shaikh Portfolio`;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; background-color: #faf9f6; border: 1px solid #e5e0d8; border-radius: 8px;">
        <div style="border-bottom: 2px solid #881337; padding-bottom: 12px; margin-bottom: 20px;">
          <span style="font-size: 11px; font-family: monospace; letter-spacing: 1.5px; color: #881337; font-weight: bold; text-transform: uppercase;">TRANSMISSION RECEIVED</span>
          <h2 style="margin: 6px 0 0 0; font-size: 20px; color: #111;">New Portfolio Inquiry</h2>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #666; width: 140px; font-weight: 500;">Name / Organization:</td>
            <td style="padding: 8px 0; font-weight: 600; color: #111;">${escapeHtml(name)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: 500;">Email:</td>
            <td style="padding: 8px 0;"><a href="mailto:${escapeHtml(email)}" style="color: #881337; text-decoration: none; font-weight: 600;">${escapeHtml(email)}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: 500;">Opportunity Type:</td>
            <td style="padding: 8px 0; color: #111;">${escapeHtml(cleanOpportunity)}</td>
          </tr>
        </table>

        <div style="background-color: #ffffff; border: 1px solid #e5e0d8; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
          <div style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #881337; margin-bottom: 8px; font-weight: bold;">Project Requirements / Role Details:</div>
          <p style="margin: 0; white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #222;">${escapeHtml(message)}</p>
        </div>

        <div style="border-top: 1px solid #e5e0d8; padding-top: 14px; font-size: 12px; color: #888; font-family: monospace;">
          Submitted from: <strong>Nabil Shaikh Portfolio</strong> · Reply-To: ${escapeHtml(email)}
        </div>
      </div>
    `;

    const { data: sendData, error: sendError } = await resend.emails.send({
      from: senderEmail,
      to: [recipientEmail],
      replyTo: email, // Direct reply to the visitor who submitted the form
      subject: `New Portfolio Inquiry — ${name}`,
      text: textContent,
      html: htmlContent,
    });

    if (sendError) {
      console.error('[Contact API] Resend error:', sendError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Something went wrong while sending your message. Please try again or email me directly.',
          details: sendError.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Message received successfully.',
        id: sendData?.id,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('[Contact API] Unexpected error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Unable to process your request at this moment. Please try again later or reach out via direct email.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const ALL: APIRoute = async () => {
  return new Response(
    JSON.stringify({ error: 'Method not allowed. Use POST /api/contact.' }),
    {
      status: 405,
      headers: { 'Content-Type': 'application/json', Allow: 'POST' },
    }
  );
};
