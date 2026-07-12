'use client'

import { useState } from "react"

export default function FaqPage() {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  const faqCategories = [
    {
      category: 'Getting Started',
      items: [
        { q: 'What is CivicVoice?', a: 'CivicVoice is a community issue reporting platform that lets citizens report local problems (like potholes, broken streetlights, garbage dumping, etc.) and track them through to resolution by municipal officials. Every report is visible on a public map and feed.' },
        { q: 'How do I sign up?', a: 'Click the "Sign Up" button in the header. Choose your role: Citizen — Sign up with your phone number, email, and password to start reporting issues. Official — Municipal staff can sign up using their Official ID, full name, and password.', list: true },
        { q: 'Is CivicVoice free to use?', a: 'Yes! CivicVoice is completely free for citizens to use. There are no charges for signing up, submitting reports, or accessing any features.' },
      ],
    },
    {
      category: 'Reporting Issues',
      items: [
        { q: 'How do I submit a report?', a: 'Once logged in as a citizen, click "Submit Report" in the sidebar. Fill in the issue title, category, priority, description, location (by dropping a pin on the map), and optionally upload photos. Review and confirm your submission.' },
        { q: 'Can I submit a report anonymously?', a: 'Yes. When submitting a report, check the "Submit Anonymously" option. Your name will not be displayed on the public feed or map — only the report details will be visible.' },
        { q: 'What kind of issues can I report?', a: 'You can report any civic issue including: potholes, broken streetlights, garbage dumping, water leaks, sewage problems, road damage, public park issues, graffiti, noise complaints, and more. If it affects your community, you can report it.' },
      ],
    },
    {
      category: 'Tracking & Resolution',
      items: [
        { q: 'How do I track my report?', a: 'Your submitted reports appear on the "View Your Reports" section, on the Explore Map, and in the Community Feed. Each report shows its current status: Open (awaiting review), In Review (being assessed), or Resolved (completed).' },
        { q: 'What do the different statuses mean?', a: 'Open — The report has been submitted and is awaiting review by municipal officials. In Review — An official has acknowledged the report and is assessing or working on it. Resolved — The issue has been addressed and closed by an official, with details of who resolved it and when.', list: true },
        { q: 'Who can change the status of a report?', a: 'Only verified municipal officials can change report statuses. When an official updates a status, they can add a note and upload evidence photos. Citizens cannot change statuses themselves.' },
      ],
    },
    {
      category: 'Officials',
      items: [
        { q: 'How do officials sign up?', a: 'Officials sign up using their Official ID (e.g., KMC-OFF-12345), full name, and password. The Official ID is provided by the municipal administration. Once signed up, officials can log in and access the Manage Reports dashboard.' },
        { q: 'What can officials do on CivicVoice?', a: 'Officials can view all reports from all citizens, update report statuses (Open → In Review → Resolved), add notes and upload images as evidence, and track resolution history — all from the Manage Reports dashboard.' },
      ],
    },
    {
      category: 'Account & Privacy',
      items: [
        { q: 'How do I reset my password?', a: 'On the login page, click "Forgot Password?" and follow the instructions to reset your password using your registered phone number.' },
        { q: 'How is my data protected?', a: 'Your data is stored securely and never shared with third parties. Anonymous reports hide your identity. For full details, please read our Privacy Policy.' },
      ],
    },
  ]

  return (
    <div className="page-wrapper">
      <h1>Frequently Asked Questions</h1>
      <p className="subtitle">Everything you need to know about using CivicVoice.</p>

      {faqCategories.map((cat, ci) => (
        <div key={ci}>
          <div className="faq-category">{cat.category}</div>
          {cat.items.map((item, ii) => {
            const idx = ci * 100 + ii
            const isOpen = openItems.includes(idx)
            return (
              <div className={`faq-item${isOpen ? ' open' : ''}`} key={idx}>
                <button className="faq-question" onClick={() => toggleItem(idx)}>
                  {item.q} <i className="fa-solid fa-chevron-down"></i>
                </button>
                <div className="faq-answer">
                  <p>{item.a}</p>
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
