#!/usr/bin/env python3
"""Minimal dependency-free validation for the static Claim Compass demo."""
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
        if reference.startswith(("http://", "https://", "#", "data:")):
            continue
        if not (ROOT / reference).exists():
            fail(f"Missing referenced asset: {reference}")

    with (ROOT / "staticwebapp.config.json").open(encoding="utf-8") as handle:
        json.load(handle)

    script = (ROOT / "script.js").read_text(encoding="utf-8")
    required_conditions = {"lumbar", "migraine", "respiratory"}
    missing = {key for key in required_conditions if not re.search(rf"\b{key}\s*:", script)}
    if missing:
        fail(f"Missing mock condition data: {', '.join(sorted(missing))}")

    print("Static site validation passed.")


if __name__ == "__main__":
    main()
