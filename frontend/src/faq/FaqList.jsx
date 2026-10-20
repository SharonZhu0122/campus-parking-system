import { useState } from 'react';
import { FAQ_ITEMS } from './faqItems';

function FaqAnswer({ item }) {
  return (
    <p className="faq-answer">
      {item.a}
      {item.link && (
        <>
          {' '}
          <a href={item.link.url} target="_blank" rel="noopener noreferrer">
            {item.link.text}
          </a>
        </>
      )}
    </p>
  );
}

// The fixed questions: click one to see its answer.
function FaqList() {
  const [openIndex, setOpenIndex] = useState(null);

  return FAQ_ITEMS.map((item, index) => (
    <div key={item.q} className="faq-item">
      <button type="button" className="faq-question" onClick={() => setOpenIndex(openIndex === index ? null : index)}>
        {item.q}
      </button>
      {openIndex === index && <FaqAnswer item={item} />}
    </div>
  ));
}

export default FaqList;
