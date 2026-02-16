import { MailService } from '@sendgrid/mail';

let mailService: MailService | null = null;

if (process.env.SENDGRID_API_KEY) {
  mailService = new MailService();
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn("Warning: SENDGRID_API_KEY not configured. Email functionality will be disabled.");
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!mailService) {
    console.warn('Email sending skipped: SendGrid not configured');
    return false;
  }
  
  console.log('=== SENDGRID EMAIL DEBUG ===');
  console.log('Attempting to send email with params:');
  console.log('- To:', params.to);
  console.log('- From:', params.from);
  console.log('- Subject:', params.subject);
  console.log('- API Key configured:', !!process.env.SENDGRID_API_KEY);
  console.log('- FROM_EMAIL configured:', !!process.env.FROM_EMAIL);
  
  try {
    const emailData = {
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text || '',
      html: params.html || '',
    };
    
    console.log('Sending email with SendGrid...');
    const result = await mailService.send(emailData);
    console.log('SendGrid response:', result);
    console.log('EMAIL SENT SUCCESSFULLY!');
    console.log('=== END SENDGRID EMAIL DEBUG ===');
    return true;
  } catch (error: any) {
    console.error('=== SENDGRID EMAIL ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error response:', error.response?.body);
    if (error.response?.body?.errors) {
      console.error('Detailed errors:', JSON.stringify(error.response.body.errors, null, 2));
    }
    console.error('Full error object:', error);
    console.error('=== END SENDGRID EMAIL ERROR ===');
    return false;
  }
}

