import type { Metadata } from "next"
import ContactForm from "./ContactForm"

export const metadata: Metadata = {
  title: "Contact — CivicVoice",
  description: "Have a question, suggestion, or need help? Contact the CivicVoice team.",
}

export default function ContactPage() {
  return (
    <div className="page-wrapper">
      <h1>Contact Us</h1>
      <p className="subtitle">Have a question, suggestion, or need help? We&apos;d love to hear from you.</p>

      <div className="contact-grid">
        <div className="contact-card">
          <i className="fa-solid fa-envelope"></i>
          <h3>Email</h3>
          <p><a href="mailto:support@civicvoice.com">support@civicvoice.com</a></p>
          <p>We typically respond within 24 hours.</p>
        </div>
        <div className="contact-card">
          <i className="fa-solid fa-location-dot"></i>
          <h3>Office</h3>
          <p>CivicVoice Technologies</p>
          <p>Kathmandu Metropolitan City<br />Kathmandu, Nepal</p>
        </div>
        <div className="contact-card">
          <i className="fa-solid fa-phone"></i>
          <h3>Phone</h3>
          <p><a href="tel:+977-1-4XXXXXX">+977-1-4XXXXXX</a></p>
          <p>Mon–Fri, 9 AM – 5 PM NPT</p>
        </div>
        <div className="contact-card">
          <i className="fa-solid fa-clock"></i>
          <h3>Response Time</h3>
          <p>General inquiries: 1–2 business days</p>
          <p>Technical support: within 24 hours</p>
        </div>
      </div>

      <ContactForm />
    </div>
  )
}
