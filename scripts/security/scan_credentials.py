import json
import re
import subprocess
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
TEXT_SUFFIXES = {".ts", ".tsx", ".js", ".mjs", ".cjs", ".json", ".yaml", ".yml", ".sql", ".sh", ".md", ".toml", ".ini", ".env", ".example"}
PATTERNS = [
    ("credential-in-url", re.compile(r"(?:postgres(?:ql)?|mysql|redis)://[^\s:/]+:[^\s@]+@", re.I)),
    ("literal-password-hash-input", re.compile(r"\bcrypt\s*\(\s*'[^']+'", re.I)),
    ("private-key", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----")),
]
ASSIGN = re.compile(r"(?i)\b(?:POSTGRES_PASSWORD|PGPASSWORD|MINIO_ROOT_PASSWORD|DEMO_PASSWORD|PASSWORD|API_KEY|CLIENT_SECRET)\b[\"']?\s*[:=]\s*(.+)")


def findings_text(text):
    found = []
    for number, line in enumerate(text.splitlines(), 1):
        for kind, pattern in PATTERNS:
            if pattern.search(line):
                found.append({"location": str(number), "kind": kind})
        match = ASSIGN.search(line)
        if match:
            value = match.group(1).strip().rstrip(",;").strip()
            literal = value.strip("\"'")
            if literal and not any(marker in value for marker in ("${", "process.env", "os.environ", "getenv(", "secrets.", "vars.")) and not value.startswith(("String(", "body.", "input.", "env[", "event.", "e.", "random", "generate")) and literal not in ("null", "undefined", "None", "false", "true"):
                found.append({"location": str(number), "kind": "literal-sensitive-assignment"})
    return found


def findings_workbook(source):
    found = []
    with zipfile.ZipFile(source) as archive:
        xml_entries = [e for e in archive.infolist() if e.filename.endswith(".xml")]
        if sum(e.file_size for e in xml_entries) > 32 * 1024 * 1024:
            raise ValueError("workbook-size-limit")
        shared = []
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            shared = ["".join(item.itertext()) for item in root.findall("s:si", NS)]
        for entry in xml_entries:
            if not re.fullmatch(r"xl/worksheets/sheet[0-9]+\.xml", entry.filename):
                continue
            root = ET.fromstring(archive.read(entry.filename))
            sensitive_columns = {}
            for row in root.findall("s:sheetData/s:row", NS):
                for cell in row.findall("s:c", NS):
                    address = cell.attrib.get("r", "")
                    column = re.sub(r"[0-9]", "", address)
                    value = cell.findtext("s:v", default="", namespaces=NS)
                    if cell.attrib.get("t") == "s":
                        value = shared[int(value)]
                    elif cell.attrib.get("t") == "inlineStr":
                        value = "".join(cell.find("s:is", NS).itertext())
                    label = re.sub(r"[^a-z]", "", value.lower())
                    if label in {"password", "motdepasse", "apikey", "clientsecret", "accesstoken", "refreshtoken"}:
                        sensitive_columns[column] = int(row.attrib.get("r", "0"))
                    elif column in sensitive_columns and value.strip() and int(row.attrib.get("r", "0")) > sensitive_columns[column]:
                        found.append({"location": entry.filename + ":" + address, "kind": "workbook-credential-column"})
    return found


def scan(root, paths):
    found, errors, skipped = [], [], []
    base = root.resolve()
    for relative in paths:
        path = root / relative
        try:
            if path.is_symlink() or not path.resolve().is_relative_to(base):
                raise ValueError("unsafe-path")
            if not path.is_file():
                raise ValueError("tracked-file-unavailable")
            if path.suffix.lower() in {".xlsx", ".xlsm"}:
                entries = findings_workbook(path)
            elif path.suffix.lower() in TEXT_SUFFIXES or path.name in {"Dockerfile", "Makefile"}:
                entries = findings_text(path.read_text(encoding="utf-8"))
            else:
                skipped.append(relative)
                continue
            found.extend({"path": relative, **entry} for entry in entries)
        except Exception:
            errors.append({"path": relative, "kind": "scan-incomplete"})
    return {"findings": found, "errors": errors, "unsupported_paths": skipped, "scope": "tracked working-tree text and OOXML credential columns; no Git history or arbitrary token guarantee"}


def main():
    process = subprocess.run(["git", "ls-files", "-z"], capture_output=True, check=False)
    if process.returncode:
        print(json.dumps({"errors": [{"kind": "git-inventory-unavailable"}]}))
        return 2
    paths = [p.decode("utf-8", errors="strict") for p in process.stdout.split(b"\0") if p]
    report = scan(Path.cwd(), paths)
    print(json.dumps(report, ensure_ascii=True, indent=2))
    return 2 if report["errors"] else 1 if report["findings"] else 0


if __name__ == "__main__":
    sys.exit(main())
