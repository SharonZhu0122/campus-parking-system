import { useState } from 'react';
import AskAssistant from './faq/AskAssistant';
import FaqList from './faq/FaqList';
import QuestionForm from './faq/QuestionForm';

// The help button and its panel: the assistant, the fixed questions, and a form for staff.
function FaqWidget() {
  const [open, setOpen] = useState(false);

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
            <AskAssistant />
            <FaqList />
            <QuestionForm />
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
