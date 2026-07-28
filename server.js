'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const root = __dirname;
const port = Number.parseInt(process.env.PORT || '8080', 10);
const maxContactBodyBytes = 20 * 1024;
const contactRateWindowMs = 60 * 60 * 1000;
const contactRateLimit = 5;
const contactAttempts = new Map();
const allowedInterests = new Set([
  'Demonstration',
  'Pilot discussion',
  'Stakeholder feedback',
  'Organizational licensing',
  'Other'
]);
const sensitiveIdentifierPattern = /\b\d{3}[ -]?\d{2}[ -]?\d{4}\b/;

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

function setSecurityHeaders(res) {
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

function sendJson(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Length', Buffer.byteLength(payload));
  res.setHeader('Cache-Control', 'no-store');
  res.writeHead(statusCode);
  res.end(payload);
}

function sendFile(res, filePath) {
  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[extension] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader(
      'Cache-Control',
      ['.html', '.css', '.js'].includes(extension) ? 'no-cache, must-revalidate' : 'public, max-age=604800'
    );
    res.writeHead(200);

    const stream = fs.createReadStream(filePath);
    stream.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      }
      res.end('Unable to read file');
    });
    stream.pipe(res);
  });
}

function normalizeText(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function normalizeMessage(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, maxLength);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 160;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  const current = (contactAttempts.get(ip) || []).filter((timestamp) => now - timestamp < contactRateWindowMs);
  if (current.length >= contactRateLimit) {
    contactAttempts.set(ip, current);
    return true;
  }
  current.push(now);
  contactAttempts.set(ip, current);
  return false;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks = [];

    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxContactBodyBytes) {
        reject(Object.assign(new Error('Request too large'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(JSON.parse(raw || '{}'));
      } catch {
        reject(Object.assign(new Error('Invalid JSON'), { statusCode: 400 }));
      }
    });

    req.on('error', () => reject(Object.assign(new Error('Request interrupted'), { statusCode: 400 })));
  });
}

function isMeaningfulText(value) {
  return /[\p{L}\p{N}]/u.test(value);
}

