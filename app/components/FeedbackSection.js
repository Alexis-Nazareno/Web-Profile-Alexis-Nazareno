"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signInAnonymously,
} from "firebase/auth";
import { auth, db, isFirebaseConfigured } from "../../lib/firebase";

const fieldClassName =
  "mt-1.5 w-full rounded-xl border border-[#cbd9d5] bg-white px-3.5 py-3 text-sm text-[#122126] outline-none transition placeholder:text-[#94a19f] focus:border-[#22a98a] focus:ring-2 focus:ring-[#22a98a]/15 dark:border-white/15 dark:bg-[#0b1c22] dark:text-white dark:placeholder:text-white/35 dark:focus:border-[#5be0bf] dark:focus:ring-[#5be0bf]/15";
const FEEDBACK_PAGE_SIZE = 6;

function FeedbackNotice({ tone, title, children, onDismiss }) {
  const isError = tone === "error";
  const styles = isError
    ? "border-[#efb2ad] bg-[#fff2f0] text-[#9f3026] dark:border-[#783c39] dark:bg-[#3a2020] dark:text-[#ffb9b2]"
    : "border-[#9bdcc8] bg-[#eaf8f2] text-[#11654f] dark:border-[#2d705f] dark:bg-[#123a31] dark:text-[#a7eed9]";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      aria-atomic="true"
      className={`flex items-start gap-3 rounded-xl border p-4 shadow-sm ${styles}`}
    >
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-current/10">
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          {isError ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 6v4m0 3h.01M3.5 10a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m6 10 2.5 2.5L14 7"
            />
          )}
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-sm leading-6 opacity-90">{children}</p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="rounded px-1 text-lg leading-5 opacity-70 transition hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"
        >
          &times;
        </button>
      )}
    </div>
  );
}

