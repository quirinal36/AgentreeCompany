from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
from pathlib import Path

W, H = 2480, 3508  # A4 portrait @ ~300dpi
OUT = Path('/home/leehg/Documents/AgentreeCompany/DesignTeam/2026-07-04_jeonbuk-regional-development_infographic.png')
FONT_REG = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
FONT_BOLD = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
FONT_MED = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'

def font(size, bold=False, med=False):
    return ImageFont.truetype(FONT_BOLD if bold else (FONT_MED if med else FONT_REG), size)

# Palette: regional/balanced/growth — deep sea, fresh green, warm yellow, clay red
BG = (244, 247, 239)
INK = (29, 45, 54)
MUTED = (91, 107, 112)
GREEN = (42, 126, 93)
TEAL = (32, 141, 151)
NAVY = (25, 70, 96)
YELLOW = (239, 178, 65)
ORANGE = (225, 118, 62)
RED = (197, 73, 76)
BLUE = (82, 122, 190)
PAPER = (255, 253, 246)
LINE = (218, 224, 211)

img = Image.new('RGB', (W, H), BG)
d = ImageDraw.Draw(img)

# Subtle paper grid and organic background
for x in range(0, W, 80):
    d.line((x, 0, x, H), fill=(232, 237, 226), width=1)
for y in range(0, H, 80):
    d.line((0, y, W, y), fill=(232, 237, 226), width=1)
for cx, cy, r, col in [(2180, 240, 430, (224, 239, 221)), (240, 3080, 520, (232, 241, 232)), (2060, 3180, 340, (239, 231, 205))]:
    d.ellipse((cx-r, cy-r, cx+r, cy+r), fill=col)

# Decorative balanced arcs
for i, col in enumerate([(201,222,208), (223,232,216), (235,220,190)]):
    bbox = (120+i*55, 180+i*35, W-120-i*55, 910-i*20)
    d.arc(bbox, start=190, end=350, fill=col, width=12)

# Utilities
def text_size(text, f):
    b = d.textbbox((0,0), text, font=f)
    return b[2]-b[0], b[3]-b[1]

def wrap_text(text, f, max_w):
    lines, cur = [], ''
    # Korean-friendly greedy char wrap, keeps spaces where present
    for ch in text:
        trial = cur + ch
        if ch == '\n':
            lines.append(cur); cur = ''; continue
        if text_size(trial, f)[0] <= max_w or not cur:
            cur = trial
        else:
            lines.append(cur.rstrip())
            cur = ch.lstrip()
    if cur:
        lines.append(cur.rstrip())
    return lines

def draw_text_box(x, y, w, text, f, fill=INK, line_gap=10, max_lines=None, anchor='la'):
    lines = wrap_text(text, f, w)
    if max_lines:
        lines = lines[:max_lines]
    yy = y
    for line in lines:
        d.text((x, yy), line, font=f, fill=fill, anchor=anchor)
        yy += f.size + line_gap
    return yy

def shadow_round(rect, radius, fill, outline=None, width=2, shadow=True):
    x1,y1,x2,y2 = rect
    if shadow:
        sh = Image.new('RGBA', (W, H), (0,0,0,0))
        sd = ImageDraw.Draw(sh)
        sd.rounded_rectangle((x1+14,y1+18,x2+14,y2+18), radius, fill=(40,63,54,34))
        sh = sh.filter(ImageFilter.GaussianBlur(18))
        img.paste(Image.alpha_composite(img.convert('RGBA'), sh).convert('RGB'))
    d.rounded_rectangle(rect, radius, fill=fill, outline=outline or LINE, width=width)

def pill(x, y, text, fill, fg=(255,255,255), pad_x=28, pad_y=10, fs=36):
    f = font(fs, bold=True)
    tw, th = text_size(text, f)
    d.rounded_rectangle((x, y, x+tw+pad_x*2, y+th+pad_y*2), 999, fill=fill)
    d.text((x+pad_x, y+pad_y-2), text, font=f, fill=fg)
    return x+tw+pad_x*2

