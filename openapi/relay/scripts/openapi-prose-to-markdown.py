#!/usr/bin/env python3
"""Render every OpenAPI summary and description as a Markdown comparison file.

Requires PyYAML. Example:
    python3 scripts/openapi-prose-to-markdown.py openapi.yaml \
        --output comparison/openapi-current.md
"""

from __future__ import annotations

import argparse
import re
import subprocess
from pathlib import Path
from typing import Any, Iterator

try:
    import yaml
except ModuleNotFoundError as error:
    raise SystemExit("Install PyYAML to use this script: python3 -m pip install PyYAML") from error


HTTP_METHODS = {
    "get",
    "put",
    "post",
    "delete",
    "options",
    "head",
    "patch",
    "trace",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", nargs="?", type=Path, help="OpenAPI YAML file")
    parser.add_argument("--git-ref", help="Read openapi.yaml from this Git reference")
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--source-label")
    args = parser.parse_args()
    if bool(args.input) == bool(args.git_ref):
        parser.error("supply either an input file or --git-ref")
    return args


def load_source(args: argparse.Namespace) -> tuple[str, str]:
    if args.git_ref:
        source = subprocess.check_output(
            ["git", "show", f"{args.git_ref}:openapi.yaml"],
            text=True,
        )
        label = args.source_label or f"{args.git_ref}:openapi.yaml"
        return source, label

    source = args.input.read_text(encoding="utf-8")
    label = args.source_label or str(args.input)
    return source, label


def prose_fields(value: Any, path: tuple[Any, ...] = ()) -> Iterator[tuple[tuple[Any, ...], str]]:
    if isinstance(value, dict):
        for key, child in value.items():
            child_path = (*path, key)
            if key in {"summary", "description"} and isinstance(child, str):
                yield child_path, child
            else:
                yield from prose_fields(child, child_path)
    elif isinstance(value, list):
        for index, child in enumerate(value):
            yield from prose_fields(child, (*path, index))


def yaml_path(path: tuple[Any, ...]) -> str:
    result = ""
    for part in path:
        if isinstance(part, int):
            result += f"[{part}]"
        else:
            result += ("." if result else "") + str(part)
    return result


def field_heading(path: tuple[Any, ...], spec: dict[str, Any]) -> str:
    field = str(path[-1])

    if path == ("info", "description"):
        return "API overview"

    if len(path) >= 3 and path[0] == "tags" and isinstance(path[1], int):
        tag = spec["tags"][path[1]].get("name", f"tag {path[1]}")
        return f"Guide: {tag} — {field}"

    if len(path) >= 4 and path[0] == "paths" and path[2] in HTTP_METHODS:
        operation = f"{str(path[2]).upper()} {path[1]}"
        remainder = ".".join(str(part) for part in path[3:])
        return f"{operation} — {remainder}"

    if len(path) >= 4 and path[:2] == ("components", "schemas"):
        schema = path[2]
        remainder = ".".join(str(part) for part in path[3:])
        return f"Schema: {schema} — {remainder}"

    if len(path) >= 4 and path[:2] == ("components", "parameters"):
        parameter = path[2]
        remainder = ".".join(str(part) for part in path[3:])
        return f"Parameter: {parameter} — {remainder}"

    if len(path) >= 4 and path[:2] == ("components", "responses"):
        response = path[2]
        remainder = ".".join(str(part) for part in path[3:])
        return f"Response: {response} — {remainder}"

    return yaml_path(path)


def shift_markdown_headings(text: str) -> str:
    lines: list[str] = []
    in_fence = False
    for line in text.splitlines():
        if line.lstrip().startswith("```"):
            in_fence = not in_fence
            lines.append(line)
            continue
        match = None if in_fence else re.match(r"^(#{1,4})(\s+.*)$", line)
        if match:
            line = f"##{match.group(1)}{match.group(2)}"
        lines.append(line)
    return "\n".join(lines)


def render(spec: dict[str, Any], source_label: str) -> tuple[str, int]:
    title = spec.get("info", {}).get("title", "OpenAPI")
    version = spec.get("info", {}).get("version", "unknown")
    fields = list(prose_fields(spec))
    output = [
        f"# {title} documentation prose snapshot",
        "",
        f"> Source: `{source_label}`",
        f"> Specification version: `{version}`",
        "",
        "This file contains every OpenAPI `summary` and `description` field in source order.",
        "The YAML field path below each heading makes before-and-after comparison unambiguous.",
        "",
    ]

    for path, text in fields:
        output.extend(
            [
                f"## {field_heading(path, spec)}",
                "",
                f"`{yaml_path(path)}`",
                "",
                shift_markdown_headings(text).rstrip(),
                "",
            ]
        )

    return "\n".join(output).rstrip() + "\n", len(fields)


def main() -> None:
    args = parse_args()
    source, source_label = load_source(args)
    spec = yaml.safe_load(source)
    markdown, count = render(spec, source_label)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(markdown, encoding="utf-8")
    print(f"Wrote {args.output} with {count} prose fields")


if __name__ == "__main__":
    main()
