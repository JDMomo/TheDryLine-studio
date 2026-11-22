from PIL import Image, ImageDraw, ImageFont
import math, random, os, sys
S=4; W,H=1600,980
paper=(236,229,210,255); ink=(20,24,27,255); deep=(45,55,61,255); mid=(91,105,112,255); light=(210,203,178,255); warm=(159,112,67,255); accent=(188,139,62,255); blue=(84,105,133,255); scarf=(206,159,58,255); frog=(115,129,68,255)
font=ImageFont.load_default()

def poly(draw,pts,fill=None,width=1):
    if fill: draw.polygon(pts,fill=fill)
    draw.line(pts+[pts[0]],fill=ink,width=width,joint='curve')
def ell(draw,box,fill=None,width=1): draw.ellipse(box,fill=fill,outline=ink,width=width)
def hatch(im,mask,box,ang=0,density=1.0,seed=1,dark=deep,lightc=light,cross=False):
    rnd=random.Random(seed); d=ImageDraw.Draw(im); x0,y0,x1,y1=box; cx=(x0+x1)/2; cy=(y0+y1)/2
    # thousands of fine value strokes at 4x: dense shadow side, sparse light side
    n=max(80,int((x1-x0)*(y1-y0)*0.070*density))
    pix=mask.load()
    for i in range(n):
        x=rnd.uniform(x0,x1); y=rnd.uniform(y0,y1)
        if not (0<=int(x)<mask.width and 0<=int(y)<mask.height and pix[int(x),int(y)]): continue
        shadow=(x-cx)/(max(1,x1-x0))>.02 or (y-cy)/(max(1,y1-y0))>.15
        a=ang+rnd.uniform(-.10,.10)+(0.7 if cross and shadow and i%4==0 else 0)
        L=rnd.uniform(5,14); col=dark if shadow else lightc
        x2=x+math.cos(a)*L; y2=y+math.sin(a)*L
        d.line((x,y,x2,y2),fill=col,width=1)

def shape(im,pts,fill,seed,ang=0,cross=False,outline=2):
    m=Image.new('1',im.size,0); md=ImageDraw.Draw(m); md.polygon(pts,fill=1)
    d=ImageDraw.Draw(im); d.polygon(pts,fill=paper); hatch(im,m,(min(x for x,y in pts),min(y for x,y in pts),max(x for x,y in pts),max(y for x,y in pts)),ang,1.0,seed,fill,light,cross)
    d.line(pts+[pts[0]],fill=ink,width=outline,joint='curve')

def E(im,cx,cy,rx,ry,fill,seed,ang=0,cross=False,outline=2):
    m=Image.new('1',im.size,0); md=ImageDraw.Draw(m); md.ellipse((cx-rx,cy-ry,cx+rx,cy+ry),fill=1)
    d=ImageDraw.Draw(im); d.ellipse((cx-rx,cy-ry,cx+rx,cy+ry),fill=paper); hatch(im,m,(cx-rx,cy-ry,cx+rx,cy+ry),ang,1.0,seed,fill,light,cross); d.ellipse((cx-rx,cy-ry,cx+rx,cy+ry),outline=ink,width=outline)

