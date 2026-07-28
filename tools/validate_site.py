#!/usr/bin/env python3
"""Dependency-free validation for the public Claim Compass organization demo."""
from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class SiteParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.ids: list[str] = []
        self.references: list[str] = []
        self.title_seen = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if values.get("id"):
            self.ids.append(values["id"] or "")
        if tag == "title":
            self.title_seen = True
        attr = {"link": "href", "script": "src", "img": "src"}.get(tag)
        if attr and values.get(attr):
            self.references.append(values[attr] or "")


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def main() -> None:
    index = ROOT / "index.html"
    if not index.exists():
        fail("index.html is missing")

    html = index.read_text(encoding="utf-8")
    parser = SiteParser()
    parser.feed(html)

    if not parser.title_seen or "Claim Compass" not in html:
        fail("Expected Claim Compass title/content was not found")

    duplicate_ids = sorted({item for item in parser.ids if parser.ids.count(item) > 1})
    if duplicate_ids:
        fail(f"Duplicate HTML IDs: {', '.join(duplicate_ids)}")

    for reference in parser.references:
        if reference.startswith(("http://", "https://", "mailto:", "#", "data:")):
            continue
        reference_path = reference.split("?", 1)[0].split("#", 1)[0]
        if not (ROOT / reference_path).exists():
            fail(f"Missing referenced asset: {reference}")

    required_html = {
        'id="contact-form"': "live contact form",
        'action="/api/contact"': "contact API action",
        'claimcompass@kneco.com': "public contact mailbox",
        'name="legalConsent"': "affirmative legal consent",
        'name="organizationWebsite"': "organization website field",
        'name="companyFax"': "hidden bot-trap field",
        'minlength="30"': "minimum inquiry length",
        'claim-compass-logo-mark.svg': "canonical Claim Compass logo",
        'href="terms.html"': "Terms of Use link",
        'href="privacy.html"': "Privacy Notice link",
        'content="index, follow"': "public robots metadata",
        'rel="canonical" href="https://claimcompass-demo.kneco.com/"': "canonical URL",
    }
    for needle, description in required_html.items():
        if needle not in html:
            fail(f"Missing {description}")

    forbidden_text = {
        "before public deployment",
        "contact routing can be connected",
        "noindex, nofollow",
        "copy discussion request",
    }
    lowered = html.lower()
    found = sorted(text for text in forbidden_text if text in lowered)
    if found:
        fail(f"Pre-public placeholder language remains: {', '.join(found)}")

    for legal_page, title in (("terms.html", "Terms of Use"), ("privacy.html", "Privacy Notice")):
        legal_path = ROOT / legal_page
        if not legal_path.exists():
            fail(f"{legal_page} is missing")
        legal_html = legal_path.read_text(encoding="utf-8")
        legal_parser = SiteParser()
        legal_parser.feed(legal_html)
        if title not in legal_html or not legal_parser.title_seen:
            fail(f"{legal_page} does not contain the expected title")
        duplicates = sorted({item for item in legal_parser.ids if legal_parser.ids.count(item) > 1})
        if duplicates:
            fail(f"Duplicate HTML IDs in {legal_page}: {', '.join(duplicates)}")
        for reference in legal_parser.references:
            if reference.startswith(("http://", "https://", "mailto:", "#", "data:")):
                continue
            reference_path = reference.split("?", 1)[0].split("#", 1)[0]
            if not (ROOT / reference_path).exists():
                fail(f"Missing referenced asset in {legal_page}: {reference}")


    for asset in (
        "favicon.ico", "favicon.svg", "favicon-16x16.png", "favicon-32x32.png",
        "apple-touch-icon.png", "android-chrome-192x192.png", "android-chrome-512x512.png",
        "assets/claim-compass-logo-mark.svg", "assets/claim-compass-logo-mark-header.svg",
    ):
        if not (ROOT / asset).exists():
            fail(f"Required brand asset is missing: {asset}")

    with (ROOT / "staticwebapp.config.json").open(encoding="utf-8") as handle:
        json.load(handle)

    package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
    if "@azure/communication-email" not in package.get("dependencies", {}):
        fail("Azure Communication Services Email dependency is missing")

    script = (ROOT / "script.js").read_text(encoding="utf-8")
    required_conditions = {"lumbar", "migraine", "respiratory"}
    missing = {key for key in required_conditions if not re.search(rf"\b{key}\s*:", script)}
    if missing:
        fail(f"Missing mock condition data: {', '.join(sorted(missing))}")
    if 'fetch("/api/contact"' not in script:
        fail("Contact-form client submission is missing")

    server = (ROOT / "server.js").read_text(encoding="utf-8")
    for needle in ("/api/contact", "CONTACT_EMAIL_CONNECTION_STRING", "CONTACT_EMAIL_SENDER", "legalConsent", "organizationWebsite", "allowedInterests", "sensitiveIdentifierPattern"):
        if needle not in server:
            fail(f"Contact API contract is missing {needle}")

    robots = (ROOT / "robots.txt").read_text(encoding="utf-8")
    if "Disallow: /" in robots or "Allow: /" not in robots:
        fail("robots.txt is not configured for the live public site")

    sitemap_path = ROOT / "sitemap.xml"
    if not sitemap_path.exists():
        fail("sitemap.xml is missing")
    sitemap = sitemap_path.read_text(encoding="utf-8")
    for url in ("https://claimcompass-demo.kneco.com/terms.html", "https://claimcompass-demo.kneco.com/privacy.html"):
        if url not in sitemap:
            fail(f"sitemap.xml is missing {url}")

    print("Public site validation passed.")


if __name__ == "__main__":
    main()
