import json
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether, Table, TableStyle, HRFlowable
from reportlab.graphics.shapes import Drawing, Rect, Line, String, Polygon
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output' / 'pdf' / 'PAC_AR_Navigation_Technical_Defense_Guide.pdf'
DATA = json.loads((Path(__file__).parent / 'defense_content.json').read_text(encoding='utf-8'))
OUT.parent.mkdir(parents=True, exist_ok=True)
FONT_DIR = Path('C:/Windows/Fonts')
pdfmetrics.registerFont(TTFont('Calibri', str(FONT_DIR / 'calibri.ttf')))
pdfmetrics.registerFont(TTFont('Calibri-Bold', str(FONT_DIR / 'calibrib.ttf')))
pdfmetrics.registerFont(TTFont('Calibri-Italic', str(FONT_DIR / 'calibrii.ttf')))
pdfmetrics.registerFontFamily('Calibri', normal='Calibri', bold='Calibri-Bold', italic='Calibri-Italic', boldItalic='Calibri-Bold')

INK = colors.HexColor('#17323C')
TEAL = colors.HexColor('#087F8C')
MUTED = colors.HexColor('#52636B')
RULE = colors.HexColor('#D4DFE3')
LIGHT = colors.HexColor('#EFF5F6')
WIDTH, HEIGHT = A4
MARGIN = 51
CONTENT_WIDTH = WIDTH - MARGIN * 2


def style(name, size, leading, **kwargs):
    options = dict(fontName='Calibri', fontSize=size, leading=leading, textColor=INK, alignment=TA_LEFT)
    options.update(kwargs)
    return ParagraphStyle(name, **options)


S = {
    'kicker': style('kicker', 9.5, 13, textColor=TEAL, fontName='Calibri-Bold', spaceAfter=8),
    'title': style('title', 28, 33, fontName='Calibri-Bold', spaceAfter=5),
    'subtitle': style('subtitle', 15, 20, textColor=TEAL, spaceAfter=12),
    'section': style('section', 22, 27, fontName='Calibri-Bold', spaceAfter=5),
    'section_sub': style('section_sub', 10.5, 14, textColor=MUTED, spaceAfter=18),
    'h2': style('h2', 12.5, 16, fontName='Calibri-Bold', spaceBefore=9, spaceAfter=7),
    'q': style('q', 13.5, 17, fontName='Calibri-Bold', spaceAfter=7),
    'answer': style('answer', 11.5, 15.2, spaceAfter=7),
    'cue': style('cue', 10.2, 13.4, textColor=TEAL, spaceAfter=6),
    'follow': style('follow', 10, 13.2, textColor=MUTED, spaceAfter=6),
    'evidence': style('evidence', 8.5, 11.2, textColor=MUTED, spaceAfter=0),
    'body': style('body', 11, 14.5, spaceAfter=7),
    'small': style('small', 9.2, 12, textColor=MUTED, spaceAfter=6),
    'table': style('table', 10.5, 13.5),
    'ref': style('ref', 9, 11.5, spaceAfter=8),
}


def p(text, key='body'):
    return Paragraph(text, S[key])


def table(rows, widths, header=False):
    cells = [[p(str(cell), 'table') for cell in row] for row in rows]
    t = Table(cells, colWidths=widths, hAlign='LEFT')
    commands = [('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 9),
                ('RIGHTPADDING', (0, 0), (-1, -1), 9),
                ('TOPPADDING', (0, 0), (-1, -1), 7),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
                ('LINEBELOW', (0, 0), (-1, -1), 0.5, RULE)]
    if header:
        commands += [('BACKGROUND', (0, 0), (-1, 0), LIGHT)]
    t.setStyle(TableStyle(commands))
    return t


def architecture():
    d = Drawing(CONTENT_WIDTH, 96)
    box_width = (CONTENT_WIDTH - 36) / 3
    for y, labels in [(57, ['Unity Android App', 'NestJS REST API', 'PostgreSQL']),
                      (5, ['Entrance Marker', 'ARCore + AR Anchor', 'Floor Chevrons'])]:
        for i, label in enumerate(labels):
            x = i * (box_width + 18)
            d.add(Rect(x, y, box_width, 30, fillColor=colors.white, strokeColor=RULE, strokeWidth=0.8))
            d.add(String(x + box_width / 2, y + 11, label, fontName='Calibri-Bold', fontSize=10.4, fillColor=INK, textAnchor='middle'))
            if i < 2:
                start = x + box_width + 3
                end = x + box_width + 15
                d.add(Line(start, y + 15, end, y + 15, strokeColor=TEAL, strokeWidth=1))
                d.add(Polygon([end, y + 15, end - 4, y + 17.5, end - 4, y + 12.5], fillColor=TEAL, strokeColor=TEAL))
    d.add(String(0, 90, 'SHARED DATA OVER HTTPS', fontName='Calibri', fontSize=7.8, fillColor=MUTED))
    d.add(String(0, 38, 'ALIGNMENT AND RENDERING ON EACH PHONE', fontName='Calibri', fontSize=7.8, fillColor=MUTED))
    return d


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, HEIGHT - 34, WIDTH - MARGIN, HEIGHT - 34)
    canvas.setFont('Calibri-Bold', 9)
    canvas.setFillColor(INK)
    canvas.drawString(MARGIN, HEIGHT - 25, 'PAC AR NAVIGATION')
    canvas.setFont('Calibri', 8.4)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(WIDTH - MARGIN, HEIGHT - 25, 'TECHNICAL DEFENSE PREPARATION')
    canvas.line(MARGIN, 37, WIDTH - MARGIN, 37)
    canvas.drawString(MARGIN, 24, 'Updated: 18 November 2026 | English answers + Bisaya cues')
    canvas.drawRightString(WIDTH - MARGIN, 24, str(doc.page))
    canvas.restoreState()