def kpi_card(x, y, w, h, label, value, note, color):
    shadow_round((x,y,x+w,y+h), 34, PAPER, outline=(226,231,219), width=2)
    d.rounded_rectangle((x, y, x+14, y+h), 8, fill=color)
    d.text((x+42, y+32), label, font=font(34, bold=True), fill=MUTED)
    d.text((x+42, y+82), value, font=font(72, bold=True), fill=color)
    draw_text_box(x+42, y+172, w-76, note, font(28, med=True), fill=INK, line_gap=6, max_lines=2)

# Header
pill(130, 132, 'REGIONAL BALANCED GROWTH · JEONBUK', NAVY, fs=34)
d.text((130, 220), '지역 균형개발과', font=font(112, bold=True), fill=INK)
d.text((130, 346), '전라북도의 가능성', font=font(132, bold=True), fill=GREEN)
# Keep the lead sentence away from the right-side message card.
draw_text_box(136, 515, 1430, '공간·에너지·첨단산업·R&D를 결합하면, 전북은 “지원받는 지역”에서 “균형성장의 전략 거점”으로 이동할 수 있다.', font(37, med=True), fill=(59,75,78), line_gap=8, max_lines=2)
# accent quote
shadow_round((1670,150,2340,545), 36, (32,74,71), outline=(32,74,71), width=0, shadow=True)
d.text((1720, 205), '핵심 메시지', font=font(34, bold=True), fill=(181,220,191))
for i, line in enumerate(['공간(409㎢) + 에너지(RE100)', '+ 산업조합(5축) + 정책(5극3특)', '+ 위기=명분']):
    d.text((1720, 282 + i*67), line, font=font(43, bold=True), fill=(255,253,244))

# KPI Strip
kpis = [
    ('수도권 GRDP', '52.8%', '2024년 전국 지역내총생산 중 수도권 비중', TEAL),
    ('수도권 인구', '50.5%', '2022년 기준 대한민국 인구의 절반 집중', BLUE),
    ('전북 소멸위험', '13/14', '14개 시군 중 13곳, 92.9%가 소멸위험지역', RED),
    ('20대 순유출', '-6.9천 명', '2024년 전북을 떠난 20대 청년 규모', ORANGE),
]
x0, y0, gap = 130, 680, 28
cw = (W-260-gap*3)//4
for i,k in enumerate(kpis):
    kpi_card(x0+i*(cw+gap), y0, cw, 275, *k)

# Main left map panel
shadow_round((130, 1030, 1180, 2215), 48, (250,252,245), outline=(221,228,216), width=2)
d.text((185, 1088), '전북의 위치와 개발 축', font=font(54, bold=True), fill=INK)
d.text((185, 1160), '새만금-전주·완주 혁신도시-호남권 그린산업벨트', font=font(31, med=True), fill=MUTED)
# Abstract Korea peninsula
map_x, map_y = 310, 1260
pen = [(620,20),(720,100),(700,220),(780,330),(720,480),(770,610),(700,785),(610,885),(530,1040),(410,990),(350,870),(240,790),(285,650),(210,540),(280,425),(250,300),(340,190),(420,80)]
pen = [(map_x+x, map_y+y) for x,y in pen]
d.polygon(pen, fill=(216,227,220), outline=(144,168,158))
# Jeonbuk highlight
jb = [(map_x+330,map_y+610),(map_x+520,map_y+565),(map_x+625,map_y+650),(map_x+560,map_y+770),(map_x+385,map_y+800),(map_x+285,map_y+720)]
d.polygon(jb, fill=(66,149,110), outline=(23,91,65))
# points
points = [
    (map_x+335, map_y+745, '새만금', YELLOW),
    (map_x+505, map_y+700, '혁신도시', GREEN),
    (map_x+610, map_y+650, '전주권', TEAL),
]
for px,py,label,col in points:
    d.ellipse((px-18,py-18,px+18,py+18), fill=col, outline=(255,255,255), width=5)
    d.text((px+28, py-20), label, font=font(31, bold=True), fill=INK)