// Employee invitation email template
export function generateInvitationEmail(
  firstName: string, 
  lastName: string, 
  invitationToken: string, 
  companyName: string = "HR Connect"
): EmailParams {
  const baseUrl = process.env.REPLIT_DOMAINS || 'http://localhost:5000';
  const invitationUrl = `${baseUrl}/invitation/${invitationToken}`;
  
  return {
    to: '', // Will be set by the caller
    from: (process.env.FROM_EMAIL as string) || 'noreply@test.com', 
    subject: `Welcome to ${companyName} - Complete Your Account Setup`,
    text: `Hi ${firstName},

Welcome to ${companyName}! You've been invited to join our team.

Please click the link below to complete your account setup:
${invitationUrl}

This invitation will expire in 7 days.

If you have any questions, please contact your HR department.

Best regards,
${companyName} HR Team`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${companyName}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Logo and Company Branding -->
          <div style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%); color: white; padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
            <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%; z-index: 1;"></div>
            <div style="position: absolute; bottom: -30px; left: -30px; width: 60px; height: 60px; background: rgba(255,255,255,0.1); border-radius: 50%; z-index: 1;"></div>
            
            <div style="position: relative; z-index: 2;">
              <div style="background: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                <div style="font-size: 32px; font-weight: bold;">🏢</div>
              </div>
              <h1 style="margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Welcome to ${companyName}</h1>
              <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.95; font-weight: 300;">You're invited to join our professional team</p>
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 50px 40px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h2 style="color: #1e293b; margin: 0 0 15px 0; font-size: 28px; font-weight: 600;">Hi ${firstName}! 👋</h2>
              <p style="color: #64748b; font-size: 18px; line-height: 1.6; margin: 0;">
                Congratulations! You've been selected to join <strong style="color: #2563eb;">${companyName}</strong>.<br>
                We're thrilled to welcome you to our team.
              </p>
            </div>
            
            <!-- Professional CTA Section -->
            <div style="text-align: center; margin: 50px 0;">
              <div style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); padding: 30px; border-radius: 15px; border: 1px solid #e2e8f0; margin-bottom: 25px;">
                <h3 style="color: #334155; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">Ready to Get Started?</h3>
                <p style="color: #64748b; margin: 0 0 25px 0; font-size: 16px;">Click the button below to create your account and join the team</p>
                
                <a href="${invitationUrl}" style="
                  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
                  color: white;
                  text-decoration: none;
                  padding: 18px 40px;
                  border-radius: 8px;
                  font-size: 18px;
                  font-weight: 600;
                  display: inline-block;
                  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
                  transition: all 0.3s ease;
                  letter-spacing: 0.5px;
                  border: none;
                ">
                  🚀 Complete Account Setup
                </a>
              </div>
            </div>
            
            <!-- Process Steps -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 30px; border-radius: 15px; margin: 40px 0; border: 1px solid #fbbf24;">
              <h3 style="color: #92400e; margin: 0 0 20px 0; font-size: 20px; font-weight: 600; text-align: center;">📋 Quick Setup Process</h3>
              <div style="display: grid; gap: 15px;">
                <div style="display: flex; align-items: center; gap: 15px;">
                  <div style="background: #f59e0b; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">1</div>
                  <span style="color: #92400e; font-weight: 500;">Click the "Complete Account Setup" button</span>
                </div>
                <div style="display: flex; align-items: center; gap: 15px;">
                  <div style="background: #f59e0b; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">2</div>
                  <span style="color: #92400e; font-weight: 500;">Create your secure password</span>
                </div>
                <div style="display: flex; align-items: center; gap: 15px;">
                  <div style="background: #f59e0b; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">3</div>
                  <span style="color: #92400e; font-weight: 500;">Complete your profile information</span>
                </div>
                <div style="display: flex; align-items: center; gap: 15px;">
                  <div style="background: #10b981; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">✓</div>
                  <span style="color: #92400e; font-weight: 500;">Start accessing your employee portal</span>
                </div>
              </div>
            </div>
            
            <!-- Important Information -->
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 25px; margin: 30px 0;">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                <div style="font-size: 20px;">⚠️</div>
                <h4 style="color: #dc2626; margin: 0; font-size: 18px; font-weight: 600;">Important Information</h4>
              </div>
              <ul style="color: #991b1b; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li style="margin-bottom: 8px;">This invitation expires in <strong>7 days</strong></li>
                <li style="margin-bottom: 8px;">Complete your setup as soon as possible to avoid delays</li>
                <li>Contact HR if you encounter any issues during setup</li>
              </ul>
            </div>
            
            <!-- Support Section -->
            <div style="text-align: center; margin: 40px 0;">
              <div style="background: #f8fafc; padding: 25px; border-radius: 10px; border: 1px solid #e2e8f0;">
                <h4 style="color: #334155; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">Need Help? 🤝</h4>
                <p style="color: #64748b; margin: 0; font-size: 16px; line-height: 1.6;">
                  Our HR team is here to assist you with any questions or technical support you may need during the setup process.
                </p>
              </div>
            </div>
            
            <!-- Professional Closing -->
            <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
                We look forward to working with you and welcome you to the ${companyName} family!
              </p>
              <p style="color: #334155; font-size: 16px; font-weight: 600; margin: 0;">
                Best regards,<br>
                <span style="color: #2563eb; font-weight: 700;">${companyName} HR Team</span>
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px; margin: 0 0 15px 0; line-height: 1.5;">
              If the button above doesn't work, you can copy and paste this link into your browser:
            </p>
            <a href="${invitationUrl}" style="color: #2563eb; font-size: 14px; word-break: break-all; text-decoration: underline;">${invitationUrl}</a>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} ${companyName}. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };
}

