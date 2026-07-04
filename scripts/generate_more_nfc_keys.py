import os
import csv
import secrets
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NFC_DIR = ROOT / "nfc_keys"
NFC_DIR.mkdir(exist_ok=True)

MASTER_CSV = NFC_DIR / "CHAOSCORE_NFC_TAG_URLS_PRIVATE.csv"
MASTER_TXT = NFC_DIR / "WHAT_TO_WRITE_ON_TAGS.txt"

COUNT = int(os.environ.get("NFC_COUNT", "25"))

existing_rows = []
existing_numbers = []

if MASTER_CSV.exists():
    with MASTER_CSV.open("r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            existing_rows.append(row)
            try:
                existing_numbers.append(int(row["tag_number"]))
            except Exception:
                pass

start_number = max(existing_numbers, default=0) + 1
end_number = start_number + COUNT - 1

new_rows = []
sql_values = []

for i in range(start_number, end_number + 1):
    number = f"{i:03d}"
    raw_key = "bf_chaos_" + number + "_" + secrets.token_urlsafe(32)
    key_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
    url = f"https://lookapp.org/claim?key={raw_key}"
    label = f"CHAOSCORE NFC {number}"

    row = {
        "tag_number": number,
        "label": label,
        "url_to_write_on_nfc": url,
        "private_raw_key": raw_key,
        "sha256_hash_uploaded_to_supabase": key_hash,
    }

    new_rows.append(row)
    sql_values.append(f"('{key_hash}', '{label}', 'available')")

all_rows = existing_rows + new_rows

with MASTER_CSV.open("w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=[
        "tag_number",
        "label",
        "url_to_write_on_nfc",
        "private_raw_key",
        "sha256_hash_uploaded_to_supabase",
    ])
    writer.writeheader()
    writer.writerows(all_rows)

MASTER_TXT.write_text(
    "\n".join([f"{row['label']}: {row['url_to_write_on_nfc']}" for row in all_rows]) + "\n",
    encoding="utf-8"
)

batch_sql = NFC_DIR / f"ADD_CHAOSCORE_NFC_KEYS_{start_number:03d}_TO_{end_number:03d}.sql"
batch_txt = NFC_DIR / f"WRITE_ON_TAGS_{start_number:03d}_TO_{end_number:03d}.txt"

sql = f"""-- ADD CHAOSCORE NFC KEYS {start_number:03d} TO {end_number:03d}
-- Run this in Supabase SQL Editor.
-- IMPORTANT: these are hashes only, not the real raw keys.

insert into public.chaos_nfc_keys (
  key_hash,
  label,
  status
)
values
""" + ",\n".join(sql_values) + """
on conflict (key_hash) do nothing;
"""

batch_sql.write_text(sql, encoding="utf-8")

batch_txt.write_text(
    "\n".join([f"{row['label']}: {row['url_to_write_on_nfc']}" for row in new_rows]) + "\n",
    encoding="utf-8"
)

print(f"OK: generate {COUNT} nuove chiavi NFC.")
print(f"Range: {start_number:03d} → {end_number:03d}")
print("")
print("FILE MASTER AGGIORNATI:")
print(MASTER_CSV)
print(MASTER_TXT)
print("")
print("FILE NUOVI DA USARE PER QUESTO BATCH:")
print(batch_sql)
print(batch_txt)
print("")
print("PRIMO LINK NUOVO:")
print(new_rows[0]["label"] + " -> " + new_rows[0]["url_to_write_on_nfc"])
print("")
print("ULTIMO LINK NUOVO:")
print(new_rows[-1]["label"] + " -> " + new_rows[-1]["url_to_write_on_nfc"])
print("")
print("IMPORTANTE: nfc_keys/ è privata. Non fare git add di nfc_keys/.")