story = []
story += [p('24 QUESTIONS | PROJECT-SPECIFIC ANSWERS', 'kicker'),
          p('PAC AR Navigation', 'title'),
          p('Technical Defense Preparation', 'subtitle'),
          p('Suggested answers describe the current source implementation. Before presenting, confirm that the deployed API and installed APK contain the same changes. Use measured field results only when you have actually recorded them.', 'small'),
          p('A 45-second opening statement', 'h2'),
          p('Our project is a marker-assisted indoor AR navigation prototype for Philippine Advent College. An administrator records a route from a fixed entrance to a selected destination. Guests choose a room, align their phones with the same entrance image marker, and follow floor chevrons. Unity handles the AR experience, while a NestJS API and PostgreSQL store room information and shared route points. Our current demonstration focuses on known, same-floor routes, with explicit recovery when tracking is lost.'),
          p('Explain the two responsibilities', 'h2'), architecture(), Spacer(1, 7),
          p('What you can defend', 'h2'),
          p('<b>Implemented in source:</b> directory and person search, admin route recording, database persistence with readback verification, marker-based alignment, and floor chevrons. Person search and photo serving still require deployment verification.'),
          p('<b>Outside the validated scope:</b> arbitrary starting positions, automatic shortest paths, obstacle avoidance, reliable stairs, and Immersal-based positioning.'),
          p('Database snapshot: 17 November 2026', 'h2'),
          table([['Directory rooms', '<b>84</b>'], ['Stored AR routes / route points', '<b>9 / 28</b>'],
                 ['Active assigned-person records', '<b>18</b>'], ['Imported room photos / rooms with those photos', '<b>25 / 22</b>'],
                 ['Imported staff portraits', '<b>2</b>']], [340, CONTENT_WIDTH - 340]),
          Spacer(1, 5), p('These are stored-data counts, not proof that every room is calibrated or that any route has a measured success rate.', 'small'), PageBreak()]

number = 1
for section in DATA['sections']:
    story += [p(section['title'], 'section'), p(section['subtitle'], 'section_sub')]
    for i, item in enumerate(section['questions']):
        block = [p(f'{number:02d}. {escape(item["q"])}', 'q'),
                 p('<b>Suggested answer:</b> ' + escape(item['a']), 'answer'),
                 p('<b>Bisaya cue:</b> ' + escape(item['cue']), 'cue'),
                 p('<b>If pressed:</b> ' + escape(item['follow']), 'follow'),
                 p('<b>Evidence:</b> ' + escape(item['evidence']), 'evidence')]
        if i < 2:
            block += [Spacer(1, 13), HRFlowable(width='100%', thickness=0.5, color=RULE), Spacer(1, 13)]
        story.append(KeepTogether(block))
        number += 1
    story.append(PageBreak())

story += [p('Demo And Field Evaluation', 'section'),
          p('Show a repeatable workflow, then explain the results you actually measured.', 'section_sub'),
          p('Recommended demonstration order', 'h2')]
