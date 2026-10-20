import { useState } from 'react';
import { askAssistant } from '../api';

// A question box answered by the AI assistant, with a reminder that it can be wrong.
function AskAssistant() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAsk(e) {
    e.preventDefault();
    setError('');
    setAnswer('');
    setLoading(true);
    try {
      setAnswer(await askAssistant(question));
    } catch (err) {
      setError(`${err.message}. You can still use the questions below.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form className="faq-ask" onSubmit={handleAsk}>
        <input
          type="text"
          placeholder="Ask the assistant anything about parking..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={300}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Thinking...' : 'Ask'}
        </button>
      </form>
      {answer && (
        <div className="faq-ai-answer">
          <p>{answer}</p>
          <span>AI-generated answer, it may be wrong. Please double-check with Parking Services.</span>
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </>
  );
}

export default AskAssistant;
