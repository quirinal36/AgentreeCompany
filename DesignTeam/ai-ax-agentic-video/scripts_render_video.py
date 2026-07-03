from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math, subprocess, sys, os, textwrap

W,H=1920,1080
GEN_FPS=10
FPS=30
DUR=60
N=GEN_FPS*DUR
OUT='/home/leehg/Documents/AgentreeCompany/DesignTeam/2026-07-03_ai-ax-agentic_video.mp4'
AUDIO='assets/final_audio.m4a'
FONT='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'

def font(size):
    return ImageFont.truetype(FONT, size=size)
F={s:font(s) for s in [22,24,26,28,30,32,34,36,38,42,46,52,58,64,72,78,84,92,104,118,126,142,154]}
BG=(7,16,25); FG=(234,247,255); MUT=(176,196,208); CY=(77,255,210); AM=(255,184,77); BLUE=(75,121,255)

def ease(x):
    x=max(0,min(1,x)); return 1-(1-x)**3

def smooth(x):
    x=max(0,min(1,x)); return x*x*(3-2*x)

def lerp(a,b,t): return a+(b-a)*t

def rgba(c,a): return (*c, int(a))

def wrap(draw, text, font, maxw):
    lines=[]; cur=''
    for ch in text:
        test=cur+ch
        if draw.textbbox((0,0), test, font=font)[2] <= maxw or not cur:
            cur=test
        else:
            lines.append(cur); cur=ch
    if cur: lines.append(cur)
    return lines

def text(draw, xy, s, f, fill=FG, anchor=None, spacing=8, maxw=None, align='left'):
    x,y=xy
    if maxw:
        lines=wrap(draw,s,f,maxw)
        for line in lines:
            w=draw.textbbox((0,0), line, font=f)[2]
            xx=x if align=='left' else x+(maxw-w)/2
            draw.text((xx,y), line, font=f, fill=fill)
            y += f.size + spacing
    else:
        draw.text(xy,s,font=f,fill=fill,anchor=anchor)

def rounded_panel(draw, box, outline=(234,247,255,45), fill=(10,25,38,210), radius=34):
    draw.rounded_rectangle(box, radius, fill=fill, outline=outline, width=2)
    x1,y1,x2,y2=box
    draw.line((x1+24,y1+24,x2-24,y1+24), fill=rgba(CY,190), width=3)

def bg_base(t):
    img=Image.new('RGB',(W,H),BG)
    gl=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(gl,'RGBA')
    # grid
    for x in range(0,W,64): d.line((x,0,x,H), fill=(77,255,210,18), width=1)
    for y in range(0,H,64): d.line((0,y,W,y), fill=(77,255,210,18), width=1)
    # glows
    for cx,cy,c,a,r in [(330,210,CY,60,370),(1580,240,AM,44,430),(1220,880,BLUE,40,500)]:
        d.ellipse((cx-r,cy-r,cx+r,cy+r), fill=rgba(c,a))
    gl=gl.filter(ImageFilter.GaussianBlur(80))
    img=Image.alpha_composite(img.convert('RGBA'),gl)
    d=ImageDraw.Draw(img,'RGBA')
    # deterministic grain dots
    for i in range(650):
        x=(i*197+t*7)%W; y=(i*313+t*5)%H
        d.point((x,y), fill=(234,247,255,22))
    # frame marks
    for x,y,sx,sy in [(54,54,1,1),(1866,54,-1,1),(54,1026,1,-1),(1866,1026,-1,-1)]:
        d.line((x,y,x+sx*82,y), fill=rgba(CY,130), width=3); d.line((x,y,x,y+sy*82), fill=rgba(CY,130), width=3)
    return img

def topbar(d, left, right):
    text(d,(88,54),left,F[22],fill=(144,168,184))
    w=d.textbbox((0,0),right,font=F[22])[2]+36
    d.rounded_rectangle((W-88-w,45,W-88,87), radius=22, fill=(77,255,210,25), outline=(77,255,210,110), width=2)
    text(d,(W-88-w+18,55),right,F[22],fill=CY)

