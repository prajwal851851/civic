import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms & Conditions — CivicVoice",
  description: "Terms and conditions for using the CivicVoice platform.",
}

export default function TermsPage() {
  return (
    <div className="page-wrapper">
      <h1>Terms &amp; Conditions</h1>
      <p className="last-updated">Last Updated: June 28, 2026</p>

      <p>Welcome to CivicVoice. By using our platform, you agree to these Terms &amp; Conditions. Please read them carefully. If you do not agree with any part, you should not use the service.</p>

      <h2>1. Acceptance of Terms</h2>
      <p>By accessing or using CivicVoice, you agree to be bound by these Terms &amp; Conditions and our Privacy Policy. We reserve the right to update these terms at any time. Continued use after changes constitutes acceptance of the new terms.</p>

      <h2>2. Description of Service</h2>
      <p>CivicVoice is a community issue reporting platform that allows citizens to submit reports about local problems and allows municipal officials to manage and resolve those reports. The platform includes public maps, feeds, and role-specific dashboards.</p>

      <h2>3. User Accounts</h2>
      <ol>
        <li><strong>Registration</strong> — You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials.</li>
        <li><strong>Account Types</strong> — Two roles exist: Citizen (can submit and view reports) and Official (can manage all reports). Officials must have a valid Official ID to register.</li>
        <li><strong>Account Termination</strong> — We reserve the right to suspend or terminate accounts that violate these terms or engage in abusive behavior.</li>
      </ol>

      <h2>4. User Conduct</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Submit false, misleading, or fraudulent reports.</li>
        <li>Upload offensive, illegal, or harmful content.</li>
        <li>Impersonate any person or entity, including municipal officials.</li>
        <li>Attempt to access another user&apos;s account without permission.</li>
        <li>Use the platform for spam, solicitation, or any unlawful purpose.</li>
        <li>Interfere with the proper functioning of the platform.</li>
      </ul>

      <h2>5. Report Content</h2>
      <p>You retain ownership of the content you submit. By submitting a report, you grant CivicVoice a non-exclusive, royalty-free license to display, distribute, and use the content on the platform. You represent that your submissions do not violate any third-party rights.</p>

      <div className="terms-box">
        <strong>Important:</strong> Reports submitted publicly (including photos and location data) will be visible to all users. If you wish to hide your identity, use the anonymous submission option.
      </div>

      <h2>6. Official Responsibilities</h2>
      <p>Municipal officials using CivicVoice agree to:</p>
      <ul>
        <li>Use their official credentials responsibly and not share them.</li>
        <li>Update report statuses accurately and in good faith.</li>
        <li>Add notes and evidence when changing statuses for transparency.</li>
        <li>Not misuse their access to view or modify reports for personal gain.</li>
      </ul>

      <h2>7. Intellectual Property</h2>
      <p>The CivicVoice name, logo, design, and software are proprietary. You may not copy, modify, distribute, or reverse-engineer any part of the platform without explicit permission.</p>

      <h2>8. Limitation of Liability</h2>
      <p>CivicVoice is provided &quot;as is&quot; without warranties of any kind. We are not liable for any damages arising from your use of the platform, including but not limited to: inaccuracies in reports, delays in resolution, or data loss. We do not guarantee that all reported issues will be resolved.</p>

      <h2>9. Third-Party Services</h2>
      <p>The platform uses third-party services including OpenStreetMap (for map tiles) and Font Awesome (for icons). These services have their own terms and policies. We are not responsible for their practices.</p>

      <h2>10. Governing Law</h2>
      <p>These terms are governed by the laws of Nepal. Any disputes shall be resolved in the courts of Kathmandu, Nepal.</p>

      <h2>11. Contact</h2>
      <p>For questions about these terms, contact us at <a href="mailto:support@civicvoice.com" style={{ color: 'var(--color-primary)' }}>support@civicvoice.com</a>.</p>
    </div>
  )
}
