"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../../lib/firebase";
import {
  defaultAbout,
  defaultAchievements,
  defaultContact,
  defaultHome,
  defaultProjects,
} from "../../lib/portfolio";

const PortfolioContext = createContext({
  home: defaultHome,
  about: defaultAbout,
  contact: defaultContact,
  projects: defaultProjects,
  experience: [],
  achievements: defaultAchievements,
  error: "",
});

export function PortfolioProvider({ children }) {
  const [home, setHome] = useState(defaultHome);
  const [about, setAbout] = useState(defaultAbout);
  const [contact, setContact] = useState(defaultContact);
  const [projects, setProjects] = useState(defaultProjects);
  const [experience, setExperience] = useState([]);
  const [achievements, setAchievements] = useState(defaultAchievements);
  const [errors, setErrors] = useState({});
  const error = Object.values(errors).join(" ");

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const reportError = (source) => (snapshotError) => {
      console.error(`Could not load published ${source}:`, snapshotError);
      setErrors((current) => ({
        ...current,
        [source]: "Live portfolio content could not be loaded.",
      }));
    };
    const clearError = (source) => {
      setErrors((current) => {
        if (!current[source]) return current;
        const next = { ...current };
        delete next[source];
        return next;
      });
    };

    const unsubscribeHome = onSnapshot(
      doc(db, "publicContent", "home"),
      (snapshot) => {
        if (snapshot.exists()) {
          setHome({ ...defaultHome, ...snapshot.data() });
        }
        clearError("home");
      },
      reportError("home"),
    );
    const unsubscribeAbout = onSnapshot(
      doc(db, "publicContent", "about"),
      (snapshot) => {
        if (snapshot.exists()) setAbout({ ...defaultAbout, ...snapshot.data() });
        clearError("about");
      },
      reportError("about"),
    );
    const unsubscribeContact = onSnapshot(
      doc(db, "publicContent", "contact"),
      (snapshot) => {
        if (snapshot.exists()) {
          const safeContact = { ...snapshot.data() };
          delete safeContact.phone;
          delete safeContact.address;
          delete safeContact.fullAddress;
          delete safeContact.streetAddress;
          setContact({ ...defaultContact, ...safeContact });
        }
        clearError("contact");
      },
      reportError("contact"),
    );
    const unsubscribeProjects = onSnapshot(
      query(collection(db, "publicProjects"), orderBy("order")),
      (snapshot) => {
        setProjects(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
        clearError("projects");
      },
      reportError("projects"),
    );
    const unsubscribeAchievements = onSnapshot(
      query(collection(db, "publicAchievements"), orderBy("order")),
      (snapshot) => {
        setAchievements(
          snapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
        );
        clearError("achievements");
      },
      reportError("achievements"),
    );
    const unsubscribeExperience = onSnapshot(
      query(collection(db, "publicExperience"), orderBy("order")),
      (snapshot) => {
        setExperience(
          snapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
        );
        clearError("experience");
      },
      reportError("experience"),
    );

    return () => {
      unsubscribeHome();
      unsubscribeAbout();
      unsubscribeContact();
      unsubscribeProjects();
      unsubscribeAchievements();
      unsubscribeExperience();
    };
  }, []);

  return (
    <PortfolioContext.Provider
      value={{ home, about, contact, projects, experience, achievements, error }}
    >
      {error && (
        <p
          role="status"
          className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900"
        >
          {error}
        </p>
      )}
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  return useContext(PortfolioContext);
}