function FeedbackCard({ item, userId }) {
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [loadingLikes, setLoadingLikes] = useState(true);
  const [liking, setLiking] = useState(false);
  const [likeError, setLikeError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [likeAnimationId, setLikeAnimationId] = useState(0);

  useEffect(() => {
    if (!db) {
      setLoadingLikes(false);
      setLikeError("Likes are temporarily unavailable.");
      return undefined;
    }

    setLoadingLikes(true);
    return onSnapshot(
      collection(db, "publicFeedback", item.id, "likes"),
      (snapshot) => {
        setLikeCount(snapshot.size);
        setHasLiked(
          Boolean(userId) && snapshot.docs.some((like) => like.id === userId),
        );
        setLikeError("");
        setLoadingLikes(false);
      },
      (snapshotError) => {
        const permissionDenied = snapshotError.code === "permission-denied";
        if (permissionDenied) {
          console.warn(
            "Firestore denied access to feedback likes. Check that the latest firestore.rules are deployed.",
          );
        } else {
          console.error("Could not load feedback likes:", snapshotError);
        }
        setLikeError("Likes are temporarily unavailable.");
        setLoadingLikes(false);
      },
    );
  }, [item.id, userId]);

  const toggleLike = async () => {
    if (liking) return;
    if (!auth || !db) {
      setLikeError("Likes are temporarily unavailable.");
      return;
    }
    if (item.likesDisabled) {
      setLikeError("Likes are temporarily unavailable.");
      return;
    }

    setLiking(true);
    setLikeError("");
    setLikeAnimationId((current) => current + 1);
    try {
      const user = auth.currentUser || (await signInAnonymously(auth)).user;
      const likeRef = doc(db, "publicFeedback", item.id, "likes", user.uid);
      await runTransaction(db, async (transaction) => {
        const likeSnapshot = await transaction.get(likeRef);
        if (likeSnapshot.exists()) {
          transaction.delete(likeRef);
        } else {
          transaction.set(likeRef, { createdAt: serverTimestamp() });
        }
      });
    } catch (likeActionError) {
      const permissionDenied = likeActionError.code === "permission-denied";
      const anonymousSignInDisabled = [
        "auth/operation-not-allowed",
        "auth/admin-restricted-operation",
      ].includes(likeActionError.code);
      if (permissionDenied || anonymousSignInDisabled) {
        console.warn("Could not update feedback like:", likeActionError);
      } else {
        console.error("Could not update feedback like:", likeActionError);
      }
      setLikeError(
        anonymousSignInDisabled
          ? "Likes need Anonymous sign-in enabled in Firebase Authentication."
          : permissionDenied
            ? "Likes are unavailable until the updated Firestore rules are published."
            : "Your like could not be saved. Please try again.",
      );
    } finally {
      setLiking(false);
    }
  };

  return (
    <figure className="flex h-full flex-col rounded-2xl border border-[#dce7e4] bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#b8d9cf] hover:shadow-md dark:border-white/10 dark:bg-[#102127] dark:hover:border-white/20">
      <figcaption className="border-b border-[#e5eeea] pb-3 dark:border-white/10">
        <p className="text-sm font-semibold text-[#183037] dark:text-white">
          {item.name?.trim() || "Anonymous"}
        </p>
        {item.role && (
          <p className="mt-0.5 text-xs text-[#738482] dark:text-white/45">
            {item.role}
          </p>
        )}
      </figcaption>
      <blockquote
        className={`mt-4 whitespace-pre-wrap text-sm leading-7 text-[#53676a] dark:text-white/70 ${
          expanded ? "" : "line-clamp-5"
        }`}
      >
        “{item.message}”
      </blockquote>
      {item.message.length > 240 && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          className="mt-2 self-start text-xs font-semibold text-[#168e78] hover:text-[#0f766e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168e78] dark:text-[#5be0bf] dark:hover:text-[#8aefd6]"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
      <div className="mt-auto pt-5">
        <div className="flex items-center gap-2 border-t border-[#e5eeea] pt-4 dark:border-white/10">
          <button
            type="button"
            onClick={toggleLike}
            disabled={
              liking || loadingLikes || Boolean(likeError) || item.likesDisabled
            }
            aria-label={
              item.likesDisabled
                ? "Likes are paused for this feedback"
                : hasLiked
                  ? "Remove your like from this feedback"
                  : "Like this feedback"
            }
            aria-pressed={hasLiked}
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
              hasLiked
                ? "border-[#efb2c0] bg-[#fff0f3] text-[#c33b5b] shadow-sm dark:border-[#78404e] dark:bg-[#3b1c29] dark:text-[#ff91aa]"
                : "border-[#dce7e4] text-[#708184] hover:border-[#efb2c0] hover:bg-[#fff5f7] hover:text-[#c33b5b] dark:border-white/10 dark:text-white/60 dark:hover:border-[#78404e] dark:hover:bg-[#3b1c29] dark:hover:text-[#ff91aa]"
            }`}
          >
            <svg
              key={likeAnimationId}
              aria-hidden="true"
              viewBox="0 0 20 20"
              className={`h-5 w-5 ${
                hasLiked ? "fill-current" : "fill-none"
              } ${likeAnimationId ? "animate-feedback-like" : ""}`}
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 4.8a4 4 0 0 0-5.7 0L10 5.6l-.8-.8a4 4 0 0 0-5.7 5.7l.8.8L10 17l5.7-5.7.8-.8a4 4 0 0 0 0-5.7Z"
              />
            </svg>
          </button>
          <span
            aria-live="polite"
            className="min-w-5 text-sm font-semibold text-[#40565a] dark:text-white/75"
          >
            {loadingLikes ? "…" : likeError ? "—" : likeCount}
          </span>
          <span className="sr-only">likes</span>
        </div>
        {likeError && (
          <p
            role="status"
            className="mt-3 text-xs leading-5 text-[#9f3026] dark:text-[#ffb9b2]"
          >
            {likeError}
          </p>
        )}
      </div>
    </figure>
  );
}

export default function FeedbackSection() {
  const [feedback, setFeedback] = useState([]);
  const [feedbackPage, setFeedbackPage] = useState(0);
  const [likeUserId, setLikeUserId] = useState(auth?.currentUser?.uid || "");
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [form, setForm] = useState({ name: "", role: "", message: "" });
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState(null);
  const [website, setWebsite] = useState("");
  const feedbackPageCount = Math.ceil(feedback.length / FEEDBACK_PAGE_SIZE);
  const currentFeedbackPage = Math.min(
    feedbackPage,
    Math.max(0, feedbackPageCount - 1),
  );
  const firstVisibleFeedback = currentFeedbackPage * FEEDBACK_PAGE_SIZE;
  const visibleFeedback = feedback.slice(
    firstVisibleFeedback,
    firstVisibleFeedback + FEEDBACK_PAGE_SIZE,
  );

  useEffect(() => {
    setFeedbackPage(0);
  }, [feedback.length]);

  useEffect(() => {
    if (!auth) return undefined;
    return onAuthStateChanged(auth, (user) => {
      setLikeUserId(user?.uid || "");
    });
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setLoadingFeedback(false);
      setLoadError({
        title: "Feedback is temporarily unavailable",
        message: "The Firebase connection has not been configured.",
      });
      return undefined;
    }

    return onSnapshot(
      query(collection(db, "publicFeedback"), orderBy("publishedAt", "desc")),
      (snapshot) => {
        setFeedback(
          snapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
        );
        setLoadError(null);
        setLoadingFeedback(false);
      },
      (snapshotError) => {
        const permissionDenied = snapshotError.code === "permission-denied";
        if (permissionDenied) {
          console.warn(
            "Firestore denied access to publicFeedback. Check that the latest firestore.rules are deployed to the configured Firebase project.",
          );
        } else {
          console.error("Could not load published feedback:", snapshotError);
        }
        setLoadError({
          title: "Published feedback couldn't be loaded",
          message: permissionDenied
            ? "The site owner needs to check the Firestore rules for the Firebase project connected to this site."
            : "Please try again later.",
        });
        setLoadingFeedback(false);
      },
    );
  }, []);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setNotice(null);
  };

  const submitFeedback = async (event) => {
    event.preventDefault();
    setNotice(null);

    if (website) {
      setNotice({
        tone: "error",
        title: "Submission blocked",
        text: "Please leave the website field empty.",
      });
      return;
    }

    const name = form.name.trim();
    const role = form.role.trim();
    const message = form.message.trim();
    if (!message) {
      setNotice({
        tone: "error",
        title: "Please check your feedback",
        text: "Enter your feedback before submitting.",
      });
      return;
    }
    if (name.length > 80 || role.length > 100 || message.length > 1000) {
      setNotice({
        tone: "error",
        title: "Some details are too long",
        text: "Please shorten your name, role, or feedback to fit the limits.",
      });
      return;
    }
    if (!db || !isFirebaseConfigured) {
      setNotice({
        tone: "error",
        title: "Feedback is temporarily unavailable",
        text: "Please try again later.",
      });
      return;
    }

    setSending(true);
    try {
      await addDoc(collection(db, "feedbackInbox"), {
        name: name || "Anonymous",
        role,
        message,
        status: "pending",
        submittedAt: serverTimestamp(),
      });
      setForm({ name: "", role: "", message: "" });
      setNotice({
        tone: "success",
        title: "Feedback sent for review",
        text: "Thank you! It will stay private and only appear if approved.",
      });
    } catch (submitError) {
      const permissionDenied = submitError.code === "permission-denied";
      if (permissionDenied) {
        console.warn(
          "Firestore denied the feedback submission. Check that the latest firestore.rules are deployed to the configured Firebase project.",
        );
      } else {
        console.error("Could not submit feedback:", submitError);
      }
      setNotice({
        tone: "error",
        title: "Feedback wasn't sent",
        text: permissionDenied
          ? "Firestore rejected this request. The site owner needs to check the rules in the Firebase project connected to this site."
          : "Please check your connection and try again.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="bg-[#edf4f1] py-20 dark:bg-[#0d1d23] md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <header className="max-w-3xl">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#168e78] dark:text-[#5be0bf]">
            Feedback
          </p>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[#122126] dark:text-white sm:text-4xl">
            What people say about working with me.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#68797c] dark:text-white/60">
            Feedback is reviewed before it is shared publicly. Please don&apos;t
            include private or sensitive information.
          </p>
        </header>

        <div className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#168e78] dark:text-[#5be0bf]">
                Community feedback
              </p>
              <h3 className="text-xl font-semibold tracking-tight text-[#183037] dark:text-white sm:text-2xl">
                Published testimonials
              </h3>
            </div>
            {!loadError && !loadingFeedback && feedback.length > 0 && (
              <p className="text-sm text-[#68797c] dark:text-white/55">
                Showing {firstVisibleFeedback + 1}–
                {Math.min(
                  firstVisibleFeedback + FEEDBACK_PAGE_SIZE,
                  feedback.length,
                )}{" "}
                of {feedback.length}
              </p>
            )}
          </div>

          {loadError ? (
            <FeedbackNotice tone="error" title={loadError.title}>
              {loadError.message}
            </FeedbackNotice>
          ) : loadingFeedback ? (
            <div
              aria-label="Loading published feedback"
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            >
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-64 animate-pulse rounded-2xl border border-[#dce7e4] bg-white/70 dark:border-white/10 dark:bg-white/5"
                />
              ))}
            </div>
          ) : feedback.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visibleFeedback.map((item) => (
                  <FeedbackCard
                    key={item.id}
                    item={item}
                    userId={likeUserId}
                  />
                ))}
              </div>
              {feedbackPageCount > 1 && (
                <nav
                  aria-label="Published feedback pages"
                  className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-[#dce7e4] bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-[#102127]/70"
                >
                  <button
                    type="button"
                    disabled={currentFeedbackPage === 0}
                    onClick={() =>
                      setFeedbackPage((current) =>
                        Math.max(0, Math.min(current, feedbackPageCount - 1) - 1),
                      )
                    }
                    className="rounded-full border border-[#dce7e4] px-4 py-2 text-sm font-semibold text-[#40565a] transition hover:border-[#9bdcc8] hover:text-[#11654f] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-white/70 dark:hover:border-[#2d705f] dark:hover:text-[#a7eed9]"
                  >
                    Previous
                  </button>
                  <p
                    aria-live="polite"
                    className="text-center text-sm font-medium text-[#68797c] dark:text-white/55"
                  >
                    Page {currentFeedbackPage + 1} of {feedbackPageCount}
                  </p>
                  <button
                    type="button"
                    disabled={currentFeedbackPage >= feedbackPageCount - 1}
                    onClick={() =>
                      setFeedbackPage((current) =>
                        Math.min(current + 1, feedbackPageCount - 1),
                      )
                    }
                    className="rounded-full border border-[#dce7e4] px-4 py-2 text-sm font-semibold text-[#40565a] transition hover:border-[#9bdcc8] hover:text-[#11654f] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-white/70 dark:hover:border-[#2d705f] dark:hover:text-[#a7eed9]"
                  >
                    Next
                  </button>
                </nav>
              )}
            </>
          ) : (
            <p className="rounded-2xl border border-dashed border-[#b8d9cf] bg-white/50 px-5 py-6 text-sm text-[#68797c] dark:border-white/15 dark:bg-white/[0.03] dark:text-white/55">
              No feedback has been published yet.
            </p>
          )}
        </div>

        <div className="mt-14 border-t border-[#d6e5df] pt-10 dark:border-white/10">
          <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-[#dce7e4] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#102127] sm:p-7">
            <h3 className="text-xl font-semibold text-[#183037] dark:text-white">
              Share your feedback
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#68797c] dark:text-white/55">
              It will stay private until I review it.
            </p>

            <form onSubmit={submitFeedback} className="mt-5 space-y-4">
              <div
                aria-hidden="true"
                className="absolute -left-[10000px] h-px w-px overflow-hidden"
              >
                <label>
                  Website
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
                  />
                </label>
              </div>
              <label className="block text-sm font-medium text-[#31484b] dark:text-white/80">
                Your name
                <span className="ml-1 font-normal text-[#81908e] dark:text-white/40">
                  (optional)
                </span>
                <input
                  type="text"
                  maxLength={80}
                  autoComplete="name"
                  placeholder="Anonymous"
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  className={fieldClassName}
                />
                <span className="mt-1 block text-xs font-normal text-[#81908e] dark:text-white/40">
                  Leave blank to appear as Anonymous.
                </span>
              </label>
              <label className="block text-sm font-medium text-[#31484b] dark:text-white/80">
                Role or company
                <span className="ml-1 font-normal text-[#81908e] dark:text-white/40">
                  (optional)
                </span>
                <input
                  type="text"
                  maxLength={100}
                  value={form.role}
                  onChange={(event) => updateForm("role", event.target.value)}
                  className={fieldClassName}
                />
              </label>
              <label className="block text-sm font-medium text-[#31484b] dark:text-white/80">
                Your feedback
                <textarea
                  required
                  rows={4}
                  maxLength={1000}
                  value={form.message}
                  onChange={(event) =>
                    updateForm("message", event.target.value)
                  }
                  className={`${fieldClassName} resize-y`}
                />
                <span className="mt-1 block text-right text-xs font-normal text-[#81908e] dark:text-white/40">
                  {form.message.length}/1000
                </span>
              </label>

              {notice && (
                <FeedbackNotice
                  tone={notice.tone}
                  title={notice.title}
                  onDismiss={() => setNotice(null)}
                >
                  {notice.text}
                </FeedbackNotice>
              )}

              <button
                type="submit"
                disabled={sending || !isFirebaseConfigured}
                className="inline-flex items-center justify-center rounded-full bg-[#168e78] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0f766e] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#4ed8b6] dark:text-[#09201e] dark:hover:bg-[#7ce9ce]"
              >
                {sending ? "Sending..." : "Send feedback"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
