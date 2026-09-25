import { useState } from 'react';
import { submitInquiry } from './api';

const FAQ_ITEMS = [
  {
    q: 'How much does parking cost, and when is it free?',
    a: 'Paid hours are 8:30am to 4:30pm, Monday to Friday. Parking is free outside these hours, including all day on weekends. Motorbikes are free at all times. Payment is made through the PayMyPark app or website.',
  },
  {
    q: 'If I pay at Gate 1, can I park at the other gates?',
    a: 'Yes. Payment through PayMyPark is valid campus-wide, not just for the gate you selected when you paid.',
  },
  {
    q: 'What are the rules for permit and reserved parks?',
    a: 'Numbered or named parks are reserved for permit holders at all times, and parking there without a permit may result in wheel-clamping. This system flags three kinds of violations: parking in a reserved space without a permit, parking without payment during paid hours, and parking in a mobility space without a valid mobility card.',
  },
  {
    q: 'My car has been clamped, or I got a violation notice. Where do I go?',
    a: 'Contact Unisafe Campus Security (Risk and Security), phone 07 838 4444. This is a placeholder based on a contact from an email thread with parking staff — please confirm this is the correct office before relying on it.',
  },
  {
    q: 'What is a mobility card?',
    a: 'A Mobility Parking Permit, issued by CCS Disability Action, lets you use designated mobility parks. These are free at all times for permit holders.',
  },
  {
    q: 'Which gate is closest to my building?',
    a: 'Gate 1: Bryant Hall, Student Village, Unirec. Gate 2b: Knighton Lake, Gallagher Academy of Performing Arts. Gate 3A: Hamilton Star-University Cricket Club, Union @ The Don. Gate 3B: College Hall. Gate 10: Management Student Centre, Waikato Management School.',
  },
];

function FaqWidget() {
  const [open, setOpen] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);
  const [question, setQuestion] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await submitInquiry(question, email);
      setSubmitted(true);
      setQuestion('');
      setEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="faq-widget">
      {open && (
        <div className="faq-panel">
          <div className="faq-panel-header">
            <span>Questions about parking</span>
            <button type="button" className="faq-close" onClick={() => setOpen(false)}>
              &times;
            </button>
          </div>
          <div className="faq-panel-body">
            {FAQ_ITEMS.map((item, index) => (
              <div key={item.q} className="faq-item">
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                >
                  {item.q}
                </button>
                {openIndex === index && <p className="faq-answer">{item.a}</p>}
              </div>
            ))}

            <div className="faq-item">
              <p className="faq-question" style={{ cursor: 'default' }}>
                Still have a question?
              </p>
              {submitted ? (
                <p className="faq-answer">
                  Thanks, we've received your question and will get back to you by email.
                </p>
              ) : (
                <form className="faq-form" onSubmit={handleSubmit}>
                  <textarea
                    placeholder="Type your question..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  {error && <p className="error">{error}</p>}
                  <button type="submit" disabled={submitting}>
                    {submitting ? 'Sending...' : 'Send'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      <button type="button" className="faq-toggle" onClick={() => setOpen(!open)}>
        {open ? 'Close' : 'Questions?'}
      </button>
    </div>
  );
}

export default FaqWidget;
