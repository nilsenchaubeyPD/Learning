import { useState, type ReactNode } from 'react';

const SECTIONS = [
  {
    name: 'Frontend Technical MCQ Test',
    questions: '113 Questions',
    time: '35 min',
    type: 'MCQ',
    score: '91',
    extras: [
      { label: 'Section Jumping', value: 'No' },
      { label: 'Allow Shuffle', value: 'No' },
    ],
  },
  {
    name: 'Coding Test',
    questions: '20 Questions',
    time: '30 min',
    type: 'Coding',
    score: '40',
    extras: [
      { label: 'Section Jumping', value: 'No' },
      { label: "Don't Auto Submit for First Submission", value: 'No' },
    ],
  },
  {
    name: 'Backend Development Technical MCQ Test',
    questions: '28 Questions',
    time: '20 min',
    type: 'MCQ',
    score: '50',
    extras: [
      { label: 'Section Jumping', value: 'No' },
      { label: 'Allow Shuffle', value: 'No' },
    ],
  },
];

export function ReviewPage({ children }: { children: ReactNode }) {
  const [propertiesOpen, setPropertiesOpen] = useState(false);

  return (
    <div className="app-frame">
      <header className="site-header">
        <div className="site-header-inner">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <span className="brand-name">tapin.tech</span>
          </div>
          <nav className="site-nav" aria-label="Primary">
            <a href="#home">Home</a>
            <a href="#questions">My Questions</a>
          </nav>
          <div className="site-tools">
            <span className="credit">T&amp;C credit</span>
            <button type="button" className="icon-btn" aria-label="Notifications">
              <BellIcon />
            </button>
            <button type="button" className="user-chip">
              <span className="avatar" aria-hidden="true">
                I
              </span>
              Imran
              <ChevronSmall />
            </button>
          </div>
        </div>
      </header>

      <div className="exam-bar">
        <div className="exam-bar-inner">
          <div className="exam-title">
            <button type="button" className="icon-btn" aria-label="Back">
              <BackIcon />
            </button>
            <h1>Untitled Assessment</h1>
          </div>
          <ul className="exam-meta">
            <li>
              <LayersIcon /> Test Sections <strong>3</strong>
            </li>
            <li>
              <ClockIcon /> Total Time <strong>85min</strong>
            </li>
            <li>
              <ScoreIcon /> Total Score <strong>181</strong>
            </li>
          </ul>
        </div>
      </div>

      <div className="review-body">
        <ol className="steps" aria-label="Assessment steps">
          <li className="step is-done">
            <span className="step-badge" aria-hidden="true">
              <SmallCheck />
            </span>
            1. Section Details
          </li>
          <li className="step-sep" aria-hidden="true">
            ›
          </li>
          <li className="step is-current" aria-current="step">
            <span className="step-badge">2</span>
            2. Test Review
          </li>
          <li className="step-sep" aria-hidden="true">
            ›
          </li>
          <li className="step">
            <span className="step-badge">
              <RocketIcon />
            </span>
            3. Publish &amp; Invite
          </li>
        </ol>

        <section className="review-card">
          <div className="card-head">
            <h2>Sections</h2>
            <button type="button" className="icon-btn" aria-label="Reorder sections">
              <GripIcon />
            </button>
          </div>
          <div className="section-list">
            {SECTIONS.map((section) => (
              <article key={section.name} className="section-item">
                <div className="section-grid">
                  <div>
                    <span className="field-label">Section Name</span>
                    <strong>{section.name}</strong>
                  </div>
                  <div>
                    <span className="field-label">No. of Questions</span>
                    <span>{section.questions}</span>
                  </div>
                  <div>
                    <span className="field-label">Time</span>
                    <span>{section.time}</span>
                  </div>
                  <div>
                    <span className="field-label">Type</span>
                    <span className={`type-pill type-${section.type.toLowerCase()}`}>{section.type}</span>
                  </div>
                  <div>
                    <span className="field-label">Score</span>
                    <span>{section.score}</span>
                  </div>
                  <div className="section-actions">
                    <span className="field-label">Actions</span>
                    <button type="button" className="icon-btn" aria-label={`Edit ${section.name}`}>
                      <EditIcon />
                    </button>
                  </div>
                </div>
                <div className="section-extras">
                  {section.extras.map((extra) => (
                    <span key={extra.label}>
                      {extra.label} <strong>{extra.value}</strong>
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="review-card">
          <h2>Assessment Details</h2>
          <div className="details-grid">
            <label className="field">
              <span>Name of Assessment</span>
              <input defaultValue="Untitled Assessment" />
            </label>
            <label className="field">
              <span>
                Tags/Keywords <InfoDot />
              </span>
              <input placeholder="Add Tags" />
            </label>
            <label className="field">
              <span>Start Date &amp; Time</span>
              <span className="field-control">
                <CalendarTiny />
                <input placeholder="Select Date & Time" />
              </span>
            </label>
            <label className="field">
              <span>End Date &amp; Time</span>
              <span className="field-control">
                <CalendarTiny />
                <input placeholder="Select Date & Time" />
              </span>
            </label>
          </div>
          <h3 className="subhead">Organization Details</h3>
          <div className="details-grid">
            <label className="field">
              <span>Organization Name</span>
              <input defaultValue="Testbook" />
            </label>
            <label className="field">
              <span>
                Organization Logo URL <InfoDot />
              </span>
              <input defaultValue="https://images.cr.../default_assessment" />
            </label>
          </div>
        </section>

        <section className="review-card advanced-card">{children}</section>

        <section className="review-card">
          <button
            type="button"
            className="accordion-head"
            aria-expanded={propertiesOpen}
            onClick={() => setPropertiesOpen((open) => !open)}
          >
            <h2>Properties</h2>
            <ChevronSmall />
          </button>
          {propertiesOpen && (
            <p className="empty-note">No extra properties are configured for this assessment.</p>
          )}
        </section>

        <section className="review-card notes-card">
          <h2>Notes</h2>
          <ul className="notes">
            <li>
              If exam of default, make sure window is focused. If the window is not focused, a popup
              will be shown asking to focus the window. The timer starts, and logs will be recorded.
            </li>
            <li>
              If a candidate remains too long, the time window of this assessment will be reduced. The
              assessment can still be attempted, per the scheduled access notes.
            </li>
          </ul>
        </section>

        <div className="review-footer">
          <button type="submit" form="advanced-options-form" className="primary-btn">
            Save &amp; Next
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>

      <button type="button" className="chat-fab" aria-label="Help chat">
        <ChatIcon />
      </button>
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M11.5 4.5 7 9l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M8 2.4a3.4 3.4 0 0 0-3.4 3.4v1.6c0 .7-.3 1.4-.8 1.9L3 10.4h10l-.8-1.1a2.6 2.6 0 0 1-.8-1.9V5.8A3.4 3.4 0 0 0 8 2.4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path d="M6.4 12.2a1.6 1.6 0 0 0 3.2 0" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function ChevronSmall() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path d="M7 2.2 12 5 7 7.8 2 5Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 8.2 7 11 12 8.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7 4.6v2.5l1.8 1.2" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ScoreIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <rect x="2.4" y="2.4" width="9.2" height="9.2" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 8.2 6.4 9.5 9.2 5.8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function SmallCheck() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M2 5.2 4.1 7.2 8 3.2" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M6.8 2.2c1.8.4 2.8 1.4 3.1 3.1L7.4 7.8 4.2 4.6Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4.2 7.8 3 9" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function GripIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M6 3h.01M10 3h.01M6 8h.01M10 8h.01M6 13h.01M10 13h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M9.2 3.2 12.8 6.8 5.6 14H2v-3.6L9.2 3.2Z" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function CalendarTiny() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="2.2" y="3.4" width="11.6" height="10.4" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.2 6.4h11.6M5.2 2.2v2.4M10.8 2.2v2.4" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function InfoDot() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="8" cy="5.15" r="0.8" fill="currentColor" />
      <path d="M8 7.2v3.7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v6A3.5 3.5 0 0 1 15.5 16H10l-4.2 3.2V16H8.5A3.5 3.5 0 0 1 5 12.5Z"
        fill="none"
        stroke="#fff"
        strokeWidth="1.6"
      />
    </svg>
  );
}