// Admin notification email template for employee invitations
export function generateAdminInvitationNotificationEmail(
  employeeDetails: { firstName: string; lastName: string; email: string },
  inviterDetails: { firstName: string; lastName: string; email: string; role: string },
  invitationDetails: { sentAt: Date; expiresAt: Date; invitationUrl: string },
  emailSent: boolean,
  companyName: string = "HR Connect"
): EmailParams {
  const sentAtFormatted = invitationDetails.sentAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const expiresAtFormatted = invitationDetails.expiresAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return {
    to: '', // Will be set by the caller
    from: (process.env.FROM_EMAIL as string) || 'noreply@test.com',
    subject: `New Employee Invitation Sent - ${employeeDetails.firstName} ${employeeDetails.lastName}`,
    text: `Hi Admin,

A new employee invitation has been sent by ${inviterDetails.firstName} ${inviterDetails.lastName}.

Employee Details:
- Name: ${employeeDetails.firstName} ${employeeDetails.lastName}
- Email: ${employeeDetails.email}

Invitation Details:
- Sent by: ${inviterDetails.firstName} ${inviterDetails.lastName} (${inviterDetails.role})
- Sent on: ${sentAtFormatted}
- Expires on: ${expiresAtFormatted}
- Status: ${emailSent ? 'Successfully sent' : 'Email delivery failed - please check SendGrid configuration'}

Invitation Link: ${invitationDetails.invitationUrl}

This is an automated notification from ${companyName}.`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Employee Invitation Notification - ${companyName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          * { box-sizing: border-box; }
          .email-container { max-width: 680px; margin: 0 auto; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
          .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
          .success-badge { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
          .error-badge { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
          .info-row { display: flex; align-items: flex-start; margin-bottom: 12px; }
          .info-label { min-width: 120px; font-weight: 500; color: #475569; font-size: 14px; }
          .info-value { color: #1e293b; font-size: 15px; flex: 1; }
          @media (max-width: 640px) {
            .info-row { flex-direction: column; }
            .info-label { margin-bottom: 4px; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); min-height: 100vh;">
        <div class="email-container" style="background: #ffffff; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border-radius: 12px; overflow: hidden; margin: 40px auto;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3730a3 50%, #1e3a8a 100%); color: white; padding: 50px 40px; text-align: center; position: relative; overflow: hidden;">
            <!-- Decorative elements -->
            <div style="position: absolute; top: -60px; right: -60px; width: 120px; height: 120px; background: rgba(255,255,255,0.08); border-radius: 50%; z-index: 1;"></div>
            <div style="position: absolute; bottom: -40px; left: -40px; width: 80px; height: 80px; background: rgba(255,255,255,0.06); border-radius: 50%; z-index: 1;"></div>
            <div style="position: absolute; top: 20px; left: 20px; width: 40px; height: 40px; background: rgba(255,255,255,0.05); border-radius: 50%; z-index: 1;"></div>
            
            <div style="position: relative; z-index: 2;">
              <!-- Company Logo/Icon -->
              <div style="background: rgba(255,255,255,0.15); width: 100px; height: 100px; border-radius: 20px; margin: 0 auto 25px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); border: 2px solid rgba(255,255,255,0.1);">
                <div style="font-size: 40px;">🏢</div>
              </div>
              
              <div style="background: rgba(255,255,255,0.1); padding: 8px 20px; border-radius: 25px; display: inline-block; margin-bottom: 20px;">
                <span style="font-size: 14px; font-weight: 500; opacity: 0.9;">ADMIN NOTIFICATION</span>
              </div>
              
              <h1 style="margin: 0 0 10px 0; font-size: 36px; font-weight: 700; letter-spacing: -1px; line-height: 1.2;">New Employee Invitation</h1>
              <p style="margin: 0; font-size: 18px; opacity: 0.9; font-weight: 400;">Team member invitation has been processed</p>
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 50px 40px;">
            
            <!-- Summary Alert -->
            <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 30px; border-radius: 16px; border-left: 5px solid #2563eb; margin-bottom: 35px; position: relative; overflow: hidden;">
              <div style="position: absolute; top: -20px; right: -20px; width: 60px; height: 60px; background: rgba(37, 99, 235, 0.1); border-radius: 50%;"></div>
              <div style="position: relative;">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                  <div style="background: #2563eb; color: white; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 16px;">📧</div>
                  <h2 style="color: #1e40af; margin: 0; font-size: 22px; font-weight: 700;">Invitation Summary</h2>
                </div>
                <p style="color: #1e40af; margin: 0; font-size: 16px; line-height: 1.7;">
                  <strong>${inviterDetails.firstName} ${inviterDetails.lastName}</strong> (${inviterDetails.role}) has sent an invitation to <strong>${employeeDetails.firstName} ${employeeDetails.lastName}</strong> to join the team.
                </p>
              </div>
            </div>
            
            <!-- Status Badge -->
            <div style="text-align: center; margin-bottom: 35px;">
              <span class="${emailSent ? 'success-badge' : 'error-badge'} status-badge">
                ${emailSent ? '✓ INVITATION SENT' : '⚠ DELIVERY FAILED'}
              </span>
            </div>
            
            <!-- Employee Details Card -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 30px; border-radius: 16px; margin-bottom: 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="display: flex; align-items: center; margin-bottom: 25px;">
                <div style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 18px;">👤</div>
                <h3 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 600;">New Employee Details</h3>
              </div>
              
              <div class="info-row">
                <div class="info-label">Full Name</div>
                <div class="info-value"><strong>${employeeDetails.firstName} ${employeeDetails.lastName}</strong></div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Email Address</div>
                <div class="info-value">
                  <a href="mailto:${employeeDetails.email}" style="color: #2563eb; text-decoration: none; font-weight: 500;">
                    ${employeeDetails.email}
                  </a>
                </div>
              </div>
            </div>
            
            <!-- Invitation Timeline Card -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 30px; border-radius: 16px; margin-bottom: 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="display: flex; align-items: center; margin-bottom: 25px;">
                <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 18px;">📋</div>
                <h3 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 600;">Invitation Timeline</h3>
              </div>
              
              <div class="info-row">
                <div class="info-label">Invited By</div>
                <div class="info-value">
                  <strong>${inviterDetails.firstName} ${inviterDetails.lastName}</strong>
                  <span style="background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 8px; font-weight: 500;">${inviterDetails.role}</span>
                </div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Sent On</div>
                <div class="info-value">${sentAtFormatted}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Expires On</div>
                <div class="info-value" style="color: #dc2626; font-weight: 500;">${expiresAtFormatted}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Delivery Status</div>
                <div class="info-value">
                  <span style="color: ${emailSent ? '#059669' : '#dc2626'}; font-weight: 600; display: flex; align-items: center;">
                    <span style="margin-right: 8px;">${emailSent ? '✅' : '❌'}</span>
                    ${emailSent ? 'Successfully delivered' : 'Delivery failed'}
                  </span>
                </div>
              </div>
            </div>
            
            ${!emailSent ? `
            <!-- Error Alert -->
            <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 2px solid #fca5a5; padding: 25px; border-radius: 16px; margin-bottom: 30px; position: relative; overflow: hidden;">
              <div style="position: absolute; top: -15px; right: -15px; width: 50px; height: 50px; background: rgba(239, 68, 68, 0.1); border-radius: 50%;"></div>
              <div style="position: relative;">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                  <div style="background: #dc2626; color: white; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 16px;">⚠️</div>
                  <h4 style="color: #dc2626; margin: 0; font-size: 18px; font-weight: 700;">Email Delivery Issue</h4>
                </div>
                <p style="color: #dc2626; margin: 0; font-size: 15px; line-height: 1.6;">
                  The invitation email to <strong>${employeeDetails.email}</strong> could not be delivered. Please verify the SendGrid configuration or contact the employee manually with the invitation link below.
                </p>
              </div>
            </div>
            ` : ''}
            
            <!-- Invitation Link Card -->
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #bbf7d0; padding: 25px; border-radius: 16px; text-align: center; margin-bottom: 40px; position: relative; overflow: hidden;">
              <div style="position: absolute; top: -20px; right: -20px; width: 60px; height: 60px; background: rgba(34, 197, 94, 0.1); border-radius: 50%;"></div>
              <div style="position: relative;">
                <div style="background: #22c55e; color: white; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 18px;">🔗</div>
                <h4 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px; font-weight: 700;">Invitation Access Link</h4>
                <p style="color: #166534; margin: 0 0 20px 0; font-size: 14px;">Direct link to the employee invitation page</p>
                <div style="background: white; padding: 15px 20px; border-radius: 10px; margin-bottom: 15px; border: 1px solid #bbf7d0;">
                  <a href="${invitationDetails.invitationUrl}" 
                     style="color: #059669; font-size: 13px; word-break: break-all; text-decoration: none; font-family: 'Monaco', 'Menlo', 'Consolas', monospace;">
                    ${invitationDetails.invitationUrl}
                  </a>
                </div>
                <p style="color: #065f46; margin: 0; font-size: 12px; opacity: 0.8;">
                  This link expires on ${expiresAtFormatted}
                </p>
              </div>
            </div>
            
            <!-- System Note -->
            <div style="background: #f8fafc; border-left: 4px solid #64748b; padding: 20px; border-radius: 10px; margin-bottom: 30px;">
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0; font-style: italic;">
                <strong>System Notification:</strong> This is an automated notification from the ${companyName} HR Management System. You are receiving this email because you have administrator privileges and have been configured to receive employee invitation notifications.
              </p>
            </div>
          </div>
          
          <!-- Professional Footer -->
          <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 40px; text-align: center; border-top: 1px solid #e2e8f0;">
            <div style="margin-bottom: 20px;">
              <div style="background: #475569; color: white; width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto; font-size: 20px;">🏢</div>
            </div>
            <p style="color: #64748b; font-size: 16px; margin: 0 0 10px 0; font-weight: 500;">
              ${companyName} HR Management System
            </p>
            <p style="color: #94a3b8; font-size: 13px; margin: 0 0 20px 0; line-height: 1.5;">
              Streamlining human resources management with modern technology
            </p>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} ${companyName}. All rights reserved. | Automated HR System Notification
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };
}

// Admin notification email template for completed employee registration
export function generateEmployeeRegistrationCompletionEmail(
  employeeDetails: { firstName: string; lastName: string; email: string; joinDate: Date },
  invitationDetails: { originalInviter: string; inviterRole: string; completedAt: Date },
  companyName: string = "HR Connect"
): EmailParams {
  const completedAtFormatted = invitationDetails.completedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const joinDateFormatted = employeeDetails.joinDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return {
    to: '', // Will be set by the caller
    from: (process.env.FROM_EMAIL as string) || 'noreply@test.com',
    subject: `✅ Employee Registration Complete - ${employeeDetails.firstName} ${employeeDetails.lastName}`,
    text: `Hi Admin,

${employeeDetails.firstName} ${employeeDetails.lastName} has successfully completed their account registration.

Employee Details:
- Name: ${employeeDetails.firstName} ${employeeDetails.lastName}
- Email: ${employeeDetails.email}
- Join Date: ${joinDateFormatted}

Registration Details:
- Completed on: ${completedAtFormatted}
- Originally invited by: ${invitationDetails.originalInviter} (${invitationDetails.inviterRole})

The employee can now access the ${companyName} system and begin their onboarding process.

This is an automated notification from ${companyName}.`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Employee Registration Complete - ${companyName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          * { box-sizing: border-box; }
          .email-container { max-width: 680px; margin: 0 auto; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
          .success-badge { display: inline-block; padding: 8px 20px; border-radius: 25px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
          .info-row { display: flex; align-items: flex-start; margin-bottom: 12px; }
          .info-label { min-width: 120px; font-weight: 500; color: #475569; font-size: 14px; }
          .info-value { color: #1e293b; font-size: 15px; flex: 1; }
          @media (max-width: 640px) {
            .info-row { flex-direction: column; }
            .info-label { margin-bottom: 4px; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); min-height: 100vh;">
        <div class="email-container" style="background: #ffffff; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border-radius: 12px; overflow: hidden; margin: 40px auto;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%); color: white; padding: 50px 40px; text-align: center; position: relative; overflow: hidden;">
            <!-- Decorative elements -->
            <div style="position: absolute; top: -60px; right: -60px; width: 120px; height: 120px; background: rgba(255,255,255,0.08); border-radius: 50%; z-index: 1;"></div>
            <div style="position: absolute; bottom: -40px; left: -40px; width: 80px; height: 80px; background: rgba(255,255,255,0.06); border-radius: 50%; z-index: 1;"></div>
            <div style="position: absolute; top: 20px; left: 20px; width: 40px; height: 40px; background: rgba(255,255,255,0.05); border-radius: 50%; z-index: 1;"></div>
            
            <div style="position: relative; z-index: 2;">
              <!-- Success Icon -->
              <div style="background: rgba(255,255,255,0.15); width: 100px; height: 100px; border-radius: 20px; margin: 0 auto 25px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); border: 2px solid rgba(255,255,255,0.1);">
                <div style="font-size: 40px;">✅</div>
              </div>
              
              <div style="background: rgba(255,255,255,0.1); padding: 8px 20px; border-radius: 25px; display: inline-block; margin-bottom: 20px;">
                <span style="font-size: 14px; font-weight: 500; opacity: 0.9;">REGISTRATION COMPLETE</span>
              </div>
              
              <h1 style="margin: 0 0 10px 0; font-size: 36px; font-weight: 700; letter-spacing: -1px; line-height: 1.2;">New Team Member Ready!</h1>
              <p style="margin: 0; font-size: 18px; opacity: 0.9; font-weight: 400;">Employee has successfully completed account setup</p>
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 50px 40px;">
            
            <!-- Success Alert -->
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 30px; border-radius: 16px; border-left: 5px solid #22c55e; margin-bottom: 35px; position: relative; overflow: hidden;">
              <div style="position: absolute; top: -20px; right: -20px; width: 60px; height: 60px; background: rgba(34, 197, 94, 0.1); border-radius: 50%;"></div>
              <div style="position: relative;">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                  <div style="background: #22c55e; color: white; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 16px;">🎉</div>
                  <h2 style="color: #166534; margin: 0; font-size: 22px; font-weight: 700;">Registration Successful</h2>
                </div>
                <p style="color: #166534; margin: 0; font-size: 16px; line-height: 1.7;">
                  <strong>${employeeDetails.firstName} ${employeeDetails.lastName}</strong> has successfully completed their account registration and is now ready to start their journey with the team.
                </p>
              </div>
            </div>
            
            <!-- Status Badge -->
            <div style="text-align: center; margin-bottom: 35px;">
              <span class="success-badge">✓ ACCOUNT ACTIVATED</span>
            </div>
            
            <!-- Employee Information Card -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 30px; border-radius: 16px; margin-bottom: 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="display: flex; align-items: center; margin-bottom: 25px;">
                <div style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 18px;">👤</div>
                <h3 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 600;">New Team Member Details</h3>
              </div>
              
              <div class="info-row">
                <div class="info-label">Full Name</div>
                <div class="info-value"><strong>${employeeDetails.firstName} ${employeeDetails.lastName}</strong></div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Email Address</div>
                <div class="info-value">
                  <a href="mailto:${employeeDetails.email}" style="color: #2563eb; text-decoration: none; font-weight: 500;">
                    ${employeeDetails.email}
                  </a>
                </div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Role</div>
                <div class="info-value">
                  <span style="background: #f1f5f9; color: #475569; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 500;">Employee</span>
                </div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Join Date</div>
                <div class="info-value" style="color: #059669; font-weight: 500;">${joinDateFormatted}</div>
              </div>
            </div>
            
            <!-- Registration Timeline Card -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 30px; border-radius: 16px; margin-bottom: 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="display: flex; align-items: center; margin-bottom: 25px;">
                <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 18px;">📋</div>
                <h3 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 600;">Registration Timeline</h3>
              </div>
              
              <div class="info-row">
                <div class="info-label">Originally Invited By</div>
                <div class="info-value">
                  <strong>${invitationDetails.originalInviter}</strong>
                  <span style="background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 8px; font-weight: 500;">${invitationDetails.inviterRole}</span>
                </div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Completed On</div>
                <div class="info-value">${completedAtFormatted}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Account Status</div>
                <div class="info-value">
                  <span style="color: #059669; font-weight: 600; display: flex; align-items: center;">
                    <span style="margin-right: 8px;">🟢</span>
                    Active and ready to use
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Next Steps Card -->
            <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1px solid #bfdbfe; padding: 25px; border-radius: 16px; margin-bottom: 40px; position: relative; overflow: hidden;">
              <div style="position: absolute; top: -20px; right: -20px; width: 60px; height: 60px; background: rgba(59, 130, 246, 0.1); border-radius: 50%;"></div>
              <div style="position: relative;">
                <div style="background: #3b82f6; color: white; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; font-size: 18px;">📝</div>
                <h4 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px; font-weight: 700;">Next Steps</h4>
                <ul style="color: #1e40af; margin: 0; font-size: 15px; line-height: 1.8; padding-left: 20px;">
                  <li>Employee can now log in to the HR system using their credentials</li>
                  <li>Complete profile setup and upload any required documents</li>
                  <li>Begin onboarding process and role-specific training</li>
                  <li>Access assigned resources and team communication channels</li>
                </ul>
              </div>
            </div>
            
            <!-- System Note -->
            <div style="background: #f8fafc; border-left: 4px solid #64748b; padding: 20px; border-radius: 10px; margin-bottom: 30px;">
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0; font-style: italic;">
                <strong>System Notification:</strong> This is an automated notification from the ${companyName} HR Management System. The employee account is now active and ready for use.
              </p>
            </div>
          </div>
          
          <!-- Professional Footer -->
          <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 40px; text-align: center; border-top: 1px solid #e2e8f0;">
            <div style="margin-bottom: 20px;">
              <div style="background: #059669; color: white; width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto; font-size: 20px;">🏢</div>
            </div>
            <p style="color: #64748b; font-size: 16px; margin: 0 0 10px 0; font-weight: 500;">
              ${companyName} HR Management System
            </p>
            <p style="color: #94a3b8; font-size: 13px; margin: 0 0 20px 0; line-height: 1.5;">
              Streamlining human resources management with modern technology
            </p>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} ${companyName}. All rights reserved. | Automated HR System Notification
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };
}