import { useState } from 'react';
import { submitInquiry } from '../api';

// For a question the assistant and the list could not answer: it goes to staff.
function QuestionForm() {
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
    <div className="faq-item">
      <p className="faq-question" style={{ cursor: 'default' }}>
        Still have a question?
      </p>
      {submitted ? (
        <p className="faq-answer">Thanks, we've received your question and will get back to you by email.</p>
      ) : (
        <form className="faq-form" onSubmit={handleSubmit}>
          <textarea placeholder="Type your question..." value={question} onChange={(e) => setQuestion(e.target.value)} required />
          <input type="email" placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? 'Sending...' : 'Send'}
          </button>
        </form>
      )}
    </div>
  );
}

export default QuestionForm;
