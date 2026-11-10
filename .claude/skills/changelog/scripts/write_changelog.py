#!/usr/bin/env python3
"""Insert or replace one version entry in the readme.txt `== Changelog ==` section.

Usage:
    write_changelog.py --readme readme.txt --version 1.0.2 --entries entries.txt

`entries.txt` holds the finished bullet lines (`* New: - ...`), one per line.

- If `= <version> - <date> =` already exists, its bullets are replaced and the
  date is kept.
- If not, a new entry with today's date is added at the top of the section.
"""

import argparse
import datetime
import re
import sys


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--readme", required=True)
    parser.add_argument("--version", required=True)
    parser.add_argument("--entries", required=True)
    args = parser.parse_args()

    with open(args.entries, encoding="utf-8") as f:
        entries = [line.rstrip() for line in f if line.strip()]
    if not entries:
        print("error: entries file is empty", file=sys.stderr)
        return 1

    with open(args.readme, encoding="utf-8") as f:
        lines = f.read().split("\n")

    try:
        start = next(i for i, l in enumerate(lines) if l.strip() == "== Changelog ==")
    except StopIteration:
        print("error: no '== Changelog ==' section in readme", file=sys.stderr)
        return 1

    # The section ends at the next `== Heading ==` line or at EOF.
    end = next(
        (i for i in range(start + 1, len(lines)) if re.match(r"^== .+ ==\s*$", lines[i])),
        len(lines),
    )

    header_re = re.compile(r"^= (\S+)(?: - (.+?))? =\s*$")
    version_headers = [i for i in range(start + 1, end) if header_re.match(lines[i])]

    existing = next(
        (i for i in version_headers if header_re.match(lines[i]).group(1) == args.version),
        None,
    )

    if existing is not None:
        date = header_re.match(lines[existing]).group(2) or ""
        block_end = next((i for i in version_headers if i > existing), end)
        new_block = [lines[existing], ""] + entries + [""]
        lines[existing:block_end] = new_block
        status = "replaced"
    else:
        date = datetime.date.today().strftime("%b %d, %Y")
        new_block = [f"= {args.version} - {date} =", ""] + entries + [""]
        insert_at = start + 1
        # Keep one blank line after the section heading.
        while insert_at < end and lines[insert_at].strip() == "":
            insert_at += 1
        lines[start + 1:insert_at] = [""] + new_block
        status = "inserted"

    with open(args.readme, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    stable = next(
        (m.group(1) for l in lines if (m := re.match(r"^Stable tag:\s*(\S+)", l))),
        None,
    )

    print(f"status: {status}")
    print(f"version: {args.version}")
    print(f"date: {date}")
    print(f"entries: {len(entries)}")
    if stable != args.version:
        print(f"warning: Stable tag is {stable}, changelog version is {args.version}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
