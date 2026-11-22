"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import AccessibleDropdown from "../components/AccessibleDropdown";
import { usePortfolio } from "../components/PortfolioProvider";
import SectionHeading from "../components/SectionHeading";
import { ContactSkeleton } from "../components/PortfolioSkeleton";
import { db, isFirebaseConfigured } from "../../lib/firebase";

const emptyForm = {
  name: "",
  email: "",
  category: "project",
  subject: "",
  details: "",
  message: "",
  website: "",
};

const fieldClassName =
  "mt-1.5 w-full rounded-xl border border-[#cbd9d5] bg-white px-3.5 py-3 text-sm text-[#122126] outline-none transition placeholder:text-[#94a19f] focus:border-[#22a98a] focus:ring-2 focus:ring-[#22a98a]/15 dark:border-white/15 dark:bg-[#0b1c22] dark:text-white dark:placeholder:text-white/35 dark:focus:border-[#5be0bf] dark:focus:ring-[#5be0bf]/15";

export default function ContactPage() {
  const { home, loading } = usePortfolio();
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState(null);

  if (loading) return <ContactSkeleton />;

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setNotice(null);
  };

  const submitContactRequest = async (event) => {
    event.preventDefault();
    setNotice(null);

    if (form.website) {
      setNotice({
        tone: "error",
        message: "Please leave the website field empty.",
      });
      return;
    }

    const submission = {
      name: form.name.trim(),
      email: form.email.trim(),
      category: form.category,
      subject: form.subject.trim(),
      details: form.details.trim(),
      message: form.message.trim(),
    };
    if (
      !submission.name ||
      !submission.email ||
      !submission.subject ||
      !submission.details ||
      !submission.message
    ) {
      setNotice({
        tone: "error",
        message: "Please complete all required fields before sending.",
      });
      return;
    }
    if (!db || !isFirebaseConfigured) {
      setNotice({
        tone: "error",
        message: "The contact form is temporarily unavailable. Please try again later.",
      });
      return;
    }

    setSending(true);
    try {
      await addDoc(collection(db, "contactInbox"), {
        ...submission,
        status: "new",
        submittedAt: serverTimestamp(),
      });

      let emailSent = false;
      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...submission, website: form.website }),
        });
        emailSent = response.ok;
        if (!emailSent) {
          console.error(
            "Contact request was saved, but email delivery failed:",
            response.status,
          );
        }
      } catch (emailError) {
        console.error("Contact request was saved, but email delivery failed:", emailError);
      }

      setForm(emptyForm);
      setNotice({
        tone: emailSent ? "success" : "warning",
        message: emailSent
          ? "Thanks! Your message was sent. I’ll get back to you soon."
          : "Your message is saved in the contact inbox, but the email notification could not be sent. Please try again later.",
      });
    } catch (submitError) {
      console.error("Could not save contact request:", submitError);
      setNotice({
        tone: "error",
        message:
          "Your message could not be saved. Please check your connection and try again.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
      <div className="lg:contents">
        <div className="animate-contact-heading lg:col-start-1 lg:row-start-1">
          <SectionHeading
            eyebrow="Start a conversation"
            title="Have something in mind?"
            description={`I’m ${home.name}. Tell me what help you need and why you’re reaching out.`}
          />
        </div>
        <aside className="animate-contact-guide mt-8 rounded-2xl border border-[#9bdcc8] bg-gradient-to-br from-[#eaf8f2] via-white to-[#f5fbf8] p-5 dark:border-[#2d705f] dark:from-[#123a31] dark:via-[#102127] dark:to-[#0d2024] lg:col-start-1 lg:row-start-2 lg:mt-0 lg:flex lg:self-stretch lg:flex-col sm:p-6">
          <div className="border-b border-[#cde8df] pb-4 dark:border-white/10">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#168e78] dark:text-[#83e6ce]">
              A quick guide
            </p>
            <h2 className="mt-1 font-semibold text-[#183037] dark:text-white">
              Not sure what to write?
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#526e6b] dark:text-white/70">
              A few simple examples for the form.
            </p>
          </div>
          <dl className="mt-4 space-y-3">
            <div className="rounded-xl border border-[#d6ebe3] bg-white/80 p-3.5 shadow-[0_3px_12px_rgba(16,54,48,0.04)] dark:border-white/10 dark:bg-white/5 dark:shadow-none">
              <dt className="text-sm font-semibold text-[#183037] dark:text-white">
                What goes in the title?
              </dt>
              <dd className="mt-1 text-sm leading-6 text-[#526e6b] dark:text-white/70">
                Keep it short. Example: “Portfolio website redesign.”
              </dd>
            </div>
            <div className="rounded-xl border border-[#d6ebe3] bg-white/80 p-3.5 shadow-[0_3px_12px_rgba(16,54,48,0.04)] dark:border-white/10 dark:bg-white/5 dark:shadow-none">
              <dt className="text-sm font-semibold text-[#183037] dark:text-white">
                What do you want done?
              </dt>
              <dd className="mt-1 text-sm leading-6 text-[#526e6b] dark:text-white/70">
                Example: “Build a portfolio with About, Projects, and Contact
                sections that works well on phones.”
              </dd>
            </div>
            <div className="rounded-xl border border-[#d6ebe3] bg-white/80 p-3.5 shadow-[0_3px_12px_rgba(16,54,48,0.04)] dark:border-white/10 dark:bg-white/5 dark:shadow-none">
              <dt className="text-sm font-semibold text-[#183037] dark:text-white">
                What is the purpose?
              </dt>
              <dd className="mt-1 text-sm leading-6 text-[#526e6b] dark:text-white/70">
                Example: “I’m applying for jobs and want employers to see my
                work. I hope to launch it next month.”
              </dd>
            </div>
          </dl>
          <p className="mt-4 border-t border-[#cde8df] pt-4 text-xs leading-5 text-[#65777a] dark:border-white/10 dark:text-white/55 lg:mt-auto">
            Simple sentences are enough. Add a deadline if it helps.
          </p>
        </aside>
        <form
          onSubmit={submitContactRequest}
          className="animate-contact-form mt-8 space-y-4 rounded-2xl border border-[#9bdcc8] bg-gradient-to-br from-[#f7fffc] via-white to-[#eaf8f2] p-5 shadow-[0_16px_45px_rgba(16,54,48,0.08)] transition-shadow duration-300 hover:shadow-[0_22px_55px_rgba(16,54,48,0.14)] dark:border-[#2d705f] dark:from-[#123a31] dark:via-[#102127] dark:to-[#0d2024] dark:shadow-[0_16px_45px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_22px_55px_rgba(0,0,0,0.28)] motion-reduce:transition-none sm:p-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0"
        >
          <div className="mb-1">
            <h2 className="text-lg font-semibold text-[#183037] dark:text-white">
              Send a message
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#65777a] dark:text-white/60">
              Share a title, what you’d like done, and why it matters to you.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-[#1b3338] dark:text-white">
              Your name
              <input
                className={fieldClassName}
                name="name"
                autoComplete="name"
                maxLength={80}
                required
                value={form.name}
                onChange={(event) => updateForm("name", event.target.value)}
                placeholder="Name"
              />
            </label>
            <label className="block text-sm font-medium text-[#1b3338] dark:text-white">
              Your email
              <input
                className={fieldClassName}
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
                value={form.email}
                onChange={(event) => updateForm("email", event.target.value)}
                placeholder="you@example.com"
              />
            </label>
          </div>
          <div className="block text-sm font-medium text-[#1b3338] dark:text-white">
            <span id="contact-category-label">Reason for reaching out</span>
            <AccessibleDropdown
              ariaLabelledBy="contact-category-label"
              className="mt-1.5"
              options={[
                { value: "project", label: "Website or project help" },
                { value: "opportunity", label: "Job opportunity" },
                { value: "collaboration", label: "Collaboration" },
                { value: "suggestion", label: "Suggestion or feedback" },
                { value: "other", label: "Other" },
              ]}
              value={form.category}
              onChange={(value) => updateForm("category", value)}
            />
          </div>
          <label className="block text-sm font-medium text-[#1b3338] dark:text-white">
            Request title
            <input
              className={fieldClassName}
              name="subject"
              maxLength={120}
              required
              value={form.subject}
              onChange={(event) => updateForm("subject", event.target.value)}
              placeholder="For example: Portfolio website redesign"
            />
          </label>
          <label className="block text-sm font-medium text-[#1b3338] dark:text-white">
            What would you like me to do?
            <textarea
              className={`${fieldClassName} min-h-32 resize-y`}
              name="details"
              maxLength={5000}
              required
              value={form.details}
              onChange={(event) => updateForm("details", event.target.value)}
              placeholder="Describe the work, changes, or result you need."
            />
          </label>
          <label className="block text-sm font-medium text-[#1b3338] dark:text-white">
            Why do you need it? What is the purpose?
            <textarea
              className={`${fieldClassName} min-h-36 resize-y`}
              name="message"
              maxLength={5000}
              required
              value={form.message}
              onChange={(event) => updateForm("message", event.target.value)}
              placeholder="Share your goal, who it will help, and any useful deadline or context."
            />
          </label>
          <div
            aria-hidden="true"
            className="absolute -left-[10000px] h-px w-px overflow-hidden"
          >
            <label htmlFor="contact-website">Website</label>
            <input
              id="contact-website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(event) => updateForm("website", event.target.value)}
            />
          </div>
          {notice && (
            <p
              role={notice.tone === "error" ? "alert" : "status"}
              className={`rounded-xl border px-4 py-3 text-sm leading-6 ${
                notice.tone === "success"
                  ? "border-[#9bdcc8] bg-[#eaf8f2] text-[#11654f] dark:border-[#2d705f] dark:bg-[#123a31] dark:text-[#a7eed9]"
                  : notice.tone === "warning"
                    ? "border-[#e8ca85] bg-[#fff8e8] text-[#805a0c] dark:border-[#80652e] dark:bg-[#3b3018] dark:text-[#f6dc9a]"
                    : "border-[#efb2ad] bg-[#fff2f0] text-[#9f3026] dark:border-[#783c39] dark:bg-[#3a2020] dark:text-[#ffb9b2]"
              }`}
            >
              {notice.message}
            </p>
          )}
          <button
            type="submit"
            disabled={sending}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#0f292d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#16443f] disabled:cursor-wait disabled:opacity-60 dark:bg-[#4ed8b6] dark:text-[#09201e] dark:hover:bg-[#7ce9ce] sm:w-auto"
          >
            {sending ? "Sending..." : "Send message"}
          </button>
        </form>
      </div>

    </div>
  );
}