def caption(d, s):
    box=(160, H-196, W-160, H-74)
    d.rounded_rectangle(box, radius=28, fill=(7,16,25,215), outline=(234,247,255,50), width=2)
    d.rounded_rectangle((160,H-196,168,H-74), radius=4, fill=CY)
    text(d,(194,H-172),s,F[34],fill=FG,maxw=W-420,spacing=12)

def ghost(d, s, x,y): text(d,(x,y),s,F[118],fill=(234,247,255,24))

def metric(d, x,y,num,label,desc,color):
    rounded_panel(d,(x,y,x+710,y+430))
    text(d,(x+54,y+55),num,F[142],fill=color)
    text(d,(x+58,y+225),label,F[38],fill=FG)
    text(d,(x+58,y+292),desc,F[28],fill=(159,180,194),maxw=580,spacing=7)

def scene1(img,t):
    d=ImageDraw.Draw(img,'RGBA'); topbar(d,'AI/AX MARKET GAP','KOREA · 2026'); ghost(d,'THE GAP IS THE MARKET',90,775)
    p=ease(t/2)
    metric(d, int(138-140*(1-p)),210,'78.4%','AI 필요성 인식','국내 기업 10곳 중 8곳은 AI가 필요하다고 답했습니다.',CY)
    metric(d, int(1072+140*(1-p)),300,'30.6%','실제 활용률','하지만 실제로 도입한 곳은 네 곳이 안 됩니다.',AM)
    gb=(750,204,1170,724); d.rounded_rectangle(gb, radius=36, fill=(255,184,77,32), outline=(255,184,77,140), width=3)
    text(d,(960,330),'시장\n간극',F[58],fill=(255,207,129),anchor='ma',align='center')
    caption(d,'지금 한국 기업 열 곳 중 여덟 곳은 AI가 필요하다고 말합니다. 하지만 실제로 도입한 곳은 네 곳이 안 됩니다.')

def scene2(img,t):
    d=ImageDraw.Draw(img,'RGBA'); topbar(d,'MARKET LIFT','CAGR · GLOBAL'); ghost(d,'AGENTIC AI',1120,120)
    p=ease(t/1.5)
    text(d,(120,170),'이 간극이 바로 시장입니다',F[28],fill=CY)
    text(d,(120,220),'국내 AI 약 4조 원\n글로벌 Agentic AI\n574억 달러',F[84],fill=FG)
    text(d,(120,535),'2026년 이후 Agentic AI는 AX 투자의 다음 레이어가 됩니다.',F[34],fill=MUT,maxw=760)
    rounded_panel(d,(920,178,1740,788))
    d.line((980,702,1680,702),fill=(234,247,255,50),width=3)
    for i,(x,h,c) in enumerate([(1100,210,CY),(1250,300,BLUE),(1400,420,AM),(1550,500,CY)]):
        hh=h*smooth(min(1,t/2-.08*i)); d.rounded_rectangle((x,702-hh,x+95,702), radius=16, fill=rgba(c,210))
    d.rounded_rectangle((980,235,1235,370), radius=24, fill=(234,247,255,22), outline=(234,247,255,45), width=2)
    text(d,(1008,252),'42%',F[72],fill=AM); text(d,(1008,326),'연평균 성장',F[24],fill=MUT)
    d.rounded_rectangle((1420,255,1688,390), radius=24, fill=(234,247,255,22), outline=(234,247,255,45), width=2)
    text(d,(1448,272),'2031',F[72],fill=AM); text(d,(1448,346),'574.2억 달러',F[24],fill=MUT)
    caption(d,'이 간극이 바로 시장입니다. 국내 AI 시장은 올해 약 4조 원. 전 세계 Agentic AI 시장은 5년 안에 574억 달러, 연평균 42퍼센트 성장합니다.')

