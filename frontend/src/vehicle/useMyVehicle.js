import { useEffect, useState } from 'react';
import { getMyVehicle } from '../api';

const REFRESH_MS = 15000;

// The signed-in driver's plate and violations. Status changes, such as a ticket
// being issued, show up without a reload.
export function useMyVehicle() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    function load() {
      getMyVehicle()
        .then((result) => {
          setData(result);
          setError('');
        })
        .catch((err) => setError(err.message));
    }
    load();
    const id = setInterval(() => {
      if (!document.hidden) load();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  return { data, error };
}
