import { Resend } from 'resend';
import VendorInvitationEmail from '@/components/emails/VendorInvitationEmail';

// Initialize Resend with a fallback to prevent build errors
const resend = new Resend(process.env.RESEND_API_KEY || 'dummy-key-for-build');

interface SendVendorInvitationParams {
  vendorName: string;
  vendorEmail: string;
  coordinatorName: string;
  coordinatorCompany?: string;
  coordinatorEmail: string;
  weddingDetails: {
    coupleName: string;
    weddingDate: string;
    venue?: string;
  };
  role: string;
  invitationUrl: string;
  message?: string;
}

export async function sendVendorInvitation({
  vendorName,
  vendorEmail,
  coordinatorName,
  coordinatorCompany,
  coordinatorEmail,
  weddingDetails,
  role,
  invitationUrl,
  message
}: SendVendorInvitationParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'TipWedding <onboarding@resend.dev>', // Using Resend's default domain for testing
      to: [vendorEmail],
      subject: `Wedding Vendor Invitation - ${weddingDetails.coupleName}`,
      react: VendorInvitationEmail({
        vendorName,
        coordinatorName,
        coordinatorCompany,
        coordinatorEmail,
        weddingDetails,
        role,
        invitationUrl,
        message
      }),
      // Fallback HTML for email clients that don't support React
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #8B5CF6; margin: 0;">TipWedding</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Professional Wedding Services</p>
          </div>
          
          <div style="background: #F3F4F6; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
            <h2 style="color: #333; margin: 0 0 15px 0;">You've Been Invited!</h2>
            <p style="color: #666; margin: 0;">Hi ${vendorName},</p>
            <p style="color: #666;">You've been invited by ${coordinatorName} to join the vendor team for <strong>${weddingDetails.coupleName}'s wedding</strong>.</p>
          </div>
          
          <div style="margin-bottom: 25px;">
            <h3 style="color: #333; margin: 0 0 15px 0;">Wedding Details</h3>
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;"><strong>Couple:</strong> ${weddingDetails.coupleName}</li>
              <li style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;"><strong>Date:</strong> ${new Date(weddingDetails.weddingDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</li>
              ${weddingDetails.venue ? `<li style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;"><strong>Venue:</strong> ${weddingDetails.venue}</li>` : ''}
              <li style="padding: 8px 0;"><strong>Your Role:</strong> ${role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</li>
            </ul>
          </div>
          
          ${message ? `
          <div style="background: #EFF6FF; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #1E40AF; margin: 0 0 10px 0;">Message from ${coordinatorName}:</h3>
            <p style="color: #1E40AF; margin: 0; font-style: italic;">"${message}"</p>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" style="background: #8B5CF6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Complete Registration</a>
          </div>
          
          <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; margin-top: 30px;">
            <h3 style="color: #333; margin: 0 0 15px 0;">What's Next?</h3>
            <ol style="color: #666; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Click the registration button above</li>
              <li style="margin-bottom: 8px;">Complete your vendor profile with payment information</li>
              <li style="margin-bottom: 8px;">Your profile will be added to this wedding</li>
              <li>The couple will be able to tip you through the platform</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              Invited by: ${coordinatorName}${coordinatorCompany ? ` (${coordinatorCompany})` : ''}<br>
              Contact: <a href="mailto:${coordinatorEmail}" style="color: #8B5CF6;">${coordinatorEmail}</a>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This invitation will expire in 7 days. If you have any questions, please contact the coordinator directly.
            </p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('Error sending vendor invitation email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('Vendor invitation email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error in sendVendorInvitation:', error);
    throw error;
  }
}
