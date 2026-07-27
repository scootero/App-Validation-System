#!/usr/bin/env python3
"""Temporary read-only Meta Marketing API call validator.

GET-only. Counts toward Meta's app call quota for the 500-call requirement.
Never prints, saves, or commits META_ACCESS_TOKEN.

Defaults: 20 sequential calls, 2–3s delay, stop on first non-200 / Meta error.
Raise --max-calls later only after Meta's dashboard confirms the first batch counted.
"""

from __future__ import annotations

import argparse
import json
import os
import random
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

API_VERSION = os.environ.get("META_API_VERSION", "v25.0")
GRAPH_BASE = f"https://graph.facebook.com/{API_VERSION}"

AD_ACCOUNT_ID = os.environ.get("META_AD_ACCOUNT_ID", "act_979257825150251")
PAGE_ID = os.environ.get("META_PAGE_ID", "1237104852815793")
INSTAGRAM_USER_ID = os.environ.get("META_INSTAGRAM_USER_ID", "17841440875992246")

# Verified / expected-safe GET surfaces for this sandbox account.
# Rotation order covers: account, campaigns, adsets, ads, creatives,
# Pages, Instagram, images, insights.
ENDPOINTS: list[tuple[str, str]] = [
    (
        "account_details",
        f"/{AD_ACCOUNT_ID}"
        "?fields=id,account_id,name,account_status,currency,timezone_name,business{id,name}",
    ),
    (
        "campaigns",
        f"/{AD_ACCOUNT_ID}/campaigns?fields=id,name,status,effective_status&limit=1",
    ),
    (
        "adsets",
        f"/{AD_ACCOUNT_ID}/adsets?fields=id,name,status,effective_status&limit=1",
    ),
    (
        "ads",
        f"/{AD_ACCOUNT_ID}/ads?fields=id,name,status,effective_status&limit=1",
    ),
    (
        "adcreatives",
        f"/{AD_ACCOUNT_ID}/adcreatives?fields=id,name,status&limit=1",
    ),
    (
        "page",
        f"/{PAGE_ID}?fields=id,name,is_published,instagram_business_account{{id,username}}",
    ),
    (
        "instagram",
        f"/{INSTAGRAM_USER_ID}?fields=id,username,name",
    ),
    (
        "adimages",
        f"/{AD_ACCOUNT_ID}/adimages?fields=hash,name,status&limit=1",
    ),
    (
        "insights",
        f"/{AD_ACCOUNT_ID}/insights"
        "?fields=impressions,clicks,spend&date_preset=maximum&limit=1",
    ),
]

USAGE_HEADERS = (
    "x-app-usage",
    "x-ad-account-usage",
    "x-business-use-case-usage",
)


def die(msg: str, code: int = 1) -> None:
    print(f"FATAL: {msg}", file=sys.stderr)
    raise SystemExit(code)


def redact_secrets(text: str, token: str) -> str:
    if not token:
        return text
    return text.replace(token, "[REDACTED]")


def build_url(path_and_query: str, token: str) -> str:
    sep = "&" if "?" in path_and_query else "?"
    return f"{GRAPH_BASE}{path_and_query}{sep}access_token={urllib.parse.quote(token, safe='')}"


def loggable_endpoint(name: str, path_and_query: str) -> str:
    return f"{name} GET {GRAPH_BASE}{path_and_query}"


def extract_usage(headers: Any) -> dict[str, str]:
    usage: dict[str, str] = {}
    for key in USAGE_HEADERS:
        value = headers.get(key)
        if value:
            usage[key] = value
    return usage