# connection line
d.line([(map_x+335,map_y+745),(map_x+505,map_y+700),(map_x+610,map_y+650)], fill=(31,108,92), width=8)
# small legends
legend_y = 2030
for i,(lab,val,col) in enumerate([('새만금', '409㎢ · 33.9km 방조제', YELLOW), ('혁신도시', '13개 이전기관 · 4,916명', GREEN), ('호남권', '5극3특 초광역 경제축', TEAL)]):
    lx = 185 + i*315
    d.rounded_rectangle((lx, legend_y, lx+285, legend_y+110), 24, fill=(255,255,255), outline=(226,231,219), width=2)
    d.ellipse((lx+20, legend_y+28, lx+54, legend_y+62), fill=col)
    d.text((lx+68, legend_y+22), lab, font=font(28, bold=True), fill=INK)
    draw_text_box(lx+68, legend_y+58, 200, val, font(20, med=True), fill=MUTED, line_gap=3, max_lines=2)

# Main right strategy assets
shadow_round((1235, 1030, 2350, 2215), 48, (34,75,69), outline=(34,75,69), width=0)
d.text((1290, 1088), '전북의 전략 자산 4', font=font(58, bold=True), fill=(255,253,244))
d.text((1290, 1162), '넓은 공간에 산업·에너지·R&D를 동시 배치할 수 있는 조합', font=font(31, med=True), fill=(194,221,204))
asset_cards = [
    ('01', '새만금', '409㎢', '사업비 약 22.8조 원 · 여의도 약 141배', (255,239,177)),
    ('02', '이차전지 특화단지', '100조 원', '2034년 누적매출 목표 · 기업 100개', (205,236,224)),
    ('03', '수소산업', '2030년 1조 원', '시장규모 6,000억 원 → 1조 원', (206,233,242)),
    ('04', '농생명·식품 R&D', '13개 기관', '전북혁신도시 공공기관 집적', (238,221,206)),
]
for idx,(num,title,val,note,col) in enumerate(asset_cards):
    colx = 1290 + (idx%2)*520
    rowy = 1260 + (idx//2)*365
    d.rounded_rectangle((colx,rowy,colx+475,rowy+305), 34, fill=col, outline=(255,255,255), width=3)
    d.text((colx+28,rowy+25), num, font=font(34,bold=True), fill=(83,105,92))
    d.text((colx+28,rowy+78), title, font=font(34,bold=True), fill=INK)
    draw_text_box(colx+28,rowy+137,410,val,font(54,bold=True), fill=(27,92,80), line_gap=8, max_lines=2)
    draw_text_box(colx+28,rowy+230,405,note,font(24,med=True), fill=(70,83,80), line_gap=5, max_lines=2)
    # icon motif
    cx, cy = colx+400, rowy+62
    d.rounded_rectangle((cx-26,cy-26,cx+26,cy+26), 12, outline=(70,105,90), width=4)
    d.line((cx-42,cy,cx+42,cy), fill=(70,105,90), width=4)
    d.line((cx,cy-42,cx,cy+42), fill=(70,105,90), width=4)

# Middle policy budget ribbon
shadow_round((130, 2280, 2350, 2548), 42, PAPER, outline=(222,229,217), width=2)
d.text((190, 2335), '바뀌는 정책 지도', font=font(50, bold=True), fill=INK)
pill(610, 2332, '5극3특 국가균형성장', GREEN, fs=34)
pill(1030, 2332, '초광역특별계정 2027년 시행', TEAL, fs=34)
pill(1555, 2332, '균특회계 14.7조 원(2025)', YELLOW, fg=INK, fs=34)
# budget mini bars
bar_x, bar_y = 210, 2445
for i,(year,val,width,col) in enumerate([('2023','11.7조',360,BLUE),('2024','13.6조',420,TEAL),('2025','14.7조',455,GREEN)]):
    y = bar_y + i*34
    d.text((bar_x,y-6), year, font=font(24,bold=True), fill=MUTED)
    d.rounded_rectangle((bar_x+95,y,bar_x+95+500,y+20), 10, fill=(232,236,226))
    d.rounded_rectangle((bar_x+95,y,bar_x+95+width,y+20), 10, fill=col)
    d.text((bar_x+620,y-9), val, font=font(25,bold=True), fill=INK)
draw_text_box(1020, 2440, 1210, '지방소멸대응기금 1조 원은 “시설이 아닌 사람 중심”으로 전환. 전북은 청년 주거·채용·교육을 묶는 정주 패키지로 연결해야 한다.', font(33, med=True), fill=INK, line_gap=8, max_lines=3)

# Bottom five reasons cards
section_y = 2635
d.text((130, section_y), '왜 전북이 게임체인저가 될 수 있나', font=font(58, bold=True), fill=INK)
d.text((130, section_y+72), 'Green 보고서의 5개 논거를 시각 카드로 압축', font=font(31, med=True), fill=MUTED)
reasons = [
    ('공간', '새만금 409㎢', '미래 산업을 한꺼번에 담을 수 있는 물리적 여유'),
    ('에너지', 'RE100 스토리', '재생에너지와 그린수소 실증을 제조기지와 결합'),
    ('산업조합', '5축 시너지', '농생명·이차전지·수소·탄소소재·금융 연결'),
    ('정책', '5극3특 순풍', '호남권 초광역 경제축과 균형성장 제도 수혜'),
    ('명분', '13곳 소멸위험', '위기를 균형발전 예산 유치 논리로 전환'),
]
card_w = 420
for i,(title,val,note) in enumerate(reasons):
    x = 130 + i*(card_w+27)
    y = section_y+150
    col = [GREEN,TEAL,BLUE,YELLOW,RED][i]
    shadow_round((x,y,x+card_w,y+430), 34, (255,253,246), outline=(222,229,217), width=2, shadow=True)
    d.ellipse((x+28,y+30,x+108,y+110), fill=col)
    d.text((x+68,y+52), str(i+1), font=font(33,bold=True), fill=(255,255,255), anchor='mm')
    d.text((x+130,y+36), title, font=font(34,bold=True), fill=INK)
    draw_text_box(x+32,y+138,card_w-64,val,font(43,bold=True), fill=col, line_gap=8, max_lines=2)
    draw_text_box(x+32,y+252,card_w-64,note,font(27,med=True), fill=(60,75,78), line_gap=8, max_lines=4)

# Conclusion footer
footer_y = 3295
d.rounded_rectangle((130, footer_y, 2350, 3425), 38, fill=(31,67,64))
d.text((190, footer_y+30), '결론', font=font(35,bold=True), fill=(181,220,191))
draw_text_box(340, footer_y+26, 1860, '승부는 앞으로 5년 안에 결정될 가능성이 크다 — 전북은 “지원받는 소멸위험지역”에서 “대한민국 균형성장의 전략 거점”으로 포지션을 바꿀 수 있다.', font(39,bold=True), fill=(255,253,244), line_gap=8, max_lines=2)
d.text((130, 3450), '데이터 출처: Green 보고서 / Nana 리서치 (지방시대위원회·행안부·한국고용정보원·전북특별자치도 등, 2026-07-04 접근)', font=font(23, med=True), fill=(102,116,113))

# Add small hand-drawn texture dots
for i in range(420):
    x = (i*1543 + 991) % W
    y = (i*1297 + 577) % H
    col = (222 + (i%3)*5, 228 + (i%4)*3, 214 + (i%5)*3)
    d.ellipse((x,y,x+2,y+2), fill=col)

img.save(OUT, quality=95)
print(OUT)
print(f'{OUT.stat().st_size} bytes')