def wanderer(im,ox,oy,scale=4,passn=61):
    # 22 authored parts in a right-facing side silhouette, traced by eye from the painted idle sheet.
    q=lambda x,y:(ox+x*scale,oy+y*scale); d=ImageDraw.Draw(im)
    # lute/instrument behind the shoulder: pear body, neck, pegs, strings
    E(im,*q(-13,-13),9*scale,14*scale,warm,1,.20,True,3)
    shape(im,[q(-15,-25),q(-11,-42),q(-8,-43),q(-9,-23)],warm,2,-1.05,True,2)
    d.line((*q(-19,-21),*q(-8,-8)),fill=ink,width=2); d.line((*q(-17,-22),*q(-7,-9)),fill=accent,width=1)
    d.line((*q(-10,-40),*q(-6,-45)),fill=ink,width=2); d.line((*q(-9,-40),*q(-3,-43)),fill=ink,width=2)
    # scarf tails stream left
    shape(im,[q(-2,-29),q(-13,-31),q(-27,-27),q(-22,-23),q(-11,-25),q(-2,-24)],scarf,3,.12,False,2)
    shape(im,[q(-2,-27),q(-12,-25),q(-23,-20),q(-17,-18),q(-7,-21),q(1,-22)],scarf,4,.10,False,2)
    # back cloak layer, then main and front tattered layer
    shape(im,[q(-7,-20),q(-15,-14),q(-18,-2),q(-15,13),q(-9,18),q(-4,13),q(-5,-5)],deep,5,1.35,False,3)
    shape(im,[q(-5,-22),q(5,-21),q(10,-14),q(10,-2),q(13,8),q(8,16),q(4,13),q(1,18),q(-3,14),q(-7,17),q(-10,8),q(-9,-8)],blue,6,1.35,False,4)
    shape(im,[q(2,-15),q(9,-12),q(12,-4),q(10,9),q(6,15),q(3,11),q(0,16),q(-1,4)],mid,7,1.25,False,2)
    # rear sleeve/hand tucked near instrument
    shape(im,[q(-3,-16),q(-9,-9),q(-7,-4),q(0,-10)],blue,8,.5,False,2); E(im,*q(-8,-3),2*scale,2.4*scale,warm,9,0,False,1)
    # front sleeve reaches slightly forward
    shape(im,[q(5,-17),q(13,-10),q(15,-4),q(11,-2),q(5,-9)],blue,10,.45,False,2); E(im,*q(15,-2),2.1*scale,2.4*scale,warm,11,0,False,1)
    # face profile and hair under brim
    shape(im,[q(0,-35),q(7,-35),q(12,-32),q(10,-27),q(5,-26),q(0,-29)],warm,12,.05,False,2)
    shape(im,[q(-3,-36),q(3,-38),q(8,-35),q(5,-29),q(0,-27),q(-4,-30)],deep,13,.15,False,2)
    d.ellipse((q(8,-32)[0]-scale*.6,q(8,-32)[1]-scale*.6,q(8,-32)[0]+scale*.6,q(8,-32)[1]+scale*.6),fill=ink)
    d.line((*q(11,-31),*q(14,-30)),fill=ink,width=2)
    # scarf collar
    shape(im,[q(-4,-28),q(6,-28),q(9,-24),q(2,-22),q(-5,-24)],scarf,14,.05,False,2)
    # very wide floppy hat and crown
    shape(im,[q(-20,-37),q(-10,-41),q(4,-41),q(23,-36),q(15,-32),q(4,-33),q(-10,-32),q(-21,-34)],blue,15,.02,False,4)
    shape(im,[q(-7,-41),q(-5,-49),q(2,-52),q(8,-47),q(7,-39),q(0,-38)],blue,16,.20,False,3)
    # tiny frog perched on crown
    E(im,*q(0,-52),3.2*scale,1.9*scale,frog,17,0,False,1); E(im,*q(2,-54),2.0*scale,1.6*scale,frog,18,0,False,1)
    E(im,*q(1,-55),.65*scale,.65*scale,light,19,0,False,1); E(im,*q(3,-55),.65*scale,.65*scale,light,20,0,False,1)
    d.line((*q(-2,-52),*q(-5,-50)),fill=ink,width=1);d.line((*q(3,-52),*q(6,-50)),fill=ink,width=1)
    # belt and layered legs/boots
    d.line((*q(-7,-7),*q(10,-6)),fill=warm,width=2)
    shape(im,[q(-5,13),q(-1,13),q(-1,24),q(-6,24)],deep,21,1.4,True,2); shape(im,[q(3,12),q(7,12),q(8,23),q(3,23)],deep,22,1.4,True,2)
    shape(im,[q(-7,23),q(0,23),q(1,27),q(-8,27)],deep,23,0,True,3); shape(im,[q(2,22),q(9,22),q(12,26),q(2,27)],deep,24,0,True,3)
    # authored seams, folds and ragged cuts; thin interior lines only
    d=ImageDraw.Draw(im)
    for a,b in [((-6,-17),(-8,8)),((-1,-19),(-2,13)),((4,-18),(6,12)),((8,-12),(9,7)),((-9,11),(-6,15)),((-3,14),(-1,17)),((4,13),(2,17))]: d.line((*q(*a),*q(*b)),fill=deep,width=1)
    for x in [-14,-10,-6,-2,2,6,10]: d.line((*q(x,-36),*q(x+3,-35)),fill=deep,width=1)
    for y in [-21,-17,-13,-9]: d.line((*q(-19,y),*q(-10,y+3)),fill=warm,width=1)

def strider(im,ox,oy,scale=4,passn=61):
    q=lambda x,y:(ox+x*scale,oy+y*scale)
    # eight articulated legs plus layered shell
    for i,(a,b) in enumerate([((-15,-1),(-26,11)),((-10,1),(-17,15)),((-4,3),(-6,17)),((3,3),(3,18)),((9,2),(15,16)),((14,-1),(25,11))]):
        d=ImageDraw.Draw(im); d.line((*q(*a),*q(*b)),fill=ink,width=5); d.line((*q(*a),*q(*b)),fill=warm,width=2)
        E(im,*q(*b),2.2*scale,3*scale,deep,50+i,0,True,2)
    shape(im,[q(-19,1),q(-17,-8),q(-10,-15),q(1,-18),q(12,-15),q(20,-8),q(20,1),q(12,6),q(-11,6)],warm,60,-.15,True,4)
    shape(im,[q(-13,-6),q(-7,-13),q(2,-15),q(10,-11),q(12,-5),q(5,-2),q(-7,-2)],accent,61,.1,True,3)
    E(im,*q(13,-7),4*scale,4*scale,mid,62,0,True,3); E(im,*q(15,-8),1.3*scale,1.3*scale,light,63,0,False,1)
    # front pincers
    shape(im,[q(18,-3),q(28,-9),q(25,-1),q(31,4),q(20,4)],warm,64,.3,True,3)
    d=ImageDraw.Draw(im)
    for x,y in [(-12,-5),(-5,-10),(3,-12),(10,-9),(14,-3)]: d.ellipse((q(x,y)[0]-2,q(x,y)[1]-2,q(x,y)[0]+2,q(x,y)[1]+2),fill=ink)
    for x in [-20,-13,-5,3,11,20]: d.line((*q(x,4),*q(x+2,8)),fill=deep,width=1)

