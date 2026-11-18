from pathlib import Path
import json
import re

from PIL import Image, ImageOps, ImageDraw
from pypdf import PdfReader

root = Path(__file__).resolve().parents[2]
folder = root / 'tmp' / 'pdfs'
files = sorted(folder.glob('defense-page-*.png'))
if len(files) != 11:
    raise RuntimeError(f'Expected 11 rendered pages, got {len(files)}')
thumb_w, thumb_h = 298, 422
sheet = Image.new('RGB', (4 * (thumb_w + 14) + 14, 3 * (thumb_h + 29) + 14), '#dbe4e8')
draw = ImageDraw.Draw(sheet)
for i, file in enumerate(files):
    image = Image.open(file).convert('RGB')
    image.thumbnail((thumb_w, thumb_h))
    x = 14 + (i % 4) * (thumb_w + 14)
    y = 14 + (i // 4) * (thumb_h + 29)
    sheet.paste(image, (x, y))
    draw.text((x, y + thumb_h + 4), f'Page {i + 1}', fill='#17323c')
sheet.save(folder / 'defense-contact-sheet.png')
reader = PdfReader(root / 'output' / 'pdf' / 'PAC_AR_Navigation_Technical_Defense_Guide.pdf')
report = []
for index, page in enumerate(reader.pages):
    text = page.extract_text() or ''
    numbers = re.findall(r'^([0-2][0-9])\. ', text, re.M)
    if 1 <= index <= 8 and len(numbers) != 3:
        raise RuntimeError(f'Question pagination issue on page {index + 1}: {numbers}')
    report.append({'page': index + 1, 'questions': numbers})
print(json.dumps({'pages_checked': len(files), 'question_pagination': report, 'contact_sheet': str(folder / 'defense-contact-sheet.png')}, indent=2))