function isValidWebsite(value) {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function validateContactPayload(payload) {
  const raw = payload && typeof payload === 'object' ? payload : {};
  const contact = {
    organization: normalizeText(raw.organization, 120),
    name: normalizeText(raw.name, 100),
    email: normalizeText(raw.email, 160).toLowerCase(),
    role: normalizeText(raw.role, 120),
    organizationWebsite: normalizeText(raw.organizationWebsite, 240),
    interest: normalizeText(raw.interest, 80),
    message: normalizeMessage(raw.message, 1500),
    companyFax: normalizeText(raw.companyFax, 200),
    safeContent: raw.safeContent === 'on' || raw.safeContent === true || raw.safeContent === 'true',
    legalConsent: raw.legalConsent === 'on' || raw.legalConsent === true || raw.legalConsent === 'true',
    formStartedAt: Number.parseInt(String(raw.formStartedAt || ''), 10),
    formVersion: normalizeText(raw.formVersion, 40)
  };

  if (contact.companyFax) {
    return { ok: false, silent: true, contact };
  }

  const errors = {};
  if (contact.organization.length < 2 || !isMeaningfulText(contact.organization)) {
    errors.organization = 'Enter a valid organization name.';
  }
  if (contact.name.length < 2 || !isMeaningfulText(contact.name)) {
    errors.name = 'Enter your name.';
  }
  if (!isValidEmail(contact.email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (contact.role && contact.role.length < 2) {
    errors.role = 'Enter at least 2 characters or leave this field blank.';
  }
  if (!isValidWebsite(contact.organizationWebsite)) {
    errors.organizationWebsite = 'Enter a complete website address beginning with https://.';
  }
  if (!allowedInterests.has(contact.interest)) {
    errors.interest = 'Select one of the available interests.';
  }
  if (contact.message.length < 30) {
    errors.message = 'Provide at least 30 characters so we can understand your request.';
  } else if (sensitiveIdentifierPattern.test(contact.message)) {
    errors.message = 'Remove any Social Security number or similar nine-digit personal identifier.';
  }
  if (!contact.safeContent) {
    errors.safeContent = 'Confirm that the request contains no sensitive veteran information.';
  }
  if (!contact.legalConsent) {
    errors.legalConsent = 'Agree to the Terms of Use and acknowledge the Privacy Notice.';
  }

  if (Object.keys(errors).length) {
    return { ok: false, message: 'Please correct the highlighted fields.', errors, contact };
  }

  return { ok: true, contact };
}

async function sendContactEmail(contact) {
  const connectionString = process.env.CONTACT_EMAIL_CONNECTION_STRING;
  const senderAddress = process.env.CONTACT_EMAIL_SENDER;
  const recipientAddress = process.env.CONTACT_EMAIL_RECIPIENT || 'claimcompass@kneco.com';

  if (!connectionString || !senderAddress) {
    const error = new Error('Contact email service is not configured.');
    error.code = 'CONTACT_NOT_CONFIGURED';
    throw error;
  }

  let EmailClient;
  try {
    ({ EmailClient } = require('@azure/communication-email'));
  } catch {
    const error = new Error('Contact email dependency is unavailable.');
    error.code = 'CONTACT_DEPENDENCY_MISSING';
    throw error;
  }

  const client = new EmailClient(connectionString);
  const subjectOrganization = contact.organization.replace(/[\r\n]/g, ' ').slice(0, 80);
  const subject = `Claim Compass contact request — ${subjectOrganization}`;
  const submittedAt = new Date().toISOString();

  const plainText = [
    'New Claim Compass organizational contact request',
    '',
    `Organization: ${contact.organization}`,
    `Contact: ${contact.name}`,
    `Email: ${contact.email}`,
    `Role/accreditation context: ${contact.role || 'Not provided'}`,
    `Organization website: ${contact.organizationWebsite || 'Not provided'}`,
    `Primary interest: ${contact.interest}`,
    `Submitted: ${submittedAt}`,
    `Form version: ${contact.formVersion || 'Not provided'}`,
    '',
    'Message:',
    contact.message,
    '',
    'The submitter confirmed that no sensitive veteran information was included.',
    'The submitter agreed to the Terms of Use and acknowledged the Privacy Notice.'
  ].join('\n');

  const html = `
    <h2>New Claim Compass organizational contact request</h2>
    <table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
      <tr><th align="left">Organization</th><td>${escapeHtml(contact.organization)}</td></tr>
      <tr><th align="left">Contact</th><td>${escapeHtml(contact.name)}</td></tr>
      <tr><th align="left">Email</th><td>${escapeHtml(contact.email)}</td></tr>
      <tr><th align="left">Role/accreditation context</th><td>${escapeHtml(contact.role || 'Not provided')}</td></tr>
      <tr><th align="left">Organization website</th><td>${escapeHtml(contact.organizationWebsite || 'Not provided')}</td></tr>
      <tr><th align="left">Primary interest</th><td>${escapeHtml(contact.interest)}</td></tr>
      <tr><th align="left">Submitted</th><td>${escapeHtml(submittedAt)}</td></tr>
      <tr><th align="left">Form version</th><td>${escapeHtml(contact.formVersion || 'Not provided')}</td></tr>
    </table>
    <h3>Message</h3>
    <p style="white-space:pre-wrap">${escapeHtml(contact.message)}</p>
    <p><em>The submitter confirmed that no sensitive veteran information was included and agreed to the Terms of Use and Privacy Notice.</em></p>`;

  const emailMessage = {
    senderAddress,
    content: {
      subject,
      plainText,
      html
    },
    recipients: {
      to: [{ address: recipientAddress, displayName: 'Claim Compass' }]
    },
    replyTo: [{ address: contact.email, displayName: contact.name }],
    disableUserEngagementTracking: true
  };

  const poller = await client.beginSend(emailMessage);
  const result = await poller.pollUntilDone();
  if (result && result.status && result.status !== 'Succeeded') {
    throw new Error(`Email send did not succeed: ${result.status}`);
  }
}

async function handleContactRequest(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, { message: 'Method not allowed.' });
    return;
  }

  const contentType = String(req.headers['content-type'] || '').toLowerCase();
  if (!contentType.startsWith('application/json')) {
    sendJson(res, 415, { message: 'Unsupported request format.' });
    return;
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    sendJson(res, 429, { message: 'Too many requests were submitted. Please wait and try again, or email claimcompass@kneco.com.' });
    return;
  }

  try {
    const payload = await readJsonBody(req);
    const validation = validateContactPayload(payload);

    if (validation.silent) {
      sendJson(res, 200, { message: 'Thank you. Your request was received.' });
      return;
    }

    if (!validation.ok) {
      sendJson(res, 400, { message: validation.message, errors: validation.errors || {} });
      return;
    }

    await sendContactEmail(validation.contact);
    sendJson(res, 200, { message: 'Thank you. Your request was sent to the Claim Compass team.' });
  } catch (error) {
    if (error.statusCode) {
      sendJson(res, error.statusCode, { message: error.message });
      return;
    }

    console.error('Claim Compass contact request failed:', error.code || error.message);
    const configurationError = error.code === 'CONTACT_NOT_CONFIGURED' || error.code === 'CONTACT_DEPENDENCY_MISSING';
    sendJson(res, configurationError ? 503 : 502, {
      message: configurationError
        ? 'The contact form is temporarily unavailable while email delivery is being configured.'
        : 'The contact request could not be delivered right now.'
    });
  }
}

const server = http.createServer(async (req, res) => {
  setSecurityHeaders(res);

  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (requestUrl.pathname === '/api/contact') {
    await handleContactRequest(req, res);
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method not allowed');
    return;
  }

  if (requestUrl.pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(requestUrl.pathname);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad request');
    return;
  }

  if (pathname === '/') {
    pathname = '/index.html';
  }

  const relativePath = pathname.replace(/^\/+/, '');
  const pathParts = relativePath.split('/');
  if (pathParts.some((part) => part.startsWith('.'))) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const filePath = path.resolve(root, relativePath);
  if (!filePath.startsWith(`${root}${path.sep}`)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  if (req.method === 'HEAD') {
    fs.stat(filePath, (error, stats) => {
      if (error || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end();
        return;
      }
      const extension = path.extname(filePath).toLowerCase();
      res.setHeader('Content-Type', mimeTypes[extension] || 'application/octet-stream');
      res.setHeader('Content-Length', stats.size);
      res.writeHead(200);
      res.end();
    });
    return;
  }

  sendFile(res, filePath);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Claim Compass organization demo listening on port ${port}`);
});
