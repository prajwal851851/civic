"use client"

import { useState } from "react"

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitted(true)
    ;(e.target as HTMLFormElement).reset()
  }

  return (
    <div className="contact-form">
      <h2>Send us a message</h2>
      <form id="contactForm" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="contactName">Your Name</label>
          <input type="text" id="contactName" required placeholder="Your Name" />
        </div>
        <div className="form-group">
          <label htmlFor="contactEmail">Email Address</label>
          <input type="email" id="contactEmail" required placeholder="user@example.com" />
        </div>
        <div className="form-group">
          <label htmlFor="contactSubject">Subject</label>
          <select id="contactSubject">
            <option value="">Select a topic...</option>
            <option value="bug">Bug Report</option>
            <option value="feature">Feature Request</option>
            <option value="support">Technical Support</option>
            <option value="partnership">Partnership Inquiry</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="contactMessage">Message</label>
          <textarea id="contactMessage" required placeholder="Tell us how we can help..."></textarea>
        </div>
        <button type="submit" className="submit-btn">Send Message</button>
        {submitted && <div className="form-success" id="formSuccess">Thank you! Your message has been sent. We&apos;ll get back to you shortly.</div>}
      </form>
    </div>
  )
}
