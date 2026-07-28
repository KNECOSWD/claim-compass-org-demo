const demoData = {
  lumbar: {
    title: "Lumbar spine",
    badge: "Potentially relevant evidence",
    firstDate: "Aug. 14, 2001",
    sourceCount: "3",
    promptCount: "2",
    promptTitle: "Clarify continuity after separation",
    promptText: "The mock record contains an in-service complaint and a later diagnosis, but no treatment evidence for the intervening period.",
    source: {
      title: "Service Treatment Record",
      page: "Page 18 of 74",
      date: "14 AUG 2001",
      reason: "Lower back discomfort after lifting equipment.",
      body: "Member reports dull lumbar discomfort beginning during assigned duties. Denies radiating pain. Conservative care discussed.",
      highlight: "Assessment: mechanical low back strain."
    },
    events: [
      ["Aug. 14, 2001", "In-service complaint", "Lower back discomfort documented following equipment handling.", "STR · p.18"],
      ["Aug. 28, 2001", "Follow-up evaluation", "Persistent discomfort noted; range-of-motion observations recorded.", "STR · p.22"],
      ["Nov. 2, 2002", "Separation", "No dedicated lumbar diagnosis listed on the mock separation summary.", "Personnel · p.4"],
      ["Mar. 11, 2012", "Post-service diagnosis", "Primary care note lists chronic mechanical low back pain.", "Private MR · p.7"],
      ["Jan. 8, 2026", "Claim review event", "Prior decision references current diagnosis but requests further nexus support.", "Decision · p.5"]
    ]
  },
  migraine: {
    title: "Migraine",
    badge: "Evidence requires verification",
    firstDate: "Feb. 6, 2000",
    sourceCount: "4",
    promptCount: "3",
    promptTitle: "Compare symptom descriptions across records",
    promptText: "The mock records use headache, visual disturbance, and migraine terminology. A reviewer should verify whether they describe the same condition and chronology.",
    source: {
      title: "Neurology Consultation",
      page: "Page 41 of 96",
      date: "06 FEB 2000",
      reason: "Recurring headaches with intermittent visual symptoms.",
      body: "Patient reports episodic pressure and light sensitivity. Neurologic assessment and follow-up plan documented.",
      highlight: "Impression: recurrent headache syndrome; further evaluation recommended."
    },
    events: [
      ["Feb. 6, 2000", "Neurology evaluation", "Recurring headaches and intermittent visual symptoms documented.", "STR · p.41"],
      ["Jun. 19, 2000", "Medication follow-up", "Treatment response and headache frequency discussed.", "STR · p.53"],
      ["Apr. 3, 2004", "VA examination", "Examiner records recurring prostrating-type episodes by history.", "C&P · p.3"],
      ["Sep. 17, 2025", "Current treatment", "Neurology note documents ongoing migraine-management plan.", "VA MR · p.118"]
    ]
  },
  respiratory: {
    title: "Respiratory",
    badge: "Multiple episodes identified",
    firstDate: "Jan. 22, 1999",
    sourceCount: "5",
    promptCount: "2",
    promptTitle: "Determine whether episodes establish a chronic pattern",
    promptText: "The mock file contains several acute respiratory encounters. A representative should review diagnostic continuity and current disability evidence.",
    source: {
      title: "Emergency Treatment Note",
      page: "Page 9 of 63",
      date: "22 JAN 1999",
      reason: "Cough, fever, and difficulty breathing.",
      body: "Chest symptoms progressed over several days. Imaging and respiratory treatment were ordered.",
      highlight: "Assessment: suspected lower respiratory infection."
    },
    events: [
      ["Jan. 22, 1999", "Acute respiratory visit", "Cough, fever, and breathing difficulty documented.", "STR · p.9"],
      ["Jan. 24, 1999", "Imaging result", "Chest imaging interpreted as consistent with infection.", "Radiology · p.2"],
      ["Jan. 29, 1999", "Treatment follow-up", "Symptoms improving after prescribed treatment.", "STR · p.13"],
      ["Mar. 28, 2000", "Separate respiratory encounter", "New cough and chest congestion documented.", "STR · p.37"],
      ["Oct. 11, 2001", "Recurrent episode", "Shortness of breath and productive cough evaluated.", "STR · p.68"],
      ["May 4, 2025", "Current respiratory assessment", "Current symptoms reviewed; additional diagnostic work recommended.", "Private MR · p.14"]
    ]
  }
};

