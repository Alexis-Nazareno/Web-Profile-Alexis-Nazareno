"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../../lib/firebase";

export default function usePublishedWork(collectionName) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setLoading(false);
      setError("This section is unavailable because Firebase is not configured.");
      return undefined;
    }

    return onSnapshot(
      query(collection(db, collectionName), orderBy("order")),
      (snapshot) => {
        setItems(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
        setError("");
        setLoading(false);
      },
      (snapshotError) => {
        console.error(`Could not load ${collectionName}:`, snapshotError);
        setError(
          snapshotError.code === "permission-denied"
            ? "This section is unavailable until the site owner publishes the updated Firestore rules."
            : "This section could not be loaded. Please try again later.",
        );
        setLoading(false);
      },
    );
  }, [collectionName]);

  return { items, loading, error };
}
