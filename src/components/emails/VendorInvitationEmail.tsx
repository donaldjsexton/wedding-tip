import React from 'react';

interface VendorInvitationEmailProps {
  vendorName: string;
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

export default function VendorInvitationEmail({
  vendorName,
  coordinatorName,
  coordinatorCompany,
  coordinatorEmail,
  weddingDetails,
  role,
  invitationUrl,
  message
}: VendorInvitationEmailProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatRole = (role: string) => {
    return role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#8B5CF6', margin: '0', fontSize: '28px' }}>💍 TipWedding</h1>
        <p style={{ color: '#666', margin: '5px 0 0 0', fontSize: '14px' }}>Professional Wedding Services</p>
      </div>
      
      {/* Main Invitation */}
      <div style={{ 
        background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)', 
        padding: '25px', 
        borderRadius: '12px', 
        marginBottom: '25px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#333', margin: '0 0 15px 0', fontSize: '24px' }}>🎉 You&apos;ve Been Invited!</h2>
        <p style={{ color: '#666', margin: '0 0 10px 0', fontSize: '16px' }}>Hi <strong>{vendorName}</strong>,</p>
        <p style={{ color: '#666', fontSize: '16px', lineHeight: '1.5' }}>
          You&apos;ve been invited by <strong>{coordinatorName}</strong> to join the vendor team for 
          <br/><strong style={{ color: '#8B5CF6', fontSize: '18px' }}>{weddingDetails.coupleName}&apos;s Wedding</strong>
        </p>
      </div>
      
      {/* Wedding Details */}
      <div style={{ marginBottom: '25px' }}>
        <h3 style={{ color: '#333', margin: '0 0 15px 0', fontSize: '18px', borderBottom: '2px solid #8B5CF6', paddingBottom: '8px' }}>
          📅 Wedding Details
        </h3>
        <div style={{ background: '#FAFAFA', padding: '20px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', marginBottom: '12px', alignItems: 'center' }}>
            <span style={{ color: '#8B5CF6', marginRight: '10px', fontSize: '16px' }}>👫</span>
            <div>
              <strong style={{ color: '#333' }}>Couple:</strong>
              <span style={{ color: '#666', marginLeft: '8px' }}>{weddingDetails.coupleName}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', marginBottom: '12px', alignItems: 'center' }}>
            <span style={{ color: '#8B5CF6', marginRight: '10px', fontSize: '16px' }}>📅</span>
            <div>
              <strong style={{ color: '#333' }}>Date:</strong>
              <span style={{ color: '#666', marginLeft: '8px' }}>{formatDate(weddingDetails.weddingDate)}</span>
            </div>
          </div>
          
          {weddingDetails.venue && (
            <div style={{ display: 'flex', marginBottom: '12px', alignItems: 'center' }}>
              <span style={{ color: '#8B5CF6', marginRight: '10px', fontSize: '16px' }}>📍</span>
              <div>
                <strong style={{ color: '#333' }}>Venue:</strong>
                <span style={{ color: '#666', marginLeft: '8px' }}>{weddingDetails.venue}</span>
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ color: '#8B5CF6', marginRight: '10px', fontSize: '16px' }}>💼</span>
            <div>
              <strong style={{ color: '#333' }}>Your Role:</strong>
              <span style={{ color: '#8B5CF6', marginLeft: '8px', fontWeight: '600' }}>{formatRole(role)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Personal Message */}
      {message && (
        <div style={{ 
          background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', 
          padding: '20px', 
          borderRadius: '10px', 
          marginBottom: '25px',
          border: '1px solid #BFDBFE'
        }}>
          <h3 style={{ color: '#1E40AF', margin: '0 0 10px 0', fontSize: '16px', display: 'flex', alignItems: 'center' }}>
            💌 <span style={{ marginLeft: '8px' }}>Message from {coordinatorName}:</span>
          </h3>
          <p style={{ color: '#1E40AF', margin: '0', fontStyle: 'italic', fontSize: '15px', lineHeight: '1.4' }}>
            &quot;{message}&quot;
          </p>
        </div>
      )}
      
      {/* Call to Action */}
      <div style={{ textAlign: 'center', margin: '30px 0' }}>
        <a 
          href={invitationUrl} 
          style={{ 
            background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', 
            color: 'white', 
            padding: '16px 32px', 
            textDecoration: 'none', 
            borderRadius: '10px', 
            fontWeight: 'bold', 
            display: 'inline-block',
            fontSize: '16px',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
          }}
        >
          🚀 Complete Registration
        </a>
        <p style={{ color: '#666', fontSize: '13px', margin: '12px 0 0 0' }}>
          Click the button above to set up your vendor profile
        </p>
      </div>
      
      {/* Next Steps */}
      <div style={{ 
        borderTop: '2px solid #E5E7EB', 
        paddingTop: '20px', 
        marginTop: '30px',
        background: '#F9FAFB',
        padding: '20px',
        borderRadius: '8px'
      }}>
        <h3 style={{ color: '#333', margin: '0 0 15px 0', fontSize: '16px', display: 'flex', alignItems: 'center' }}>
          ✨ <span style={{ marginLeft: '8px' }}>What&apos;s Next?</span>
        </h3>
        <ol style={{ color: '#666', paddingLeft: '20px', margin: '0' }}>
          <li style={{ marginBottom: '8px', lineHeight: '1.4' }}>Click the registration button above</li>
          <li style={{ marginBottom: '8px', lineHeight: '1.4' }}>Complete your vendor profile with payment information</li>
          <li style={{ marginBottom: '8px', lineHeight: '1.4' }}>Your profile will be added to this wedding</li>
          <li style={{ lineHeight: '1.4' }}>The couple will be able to tip you through the platform</li>
        </ol>
      </div>
      
      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
        <p style={{ color: '#666', fontSize: '14px', margin: '0 0 10px 0' }}>
          <strong>Invited by:</strong> {coordinatorName}
          {coordinatorCompany && <span> ({coordinatorCompany})</span>}
        </p>
        <p style={{ color: '#666', fontSize: '14px', margin: '0' }}>
          <strong>Contact:</strong> <a href={`mailto:${coordinatorEmail}`} style={{ color: '#8B5CF6' }}>{coordinatorEmail}</a>
        </p>
      </div>
      
      {/* Disclaimer */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <p style={{ color: '#999', fontSize: '12px', margin: '0', lineHeight: '1.3' }}>
          ⏰ This invitation will expire in 7 days. If you have any questions, please contact the coordinator directly.
        </p>
      </div>
    </div>
  );
}
