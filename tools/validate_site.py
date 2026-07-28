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
    for needle in ("/api/contact", "CONTACT_EMAIL_CONNECTION_STRING", "CONTACT_EMAIL_SENDER"):
        if needle not in server:
            fail(f"Contact API contract is missing {needle}")

    robots = (ROOT / "robots.txt").read_text(encoding="utf-8")
    if "Disallow: /" in robots or "Allow: /" not in robots:
        fail("robots.txt is not configured for the live public site")

    if not (ROOT / "sitemap.xml").exists():
        fail("sitemap.xml is missing")

    print("Public site validation passed.")


if __name__ == "__main__":
    main()