demo_steps = [
    '1. Confirm the API is reachable, the APK is current, and the fixed marker is printed at 15.5 x 15.5 cm.',
    '2. As admin, open one short same-floor route. If recording live, align the marker and floor, add actual turns, and save at the destination.',
    '3. Wait for the verified server-save confirmation. Explain why a local draft is not yet a shared route.',
    '4. On a second phone as guest, select the destination, scan the same marker, and follow the path. Show that guests cannot publish calibration.',
    '5. Reopen the guest app and scan again. Explain re-alignment, then show a person search such as Leodith or Myra without claiming it changes the route.'
]
story += [p(escape(step)) for step in demo_steps]
story += [p('Prepare a small, documented trial set', 'h2'),
          p('Use the same route and marked physical checkpoints on at least two supported phones. Record device model, Android version, route length, lighting, trial date, and any assistance. Include normal navigation, app restart, backgrounding, and tracking-loss recovery. Define a successful completion and an acceptable offset before collecting results.'),
          table([
              ['Measure', 'What to record', 'Your result'],
              ['Alignment time', 'Seconds until entrance alignment; report median and range.', '________'],
              ['Checkpoint offset', 'Measured arrow-to-reference error in meters; report typical and worst error.', '________'],
              ['Route completion', 'Completed trials / attempted trials, with a stated success criterion.', '________'],
              ['Restart / recovery', 'Correct re-alignments / attempts; record failures and required assistance.', '________'],
              ['Sustained use', 'Test duration, FPS if measured, thermal behavior, and tracking interruptions.', '________'],
          ], [103, 295, CONTENT_WIDTH - 398], header=True),
          Spacer(1, 9),
          p('<b>Answer pattern:</b> state the mechanism, show the evidence, explain the limit, then give the next improvement. If a result has not been measured, say so and explain how it will be measured.', 'body'),
          p('Functional software tests and compiler checks are useful evidence, but they are not substitutes for physical accuracy trials or an on-device visual check.', 'small'), PageBreak()]

story += [p('Evidence And References', 'section'),
          p('Use the code for app-specific behavior and the official references for platform concepts.', 'section_sub'),
          p('Code to have ready during the defense', 'h2')]
code_index = [
    '<b>AR alignment:</b> ARRouteLocalization.cs - marker stability, floor offset, runtime anchor, and recovery.',
    '<b>Route recording/rendering:</b> ARNavigationController.cs - turn capture, saved points, segment direction, and chevrons.',
    '<b>Shared persistence:</b> ar-navigation-routes.service.ts and schema.ts - transaction, route uniqueness, and ordered points.',
    '<b>Directory and access:</b> rooms.service.ts, admin-auth.guard.ts, admin-auth.service.ts, and admin-password.ts.',
    '<b>Tests:</b> ar-navigation-routes.test.ts, room-search.test.ts, room-media.test.ts, and unity-route-checks.ps1. Present test output as software evidence, not a field accuracy measurement.'
]
story += [p(line, 'small') for line in code_index]
story += [p('Terms worth explaining simply', 'h2'),
          p('<b>Pose:</b> position plus orientation. <b>Origin:</b> the common reference used to interpret local coordinates. <b>Anchor:</b> a runtime tracked pose used to keep virtual content aligned. <b>Waypoint:</b> a recorded point along a route. <b>Polyline:</b> connected straight segments. <b>Re-alignment:</b> finding the marker reference again after a session interruption.', 'small'),
          p('Official supporting references', 'h2')]
refs = [
    ('G1', 'Google ARCore - Fundamental concepts', 'https://developers.google.com/ar/develop/fundamentals'),
    ('U1', 'Unity AR Foundation 6.4 - Introduction to anchors', 'https://docs.unity3d.com/Packages/com.unity.xr.arfoundation@6.4/manual/features/anchors/introduction.html'),
    ('U2', 'Unity AR Foundation 6.4 - AR Tracked Image component', 'https://docs.unity3d.com/Packages/com.unity.xr.arfoundation@6.4/manual/features/image-tracking/artrackedimage.html'),
    ('S1', 'OWASP - Password Storage Cheat Sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html'),
    ('G2', 'Google ARCore - Supported devices', 'https://developers.google.com/ar/devices'),
    ('I1', 'Immersal - How does it work?', 'https://developers.immersal.com/docs/immersal-sdk/howdoesitwork/'),
]
for key, title, url in refs:
    story.append(p(f'<b>[{key}] {escape(title)}</b><br/><link href="{escape(url)}" color="#087F8C">{escape(url)}</link>', 'ref'))
story += [Spacer(1, 4), p('Official links are provided for further study; platform documentation can change. Immersal is cited only as future-work context; it is not installed in the reviewed application.', 'small')]

doc = SimpleDocTemplate(str(OUT), pagesize=A4, rightMargin=MARGIN, leftMargin=MARGIN,
                        topMargin=49, bottomMargin=49, title='PAC AR Navigation - Technical Defense Guide',
                        author='PAC AR Navigation Project', subject='24 panel questions, suggested answers, Bisaya cues, and evaluation preparation')
doc.build(story, onFirstPage=footer, onLaterPages=footer)
reader = PdfReader(str(OUT))
texts = [page.extract_text() or '' for page in reader.pages]
joined = '\n'.join(texts)
for section in DATA['sections']:
    for item in section['questions']:
        if item['q'] not in joined:
            raise RuntimeError(f'Missing question: {item["q"]}')
if '\u25a0' in joined or '\ufffd' in joined:
    raise RuntimeError('Unexpected missing-glyph character')
print(json.dumps({'pdf': str(OUT), 'pages': len(reader.pages), 'questions': number - 1, 'bytes': OUT.stat().st_size,
                  'words': len(joined.split()), 'page_text_lengths': [len(text) for text in texts]}, indent=2))