def get_json(url: str, token: str, timeout: float = 60.0) -> tuple[int, dict[str, Any] | list[Any] | None, dict[str, str], str]:
    req = urllib.request.Request(url, method="GET")
    req.add_header("Accept", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            status = getattr(resp, "status", None) or resp.getcode()
            raw = resp.read().decode("utf-8", errors="replace")
            usage = extract_usage(resp.headers)
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        usage = extract_usage(exc.headers)
        return exc.code, None, usage, redact_secrets(raw, token)
    except urllib.error.URLError as exc:
        return 0, None, {}, redact_secrets(str(exc.reason), token)

    try:
        body: dict[str, Any] | list[Any] | None = json.loads(raw) if raw else None
    except json.JSONDecodeError:
        return status, None, usage, redact_secrets(raw[:500], token)

    return status, body, usage, ""


def meta_error_message(body: dict[str, Any] | list[Any] | None) -> str | None:
    if not isinstance(body, dict):
        return None
    err = body.get("error")
    if not isinstance(err, dict):
        return None
    parts = [
        str(err.get("message") or "Meta API error"),
        f"type={err.get('type')}" if err.get("type") else "",
        f"code={err.get('code')}" if err.get("code") is not None else "",
        f"fbtrace_id={err.get('fbtrace_id')}" if err.get("fbtrace_id") else "",
    ]
    return " | ".join(p for p in parts if p)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Read-only Meta Marketing API call validator (GET only).",
    )
    p.add_argument(
        "--max-calls",
        type=int,
        default=20,
        help="Hard cap on GET calls for this run (default: 20). Raise only after dashboard confirms count.",
    )
    p.add_argument(
        "--delay-min",
        type=float,
        default=2.0,
        help="Minimum seconds between calls (default: 2.0).",
    )
    p.add_argument(
        "--delay-max",
        type=float,
        default=3.0,
        help="Maximum seconds between calls (default: 3.0).",
    )
    p.add_argument(
        "--skip-validate-pass",
        action="store_true",
        help="Skip the one-shot validation pass and only rotate until --max-calls.",
    )
    return p.parse_args()


def sleep_between(delay_min: float, delay_max: float) -> None:
    if delay_max < delay_min:
        die("--delay-max must be >= --delay-min")
    delay = random.uniform(delay_min, delay_max)
    print(f"  sleep {delay:.2f}s")
    time.sleep(delay)


def main() -> None:
    args = parse_args()
    if args.max_calls < 1:
        die("--max-calls must be >= 1")

    token = os.environ.get("META_ACCESS_TOKEN", "").strip()
    if not token:
        die("META_ACCESS_TOKEN is not set in the environment")

    if len(ENDPOINTS) > args.max_calls and not args.skip_validate_pass:
        die(
            f"{len(ENDPOINTS)} endpoints selected but --max-calls={args.max_calls}; "
            "need at least one call per endpoint for the validation pass, "
            "or pass --skip-validate-pass"
        )

    success = 0
    failure = 0
    calls = 0

    print("Meta Marketing API read-only validator")
    print(f"  api_version={API_VERSION}")
    print(f"  ad_account={AD_ACCOUNT_ID}")
    print(f"  page_id={PAGE_ID}")
    print(f"  instagram_user_id={INSTAGRAM_USER_ID}")
    print(f"  endpoints={len(ENDPOINTS)}")
    print(f"  max_calls={args.max_calls}")
    print(f"  delay={args.delay_min}-{args.delay_max}s")
    print(f"  method=GET_ONLY")
    print()

    def one_call(name: str, path_and_query: str, phase: str) -> None:
        nonlocal success, failure, calls
        if calls >= args.max_calls:
            return

        calls += 1
        label = loggable_endpoint(name, path_and_query)
        print(f"[{calls}/{args.max_calls}] phase={phase} {label}")

        url = build_url(path_and_query, token)
        status, body, usage, err_raw = get_json(url, token)
        usage_str = json.dumps(usage, separators=(",", ":")) if usage else "{}"

        meta_err = meta_error_message(body)
        ok = status == 200 and meta_err is None

        if ok:
            success += 1
            print(f"  status={status} result=SUCCESS usage={usage_str}")
        else:
            failure += 1
            detail = meta_err or err_raw or "non-200 or empty/invalid body"
            print(f"  status={status} result=FAILURE usage={usage_str}")
            print(f"  detail={redact_secrets(detail, token)}")
            print()
            print(f"Totals: success={success} failure={failure} calls={calls}")
            die(f"Stopped on first failure at call {calls}: {label}")

        if calls < args.max_calls:
            sleep_between(args.delay_min, args.delay_max)

    # Pass 1: validate every selected endpoint once before looping.
    if not args.skip_validate_pass:
        print("--- validation pass (each endpoint once) ---")
        for name, path in ENDPOINTS:
            one_call(name, path, "validate")
        print("--- validation pass complete ---")
        print()

    # Pass 2: rotate until max-calls.
    print("--- rotation loop ---")
    idx = 0
    while calls < args.max_calls:
        name, path = ENDPOINTS[idx % len(ENDPOINTS)]
        one_call(name, path, "rotate")
        idx += 1

    print()
    print(f"Totals: success={success} failure={failure} calls={calls}")
    print("Done. Check Meta app dashboard before raising --max-calls for remaining quota.")


if __name__ == "__main__":
    main()
