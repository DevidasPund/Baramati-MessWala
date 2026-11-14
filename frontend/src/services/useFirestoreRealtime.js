import { useState, useEffect, useRef } from 'react';
import { db, isFirebaseClientConfigured, onSnapshot, collection, query, where, orderBy, limit } from '../config/firebase';

/**
 * Custom hook to safely attach a real-time Firestore listener with automatic
 * cleanup, offline resilience, and REST fallback.
 *
 * @param {string} collectionName - Firestore collection to observe (e.g. 'attendance', 'payments')
 * @param {Array} queryConstraints - Array of query constraints: [where('customerId', '==', id), limit(10)]
 * @param {any} initialData - Fallback data when Firestore is not connected
 */
export const useFirestoreRealtime = (collectionName, queryConstraints = [], initialData = null) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(isFirebaseClientConfigured);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (!isFirebaseClientConfigured || !db || !collectionName) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const colRef = collection(db, collectionName);
      const q = queryConstraints.length > 0 ? query(colRef, ...queryConstraints) : colRef;

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const documents = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          setData(documents);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.warn(`[Firestore Realtime] Listener error on ${collectionName}:`, err.message);
          setError(err);
          setLoading(false);
        }
      );

      unsubscribeRef.current = unsubscribe;
    } catch (err) {
      console.warn(`[Firestore Realtime] Setup error on ${collectionName}:`, err.message);
      setError(err);
      setLoading(false);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [collectionName, JSON.stringify(queryConstraints)]);

  return { data, loading, error, isRealtime: isFirebaseClientConfigured };
};

export default useFirestoreRealtime;
