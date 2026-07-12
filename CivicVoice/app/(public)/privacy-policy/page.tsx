import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy — CivicVoice",
  description: "Privacy policy for the CivicVoice platform.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="page-wrapper">
      <h1>Privacy Policy</h1>
      <p className="last-updated">Last Updated: June 28, 2026</p>

      <p>At CivicVoice, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. Please read this policy carefully.</p>

      <h2>1. Information We Collect</h2>

      <div className="policy-section">
        <h3>Account Information</h3>
        <p>When you sign up, we collect your phone number, email address, display name, and a securely hashed password. For officials, we also collect your Official ID.</p>
      </div>

      <div className="policy-section">
        <h3>Report Information</h3>
        <p>When you submit a report, we collect the issue title, description, category, priority, location coordinates (latitude/longitude), ward number, photos you upload, and the timestamp. If you choose to submit anonymously, your identity is not associated with the report.</p>
      </div>

      <div className="policy-section">
        <h3>Usage Data</h3>
        <p>We collect information about how you interact with the platform, including pages viewed, reports viewed, likes, comments, and search queries. This helps us improve the service.</p>
      </div>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li><strong>To provide and maintain the platform</strong> — processing reports, showing them on maps and feeds, and enabling officials to manage them.</li>
        <li><strong>To communicate with you</strong> — sending status updates on your reports and responding to your inquiries.</li>
        <li><strong>To improve our service</strong> — analyzing usage patterns to make CivicVoice better for everyone.</li>
        <li><strong>To ensure accountability</strong> — attributing resolution actions to specific officials for transparency.</li>
      </ul>

      <h2>3. Information Sharing</h2>
      <p>We do not sell, trade, or rent your personal information to third parties. We may share information only in the following circumstances:</p>
      <ul>
        <li><strong>Public Reports</strong> — Report details (title, description, location, status, and photos) are visible to all users on the public map and feed. Identity is hidden for anonymous reports.</li>
        <li><strong>Law Enforcement</strong> — If required by law or to protect rights and safety, we may disclose information to authorities.</li>
        <li><strong>Service Providers</strong> — We may engage trusted third-party services (e.g., hosting) that process data on our behalf under strict confidentiality agreements.</li>
      </ul>

      <h2>4. Data Storage &amp; Security</h2>
      <p>Your data is stored locally in your browser using localStorage. We implement appropriate technical measures to protect your information. However, no method of electronic storage is 100% secure, and we cannot guarantee absolute security.</p>

      <h2>5. Your Rights</h2>
      <ul>
        <li><strong>Access</strong> — You can view all your submitted reports and account information at any time.</li>
        <li><strong>Correction</strong> — You can update your account details from your profile page.</li>
        <li><strong>Deletion</strong> — You can delete your account and associated data. Contact us to request removal.</li>
        <li><strong>Anonymity</strong> — You have the option to submit reports anonymously without revealing your identity.</li>
      </ul>

      <h2>6. Cookies</h2>
      <p>CivicVoice does not use cookies for tracking. We use localStorage solely for storing your session and application data on your device.</p>

      <h2>7. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page with an updated &quot;Last Updated&quot; date.</p>

      <h2>8. Contact Us</h2>
      <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:support@civicvoice.com" style={{ color: 'var(--color-primary)' }}>support@civicvoice.com</a>.</p>
    </div>
  )
}
