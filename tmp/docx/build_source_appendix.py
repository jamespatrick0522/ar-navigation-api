from pathlib import Path
import re
import textwrap
import json

from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT = Path(__file__).resolve().parents[2]
REFERENCE = Path('D:/Downloads/arfawdasdasdasdasdasda.docx')
UNITY = Path('D:/Unity Projects/AR Navigation App/Assets/Scripts')
OUT = ROOT / 'output/docx/PAC_AR_Navigation_Source_Code_Appendix.docx'
OUT.parent.mkdir(parents=True, exist_ok=True)


def function(path, signature):
    lines = path.read_text(encoding='utf-8-sig').splitlines()
    start = next(i for i, line in enumerate(lines) if line.strip().startswith(signature))
    indent = len(lines[start]) - len(lines[start].lstrip())
    end = next(i for i in range(start + 1, len(lines)) if lines[i] == ' ' * indent + '}')
    return textwrap.dedent('\n'.join(lines[start:end + 1])), start + 1, end + 1


def block(path, signature):
    code, first, last = function(path, signature)
    relative = str(path.relative_to(UNITY.parent.parent)).replace('\\', '/') if path.is_relative_to(UNITY) else str(path.relative_to(ROOT)).replace('\\', '/')
    return {'code': code, 'source': f'{relative} (lines {first}-{last})'}


auth = ROOT / 'src/modules/admin-auth/admin-auth.service.ts'
rooms = ROOT / 'src/modules/rooms/rooms.service.ts'
routes = ROOT / 'src/modules/ar-navigation-routes/ar-navigation-routes.service.ts'
controller = UNITY / 'ARNavigationController.cs'
localization = UNITY / 'ARRouteLocalization.cs'
search_lines = rooms.read_text(encoding='utf-8').splitlines()
search_start = next(i for i, line in enumerate(search_lines) if 'async listRooms(' in line)
search_end = next(i for i in range(search_start, len(search_lines)) if 'if (query.category)' in search_lines[i])
search_code = textwrap.dedent('\n'.join(search_lines[search_start:search_end]).rstrip())

entries = [
    ('A1 Admin Login', 'Validates an active administrator account and password before returning a signed access token.', [block(auth, 'async login(')]),
    ('A2 Room and Assigned Person Search', 'Selected matching block from listRooms. Every entered name word must match the same active person, regardless of role or primary status. The remainder of the function applies filters, executes the query, and formats results.', [
        {'source': f'src/modules/rooms/rooms.service.ts (lines {search_start + 1}-{search_end}; matching block excerpt)', 'code': search_code + '\n  // Remaining listRooms query and response code omitted.\n}'}]),
    ('A3 Transactional Route Saving', 'Validates and sorts route points, then replaces the route and its points within one database transaction.', [block(routes, 'async saveRoomRoute(')]),
    ('A4 Marker Orientation', 'Projects a marker axis onto the horizontal plane to construct a gravity-aligned reference pose.', [block(localization, 'public static Pose MarkerPose(')]),
    ('A5 Camera Position in Route Coordinates', 'Rejects recording when alignment is not ready and converts the camera position into the marker reference frame.', [block(controller, 'bool TryGetCameraPoseInMarkerSpace(')]),
    ('A6 Directional Chevron Placement', 'Computes each segment direction and spaces chevrons along it. Each chevron follows the segment orientation and receives the configured vertical offset.', [block(controller, 'void CreateSegment('), block(controller, 'void CreateChevron(')]),
    ('A7 Saved Route Verification', 'Compares a returned route with the submitted point count, floor offset, point metadata, and coordinates before accepting it as a matching save.', [block(controller, 'internal static bool RouteMatches(')]),
]

doc = Document(REFERENCE)
for element in list(doc.element.body):
    if element.tag != qn('w:sectPr'):
        doc.element.body.remove(element)
for section in doc.sections:
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    section.top_margin = section.bottom_margin = Inches(1)
    section.left_margin = section.right_margin = Inches(1)

for name in ['Normal', 'Title', 'Heading 1', 'Heading 2']:
    style = doc.styles[name]
    style.font.name = 'Times New Roman'
    style.font.color.rgb = RGBColor(0, 0, 0)
    style.font.size = Pt(12)
    style.paragraph_format.space_after = Pt(6)
    style.paragraph_format.line_spacing = 1.0
doc.styles['Title'].font.bold = True
doc.styles['Title'].font.size = Pt(14)
doc.styles['Heading 1'].font.bold = True
doc.styles['Heading 2'].font.bold = True

if 'Source Code' not in doc.styles:
    doc.styles.add_style('Source Code', 1)
code_style = doc.styles['Source Code']
code_style.font.name = 'Consolas'
code_style.font.size = Pt(9)
code_style.font.color.rgb = RGBColor(0, 0, 0)
code_style.paragraph_format.space_after = Pt(0)
code_style.paragraph_format.space_before = Pt(0)
code_style.paragraph_format.line_spacing = Pt(10.5)
code_style.paragraph_format.keep_with_next = False
code_style.paragraph_format.widow_control = False

doc.add_paragraph('Appendices', 'Title')
doc.add_paragraph('Appendix A Relevant Source Code', 'Heading 1')
doc.add_paragraph('Selected API and Unity functions for authentication, directory search, route persistence, marker alignment, and AR guidance. Imports and surrounding classes are omitted.')

report = []
for index, (title, description, blocks) in enumerate(entries):
    if index and index != 4:
        doc.add_page_break()
    doc.add_paragraph(title, 'Heading 2')
    doc.add_paragraph(description)
    total_lines = 0
    for item in blocks:
        source_p = doc.add_paragraph(item['source'])
        source_p.paragraph_format.keep_with_next = True
        for run in source_p.runs:
            run.font.size = Pt(9)
            run.italic = True
        for line in item['code'].splitlines():
            # Word soft-wraps long code; explicit continuation indentation keeps it readable.
            indent = len(line) - len(line.lstrip())
            wrapped = textwrap.wrap(line, width=88, subsequent_indent=' ' * (indent + 4),
                                    replace_whitespace=False, drop_whitespace=True,
                                    break_long_words=False, break_on_hyphens=False) if line else ['']
            p = doc.add_paragraph(style='Source Code')
            p.add_run('\n'.join(wrapped))
            p.paragraph_format.keep_together = True
            total_lines += len(wrapped)
        doc.add_paragraph().paragraph_format.space_after = Pt(3)
    report.append({'section': title, 'code_lines': total_lines})

doc.core_properties.title = 'PAC AR Navigation Source Code Appendix'
doc.core_properties.subject = 'Selected API and Unity functions and algorithms'
doc.core_properties.author = 'PAC AR Navigation Project'
doc.save(OUT)
check = Document(OUT)
text = '\n'.join(p.text for p in check.paragraphs)
assert all(title in text for title, _, _ in entries)
assert 'establishmentsRepository' not in text and 'agora' not in text
assert len(check.tables) == 0
print(json.dumps({'output': str(OUT), 'bytes': OUT.stat().st_size, 'sections': report}, indent=2))