const timeline = document.querySelector("#timeline");
const tabs = [...document.querySelectorAll(".condition-tab")];
const sourceDialog = document.querySelector("#source-dialog");
let activeCondition = "lumbar";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderCondition(key) {
  const data = demoData[key];
  activeCondition = key;
  document.querySelector("#condition-title").textContent = data.title;
  document.querySelector("#review-badge").textContent = data.badge;
  document.querySelector("#first-date").textContent = data.firstDate;
  document.querySelector("#source-count").textContent = data.sourceCount;
  document.querySelector("#prompt-count").textContent = data.promptCount;
  document.querySelector("#prompt-title").textContent = data.promptTitle;
  document.querySelector("#prompt-text").textContent = data.promptText;

  timeline.innerHTML = data.events.map(([date, title, description, source]) => `
    <article class="timeline-event">
      <div class="timeline-date">${escapeHtml(date)}</div>
      <div class="timeline-copy">
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(description)}</p>
      </div>
      <span class="source-chip">${escapeHtml(source)}</span>
    </article>
  `).join("");
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((candidate) => {
      const isActive = candidate === tab;
      candidate.classList.toggle("active", isActive);
      candidate.setAttribute("aria-selected", String(isActive));
    });
    renderCondition(tab.dataset.condition);
  });
});

function populateDialog() {
  const source = demoData[activeCondition].source;
  document.querySelector("#source-dialog-title").textContent = source.title;
  document.querySelector("#dialog-page").textContent = source.page;
  document.querySelector("#dialog-date").textContent = source.date;
  document.querySelector("#dialog-reason").textContent = source.reason;
  document.querySelector("#dialog-body").textContent = source.body;
  document.querySelector("#dialog-highlight").textContent = source.highlight;
}

document.querySelector("#view-source-button").addEventListener("click", () => {
  populateDialog();
  if (typeof sourceDialog.showModal === "function") sourceDialog.showModal();
});

const menuButton = document.querySelector(".menu-button");
const nav = document.querySelector("#primary-nav");
menuButton.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!open));
  nav.classList.toggle("open", !open);
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
  });
});

renderCondition(activeCondition);

const contactForm = document.querySelector("#contact-form");
const contactSubmit = document.querySelector("#contact-submit");
const contactStatus = document.querySelector("#contact-status");
const messageField = document.querySelector("#message");
const messageCount = document.querySelector("#message-count");
const formStartedAt = document.querySelector("#form-started-at");

const allowedInterests = new Set([
  "Demonstration",
  "Pilot discussion",
  "Stakeholder feedback",
  "Organizational licensing",
  "Other",
]);

const sensitiveIdentifierPattern = /\b\d{3}[ -]?\d{2}[ -]?\d{4}\b/;
const meaningfulTextPattern = /[\p{L}\p{N}]/u;

function setFormStartTime() {
  if (formStartedAt) formStartedAt.value = String(Date.now());
}

function updateMessageCount() {
  if (messageField && messageCount) {
    messageCount.textContent = `${messageField.value.length} / 1500`;
  }
}

function fieldErrorElement(field) {
  const describedBy = (field.getAttribute("aria-describedby") || "").split(/\s+/);
  const errorId = describedBy.find((id) => id.endsWith("-error"));
  return errorId ? document.getElementById(errorId) : null;
}

function setFieldError(field, message = "") {
  const error = fieldErrorElement(field);
  field.classList.toggle("is-invalid", Boolean(message));
  field.setAttribute("aria-invalid", message ? "true" : "false");
  if (error) error.textContent = message;

  if (field.type === "checkbox") {
    field.closest(".form-confirmation")?.classList.toggle("is-invalid", Boolean(message));
  }
}

function normalized(value) {
  return value.replace(/\s+/g, " ").trim();
}

