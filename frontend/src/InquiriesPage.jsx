import { useEffect, useState } from 'react';
import { getInquiries } from './api';

function InquiriesPage({ onBack }) {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getInquiries()
      .then((data) => {
        setInquiries(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="occupancy-page">
      <header className="top-bar">
        <div className="top-bar-inner">
          <span className="brand-mark">University of Waikato &middot; Parking</span>
          <button type="button" className="top-bar-link" onClick={onBack}>
            Back to admin
          </button>
        </div>
      </header>

      <main className="page-content admin-content">
        <h1>Questions from visitors</h1>
        <p className="subtitle">
          {loading ? 'Loading...' : `${inquiries.length} submitted`}
        </p>
        {error && <p className="error">{error}</p>}
        {!loading && (
          <div className="table-wrapper">
            <table className="violations-table">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Email</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((item) => (
                  <tr key={item.id}>
                    <td style={{ whiteSpace: 'normal', maxWidth: 400 }}>{item.question}</td>
                    <td>{item.email}</td>
                    <td>{new Date(item.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default InquiriesPage;