def scene3(img,t):
    d=ImageDraw.Draw(img,'RGBA'); topbar(d,'FROM CHATBOT TO AGENT','PLAN · ACT · VERIFY'); ghost(d,'EXECUTION LAYER',110,95)
    text(d,(125,160),'챗봇 이후의 AX',F[28],fill=CY)
    text(d,(125,205),'질문에 답하는 AI를 넘어,\n스스로 계획하고 실행하는 AI',F[78],fill=FG)
    nodes=[('01 · GOAL','목표 이해'),('02 · PLAN','계획 수립'),('03 · ACT','도구 실행'),('04 · CHECK','결과 검증')]
    x=125
    for i,(n,lab) in enumerate(nodes):
        pp=ease((t-0.25*i)/1.2); yy=430+int(60*(1-pp))
        rounded_panel(d,(x,yy,x+310,yy+230),outline=(77,255,210,85),fill=(10,25,38,220),radius=36)
        text(d,(x+32,yy+34),n,F[26],fill=CY); text(d,(x+32,yy+94),lab,F[46],fill=FG)
        if i<3:
            ax=x+340; ay=yy+115
            d.line((ax,ay,ax+100*pp,ay),fill=AM,width=4)
            d.polygon([(ax+100*pp,ay),(ax+82*pp,ay-10),(ax+82*pp,ay+10)],fill=AM)
        x+=420
    caption(d,'챗봇이 질문에 답하는 단계를 넘어, AI가 스스로 계획하고 실행하는 시대.')

def scene4(img,t):
    d=ImageDraw.Draw(img,'RGBA'); topbar(d,'PUBLIC · POLICY · INFRA','AX CATALYST'); ghost(d,'PUBLIC AX INFRA',95,780)
    text(d,(130,205),'이미 열린 기반',F[28],fill=CY)
    text(d,(130,255),'공공 60% 도입,\n정부 10조 원 투입',F[84],fill=FG)
    for i,(num,lab) in enumerate([('60%','공공기관 AI 도입'),('10조','AI 프로젝트 예산')]):
        x=130+i*360; y=520; rounded_panel(d,(x,y,x+330,y+170),radius=28)
        text(d,(x+28,y+28),num,F[72],fill=AM); text(d,(x+28,y+108),lab,F[26],fill=MUT)
    cx,cy=1270,490
    for r,c in [(315,CY),(240,AM),(155,CY)]: d.ellipse((cx-r,cy-r,cx+r,cy+r),outline=rgba(c,70),width=3)
    for i,a in enumerate([.2,1.7,3.4,4.8]):
        ang=a+t*.4; r=[260,210,300,170][i]; col=[CY,AM,CY,AM][i]
        x=cx+math.cos(ang)*r; y=cy+math.sin(ang)*r
        d.ellipse((x-12,y-12,x+12,y+12),fill=col)
    caption(d,'공공 60퍼센트가 이미 AI를 도입했고, 정부는 10조 원을 투입합니다.')

def scene5(img,t):
    d=ImageDraw.Draw(img,'RGBA'); topbar(d,'NEXT GROWTH ENGINE','AGENTIC AX'); ghost(d,'NEXT GROWTH ENGINE',210,770)
    cx,cy=960,520
    for r in [310,455,590]: d.ellipse((cx-r,cy-r,cx+r,cy+r),outline=(77,255,210,55),width=3)
    text(d,(960,285),'만드는 AI, 실행하는 AI',F[34],fill=CY,anchor='ma')
    text(d,(960,350),'Agentic AX가\n한국의 다음 성장 엔진입니다',F[104],fill=FG,anchor='ma')
    text(d,(960,640),'인식과 실행 사이의 간극을, 자율형 에이전트가 업무 성과로 연결합니다.',F[38],fill=MUT,anchor='ma')
    caption(d,'만드는 AI, 실행하는 AI. Agentic AX가 한국의 다음 성장 엔진입니다.')

scenes=[(0,12,scene1),(12,27,scene2),(27,43,scene3),(43,55,scene4),(55,60,scene5)]
cmd=['ffmpeg','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(GEN_FPS),'-i','-','-i',AUDIO,'-vf',f'fps={FPS}','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart',OUT]
proc=subprocess.Popen(cmd,stdin=subprocess.PIPE,cwd=os.getcwd())
for frame in range(N):
    t=frame/GEN_FPS
    img=bg_base(t)
    # choose active scene, transitions are handled by overlap-like fades via slight global blur not needed
    for start,end,fn in scenes:
        if start <= t < end:
            fn(img,t-start); break
    proc.stdin.write(img.convert('RGB').tobytes())
    if frame%300==0:
        print(f'frame {frame}/{N}', flush=True)
proc.stdin.close(); code=proc.wait()
if code: raise SystemExit(code)
print(OUT)
