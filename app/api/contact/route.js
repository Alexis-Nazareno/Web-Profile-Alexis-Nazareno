const allowedCategories = new Set([
  "project",
  "opportunity",
  "collaboration",
  "suggestion",
  "other",
]);
const categoryLabels = {
  project: "Website or project help",
  opportunity: "Job opportunity",
  collaboration: "Collaboration",
  suggestion: "Suggestion or feedback",
  other: "Other",
};
const rateLimitWindowMs = 60_000;
const rateLimitMaxRequests = 3;
const requestsByIp = new Map();

function isRateLimited(ipAddress) {
  if (!ipAddress) return false;

  const now = Date.now();
  const recentRequests = (requestsByIp.get(ipAddress) || []).filter(
    (timestamp) => now - timestamp < rateLimitWindowMs,
  );
  if (recentRequests.length >= rateLimitMaxRequests) {
    requestsByIp.set(ipAddress, recentRequests);
    return true;
  }

  requestsByIp.set(ipAddress, [...recentRequests, now]);
  if (requestsByIp.size > 1000) {
    for (const [ip, timestamps] of requestsByIp) {
      if (!timestamps.some((timestamp) => now - timestamp < rateLimitWindowMs)) {
        requestsByIp.delete(ip);
      }
    }
  }
  return false;
}

export async function POST(request) {
  const origin = request.headers.get("origin");
  const requestHost =
    (
      request.headers.get("x-forwarded-host") || request.headers.get("host") || ""
    )
      .split(",")[0]
      .trim();
  if (origin && requestHost) {
    let originHost;
    try {
      originHost = new URL(origin).host;
    } catch {
      return Response.json({ error: "Invalid request origin." }, { status: 403 });
    }
    if (originHost !== requestHost) {
      return Response.json({ error: "Invalid request origin." }, { status: 403 });
    }
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 12_000) {
    return Response.json({ error: "The message is too large." }, { status: 413 });
  }

  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip");
  if (isRateLimited(ipAddress)) {
    return Response.json(
      { error: "Too many messages. Please try again later." },
      { status: 429 },
    );
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    typeof payload.name !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.category !== "string" ||
    typeof payload.subject !== "string" ||
    typeof payload.details !== "string" ||
    typeof payload.message !== "string" ||
    typeof payload.website !== "string"
  ) {
    return Response.json({ error: "Please check the form details." }, { status: 400 });
  }

  const name = payload.name.trim();
  const email = payload.email.trim();
  const category = payload.category;
  const categoryLabel = categoryLabels[category];
  const subject = payload.subject.trim().replace(/[\r\n]+/g, " ");
  const details = payload.details.trim();
  const message = payload.message.trim();

  if (payload.website) {
    return Response.json({ error: "Invalid form submission." }, { status: 400 });
  }
  if (
    !name ||
    name.length > 80 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !allowedCategories.has(category) ||
    !subject ||
    subject.length > 120 ||
    !details ||
    details.length > 5000 ||
    !message ||
    message.length > 5000
  ) {
    return Response.json({ error: "Please check the form details." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_EMAIL_FROM;
  const to = process.env.CONTACT_EMAIL_TO;
  if (!apiKey || !from || !to) {
    return Response.json(
      { error: "Email delivery is not configured." },
      { status: 503 },
    );
  }

  try {
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `[${categoryLabel}] ${subject}`,
        text: [
          "New request from your portfolio contact form",
          "",
          `Name: ${name}`,
          `Email: ${email}`,
          `Reason for reaching out: ${categoryLabel}`,
          `Request title: ${subject}`,
          "",
          "What they would like done:",
          details,
          "",
          "Why they need it / purpose:",
          message,
        ].join("\n"),
      }),
      cache: "no-store",
    });

    if (!resendResponse.ok) {
      console.error("Resend rejected a contact notification:", resendResponse.status);
      return Response.json(
        { error: "The email notification could not be delivered." },
        { status: 502 },
      );
    }
  } catch (emailError) {
    console.error("Could not send contact notification:", emailError);
    return Response.json(
      { error: "The email notification could not be delivered." },
      { status: 502 },
    );
  }

  return Response.json({ sent: true });
}