function validateField(field) {
  const value = normalized(field.value || "");
  let message = "";

  if (field.required && field.type === "checkbox" && !field.checked) {
    message = field.id === "safe-content"
      ? "Confirm that you will not submit sensitive veteran information."
      : "Agree to the Terms of Use and acknowledge the Privacy Notice.";
  } else if (field.required && !value) {
    message = "This field is required.";
  } else if (field.id === "organization" && value && (value.length < 2 || !meaningfulTextPattern.test(value))) {
    message = "Enter a valid organization name.";
  } else if (field.id === "contact-name" && value && (value.length < 2 || !meaningfulTextPattern.test(value))) {
    message = "Enter your name.";
  } else if (field.id === "contact-email" && value && !field.validity.valid) {
    message = "Enter a valid email address, such as name@organization.org.";
  } else if (field.id === "role" && value && value.length < 2) {
    message = "Enter at least 2 characters or leave this field blank.";
  } else if (field.id === "organization-website" && value) {
    try {
      const url = new URL(value);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error("invalid protocol");
    } catch {
      message = "Enter a complete website address beginning with https://.";
    }
  } else if (field.id === "interest" && value && !allowedInterests.has(value)) {
    message = "Select one of the available interests.";
  } else if (field.id === "message" && value) {
    if (value.length < 30) {
      message = "Provide at least 30 characters so we can understand your request.";
    } else if (sensitiveIdentifierPattern.test(value)) {
      message = "Remove any Social Security number or similar nine-digit personal identifier.";
    }
  }

  if (!message && field.validity.tooLong) message = `Use no more than ${field.maxLength} characters.`;
  if (!message && field.validity.tooShort) message = `Use at least ${field.minLength} characters.`;

  setFieldError(field, message);
  return !message;
}

function validateContactForm() {
  const fields = [
    "organization", "contact-name", "contact-email", "role", "organization-website",
    "interest", "message", "safe-content", "legal-consent",
  ].map((id) => document.getElementById(id)).filter(Boolean);

  let valid = true;
  let firstInvalid = null;
  fields.forEach((field) => {
    const fieldValid = validateField(field);
    if (!fieldValid && !firstInvalid) firstInvalid = field;
    valid = fieldValid && valid;
  });

  firstInvalid?.focus();
  return valid;
}

if (contactForm && contactSubmit && contactStatus) {
  setFormStartTime();
  updateMessageCount();

  contactForm.querySelectorAll("input, select, textarea").forEach((field) => {
    if (field.type === "hidden" || field.name === "companyFax") return;
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener(field.type === "checkbox" || field.tagName === "SELECT" ? "change" : "input", () => {
      if (field.classList.contains("is-invalid") || field.getAttribute("aria-invalid") === "true") validateField(field);
      if (field === messageField) updateMessageCount();
    });
  });

  messageField?.addEventListener("input", updateMessageCount);

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    contactStatus.className = "form-status";

    if (!validateContactForm()) {
      contactStatus.textContent = "Please correct the highlighted fields before sending your request.";
      contactStatus.classList.add("is-error");
      return;
    }

    const formData = new FormData(contactForm);
    const payload = Object.fromEntries(formData.entries());

    contactSubmit.disabled = true;
    contactSubmit.textContent = "Sending…";
    contactForm.setAttribute("aria-busy", "true");
    contactStatus.textContent = "Sending your request securely…";

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let result = {};
      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok) {
        if (result.errors && typeof result.errors === "object") {
          Object.entries(result.errors).forEach(([fieldName, message]) => {
            const field = contactForm.elements.namedItem(fieldName);
            if (field instanceof HTMLElement) setFieldError(field, String(message));
          });
        }
        throw new Error(result.message || "Your request could not be sent right now.");
      }

      contactForm.reset();
      contactForm.querySelectorAll(".is-invalid").forEach((element) => element.classList.remove("is-invalid"));
      contactForm.querySelectorAll('[aria-invalid="true"]').forEach((element) => element.setAttribute("aria-invalid", "false"));
      contactForm.querySelectorAll(".form-error").forEach((element) => { element.textContent = ""; });
      setFormStartTime();
      updateMessageCount();
      contactStatus.textContent = result.message || "Thank you. Your request was sent to the Claim Compass team.";
      contactStatus.classList.add("is-success");
    } catch (error) {
      contactStatus.textContent = `${error.message} You can also email claimcompass@kneco.com directly.`;
      contactStatus.classList.add("is-error");
    } finally {
      contactSubmit.disabled = false;
      contactSubmit.textContent = "Send request";
      contactForm.removeAttribute("aria-busy");
    }
  });
}