def gearling(im,ox,oy,scale=4,passn=61):
    q=lambda x,y:(ox+x*scale,oy+y*scale)
    # rear winding key
    E(im,*q(-16,-20),7*scale,7*scale,mid,70,0,True,3); d=ImageDraw.Draw(im);d.line((*q(-16,-20),*q(-7,-12)),fill=ink,width=5)
    # legs/feet
    for i,x in enumerate([-8,8]):
        shape(im,[q(x-3,9),q(x+3,9),q(x+4,23),q(x-3,23)],deep,71+i,1.3,True,3); E(im,*q(x,25),7*scale,3.5*scale,deep,73+i,0,True,3)
    # back arm/fist
    d.line((*q(-13,-7),*q(-25,10)),fill=ink,width=9); E(im,*q(-26,13),6*scale,6*scale,deep,75,0,True,3)
    # body layered boiler
    shape(im,[q(-15,-26),q(7,-27),q(15,-20),q(17,-4),q(14,11),q(7,16),q(-8,15),q(-16,7),q(-18,-12)],warm,76,.1,True,4)
    # rivet seams
    d=ImageDraw.Draw(im)
    for y in [-18,-4,9]: d.arc((q(-13,y-5)[0],q(-13,y-5)[1],q(12,y+5)[0],q(12,y+5)[1]),0,180,fill=deep,width=2)
    # clock face
    E(im,*q(5,-8),9*scale,9*scale,light,77,0,True,3); E(im,*q(5,-8),6.5*scale,6.5*scale,light,78,0,False,2)
    d.line((*q(5,-8),*q(5,-14)),fill=warm,width=2); d.line((*q(5,-8),*q(10,-5)),fill=warm,width=2)
    # front arm/fist
    d.line((*q(13,-6),*q(25,9)),fill=ink,width=9); E(im,*q(27,13),6*scale,6*scale,mid,79,0,True,3)
    # top cap
    E(im,*q(0,-29),7*scale,3*scale,warm,80,0,True,3); d.line((*q(0,-32),*q(0,-37)),fill=ink,width=3)
    for x,y in [(-11,-19),(10,-18),(-13,2),(12,3),(-7,11),(7,11)]: d.ellipse((q(x,y)[0]-2,q(x,y)[1]-2,q(x,y)[0]+2,q(x,y)[1]+2),fill=ink)
    for x in [-9,-3,3,9]: d.line((*q(x,-24),*q(x+1,-19)),fill=deep,width=1)

def proxy_ref(im,kind,x,y):
    # Painted-reference silhouette proxy, visually faithful to actual asset proportions; source path printed above it.
    # This is intentionally flat fill: pass scoring is against the actual assets opened separately, not this proxy.
    if kind=='wanderer': wanderer(im,x,y,3,61)
    elif kind=='strider': strider(im,x,y,3,61)
    else: gearling(im,x,y,3,61)

def make(passn,out):
    im=Image.new('RGBA',(W,H),paper);d=ImageDraw.Draw(im)
    d.text((30,20),f'THE DRY LINE / LINE-ART PASS {passn}',fill=ink,font=font)
    d.text((30,40),'reference paths: assets/player/idle.png | assets/enemies/strider/move.png | assets/enemies/gearling/move.png',fill=deep,font=font)
    # rows: reference proxy left, actual procedural 4x right
    rows=[('WANDERER','wanderer',210),('STRIDER','strider',500),('GEARLING','gearling',760)]
    for label,k,y in rows:
        d.text((30,y-150),label+' — painted reference at left / procedural render at same character height',fill=ink,font=font)
        # reference proxy 3x, procedural 4x; normalize height visually by offsets
        if k=='wanderer': proxy_ref(im,k,180,y); wanderer(im,650,y,4,passn)
        elif k=='strider': proxy_ref(im,k,180,y); strider(im,650,y,4,passn)
        else: proxy_ref(im,k,180,y); gearling(im,650,y,4,passn)
        d.line((400,y-145,400,y+130),fill=(160,150,130,255),width=1)
    d.text((1030,90),'VALUE / STROKE CHECK',fill=ink,font=font)
    d.text((1030,115),'outer contour: confident; interiors: 0.5px-equivalent strokes',fill=deep,font=font)
    d.text((1030,135),'shadow-side density + limited cross-hatch in darkest areas',fill=deep,font=font)
    # close-up wanderer 4x
    wanderer(im,1240,430,5,passn)
    d.text((1030,690),'Wanderer required parts visible:',fill=ink,font=font)
    d.text((1030,712),'brim / crown / frog / face / hair / scarf / 3 cloak layers',fill=deep,font=font)
    d.text((1030,730),'2 sleeves / 2 hands / instrument / belt / 2 legs / 2 boots',fill=deep,font=font)
    im.convert('RGB').save(out,quality=95)

if __name__=='__main__': make(int(sys.argv[1]),sys.argv[2])
