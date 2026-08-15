let heap: usize = 65536;

export function reset(): void { heap = 65536; }
export function alloc(bytes: i32): usize {
  const ptr = (heap + 7) & ~7;
  heap = ptr + <usize>bytes;
  const required = <i32>((heap + 65535) >> 16), current = memory.size();
  if (required > current) memory.grow(required - current);
  return ptr;
}

@inline function clamp(v: f64, lo: f64, hi: f64): f64 { return v < lo ? lo : v > hi ? hi : v; }
@inline function mix(a: f64, b: f64, t: f64): i32 { return <i32>Math.round(a + (b - a) * t); }
@inline function byte(ptr: usize, index: i32): i32 { return <i32>load<u8>(ptr + <usize>index); }
@inline function flt(ptr: usize, index: i32): f64 { return <f64>load<f32>(ptr + <usize>(index << 2)); }

function tempGradient(v0: f64, channel: i32): i32 {
  const v = clamp(v0, -23, 33);
  let a = -23.0, b = -10.0, ar = 37, ag = 50, ab = 100, br = 48, bg = 109, bb = 159;
  if (v > -10) { a=-10;b=0;ar=48;ag=109;ab=159;br=75;bg=162;bb=170; }
  if (v > 0) { a=0;b=10;ar=75;ag=162;ab=170;br=123;bg=168;bb=104; }
  if (v > 10) { a=10;b=20;ar=123;ag=168;ab=104;br=211;bg=153;bb=70; }
  if (v > 20) { a=20;b=33;ar=211;ag=153;ab=70;br=178;bg=55;bb=38; }
  const t=(v-a)/(b-a), av=channel==0?ar:channel==1?ag:ab, bv=channel==0?br:channel==1?bg:bb;
  return mix(av,bv,t);
}
function rainGradient(v0: f64, channel: i32): i32 {
  const v=clamp(v0,-80,540);
  let a=-80.0,b=0.0,ar=105,ag=65,ab=39,br=150,bg=94,bb=48;
  if(v>0){a=0;b=100;ar=150;ag=94;ab=48;br=195;bg=157;bb=70;}
  if(v>100){a=100;b=250;ar=195;ag=157;ab=70;br=84;bg=150;bb=91;}
  if(v>250){a=250;b=500;ar=84;ag=150;ab=91;br=52;bg=117;bb=155;}
  if(v>500){a=500;b=540;ar=52;ag=117;ab=155;br=45;bg=75;bb=135;}
  const t=(v-a)/(b-a),av=channel==0?ar:channel==1?ag:ab,bv=channel==0?br:channel==1?bg:bb;
  return mix(av,bv,t);
}
function terrain(temp: f64,rain: f64,continent: f64,shade: f64,coast: bool,channel: i32): i32 {
  if(continent<=4.4){
    const depth=clamp((4.4-continent)/3.2,0,1),cold=clamp((-temp-2)/25,0,.28);
    const value=channel==0?mix(37,10,depth):channel==1?mix(105,43,depth):mix(139,92,depth+cold*.25);
    return <i32>Math.round(<f64>value*shade);
  }
  const wet=clamp(rain/500,0,1),high=clamp((continent-4.4)/3.5,0,1);
  let lr=68,lg=132,lb=76;
  if(coast&&temp>-12){lr=185;lg=166;lb=111;}else if(temp<-10){lr=164;lg=177;lb=174;}else if(rain<90){lr=176;lg=142;lb=82;}else if(rain<210){lr=132;lg=145;lb=75;}
  const low=channel==0?lr:channel==1?lg:lb,hi=temp<0?(channel==0?210:channel==1?215:207):(channel==0?104:channel==1?105:87);
  return <i32>Math.round(<f64>mix(low,hi,high*.62)*shade);
}

export function render(tempPtr: usize,rainPtr: usize,continentPtr: usize,surfacePtr: usize,elevationPtr: usize,rockPtr: usize,riverPtr: usize,kaolinPtr: usize,rockColorPtr: usize,outPtr: usize,width: i32,height: i32,layer: i32): void {
  const count=width*height;
  for(let index=0;index<count;index++){
    const px=index%width,py=index/width,left=flt(continentPtr,py*width+(px>0?px-1:0)),right=flt(continentPtr,py*width+(px+1<width?px+1:width-1)),up=flt(continentPtr,(py>0?py-1:0)*width+px),down=flt(continentPtr,(py+1<height?py+1:height-1)*width+px),shade=clamp(.94+(left-right)*.15+(up-down)*.1,.77,1.12),temp=flt(tempPtr,index),rain=flt(rainPtr,index),continent=flt(continentPtr,index),land=byte(surfacePtr,index)!=0;
    let coast=false;
    if(land)for(let dz=-1;dz<=1&&!coast;dz++)for(let dx=-1;dx<=1;dx++){const nx=px+dx,nz=py+dz;if(nx>=0&&nx<width&&nz>=0&&nz<height&&byte(surfacePtr,nz*width+nx)==0){coast=true;break;}}
    for(let channel=0;channel<3;channel++){
      const base=terrain(temp,rain,continent,shade,coast,channel);let rgb=base;
      if(layer==2){const level=byte(elevationPtr,index),target=!land?(channel==0?34:channel==1?91:132):level>=12?(channel==0?224:channel==1?226:219):level>=8?(channel==0?135:channel==1?125:103):level>=4?(channel==0?126:channel==1?146:84):(channel==0?68:channel==1?130:74);rgb=mix(base,target,.68);}
      else if(layer==3){const code=byte(rockPtr,index),target=byte(rockColorPtr,code*3+channel);rgb=mix(base,target,land?.78:.5);}
      else if(layer==4)rgb=byte(kaolinPtr,index)!=0?mix(base,channel==0?229:channel==1?137:83,.82):<i32>Math.round(<f64>base*.48);
      else if(layer==1)rgb=<i32>Math.round(<f64>base*.55);
      else if(layer==6)rgb=mix(base,tempGradient(temp,channel),.48);
      else if(layer==7)rgb=mix(base,rainGradient(rain,channel),.46);
      else if(layer==5){const wet=clamp(rain/500,0,1),warm=clamp((temp+20)/50,0,1),rc=rainGradient(rain,channel);let climate=0;if(channel==0)climate=mix(mix(55,196,warm),rc,.38);else if(channel==1)climate=mix(mix(91,160,wet),rc,.42);else climate=mix(mix(133,55,warm),rc,.4);rgb=mix(base,climate,.42);}
      if(byte(riverPtr,index)!=0){const strength=layer==1?.92:layer==0?.38:layer==2?.25:0;if(strength>0)rgb=mix(rgb,channel==0?39:channel==1?137:198,strength);}
      store<u8>(outPtr+<usize>(index*4+channel),<u8>clamp(rgb,0,255));
    }
    store<u8>(outPtr+<usize>(index*4+3),255);
  }
}
