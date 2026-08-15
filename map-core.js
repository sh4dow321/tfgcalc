/*
 * Region seed derivation, continental cells and climate formulas are ported
 * from TerraFirmaCraft v3.2.23 and v4.2.7 (EUPL-1.2). Noise is evaluated with
 * the MIT-licensed FastNoise Lite JavaScript port in fastnoise-lite.js.
 */
const MASK_64=(1n<<64n)-1n;
const U64=value=>value&MASK_64;
const rotl=(value,bits)=>U64((value<<BigInt(bits))|(value>>BigInt(64-bits)));
const mixStafford13=value=>{let z=U64(value);z=U64((z^(z>>30n))*0xbf58476d1ce4e5b9n);z=U64((z^(z>>27n))*0x94d049bb133111ebn);return U64(z^(z>>31n))};
const signedInt=value=>{const n=Number(value&0xffffffffn);return n>=0x80000000?n-0x100000000:n};
const foldLong=value=>signedInt((value^(value>>32n))&0xffffffffn);

class Xoroshiro128PlusPlus{
  constructor(seed){this.setSeed(seed)}
  setSeed(seed){const lo=U64(seed^0x6a09e667f3bcc909n),hi=U64(lo+0x9e3779b97f4a7c15n);this.lo=mixStafford13(lo);this.hi=mixStafford13(hi)}
  nextLong(){const a=this.lo,b=this.hi,result=U64(rotl(U64(a+b),17)+a),x=U64(b^a);this.lo=U64(rotl(a,49)^x^U64(x<<21n));this.hi=rotl(x,28);return result}
  nextInt(bound){
    if(bound===undefined)return signedInt(this.nextLong());
    if(bound<=0)throw Error('Bound must be positive');
    let unsigned=this.nextInt()>>>0,product=BigInt(unsigned)*BigInt(bound),low=Number(product&0xffffffffn)>>>0;
    if(low<bound){const threshold=((0x100000000-bound)%bound)>>>0;while(low<threshold){unsigned=this.nextInt()>>>0;product=BigInt(unsigned)*BigInt(bound);low=Number(product&0xffffffffn)>>>0}}
    return Number(product>>32n);
  }
  nextBoolean(){return(this.nextLong()&1n)!==0n}
  nextFloat(){return Math.fround((this.nextInt()>>>8)*Math.fround(5.9604645e-8))}
  nextDouble(){return Number(this.nextLong()>>11n)*1.1102230246251565e-16}
}

function simplex(seed,octaves,min,max,spread){
  const noise=new FastNoiseLite(seed);
  noise.SetFrequency(1);
  noise.SetNoiseType(FastNoiseLite.NoiseType.OpenSimplex2S);
  noise.SetFractalOctaves(octaves);
  if(octaves>1)noise.SetFractalType(FastNoiseLite.FractalType.FBm);
  noise.SetFrequency(Math.fround(Math.fround(spread)/(1<<(octaves-1))));
  const midpoint=(max+min)/2,amplitude=(max-min)/2;
  return(x,z)=>midpoint+noise.GetNoise(x,z)*amplitude;
}

class Cellular2D{
  constructor(seed,sample=1){
    this.seed=foldLong(seed);this.sample=sample;this.frequency=1;
    this.fnl=new FastNoiseLite(this.seed);
  }
  spread(value){this.frequency*=value;return this}
  cell(rawX,rawY){
    const x=rawX*this.frequency,y=rawY*this.frequency,primeX=501125321,primeY=1136930381;
    const fastFloor=value=>value>=0?Math.trunc(value):Math.trunc(value)-1;
    const xr=fastFloor(x),yr=fastFloor(y),jitter=Math.fround(.43701595);
    let distance0=Number.MAX_VALUE,distance1=Number.MAX_VALUE,centerX=0,centerY=0,closestHash=0,cellX=0,cellY=0;
    let xPrimed=Math.imul(xr-this.sample,primeX),yPrimedBase=Math.imul(yr-this.sample,primeY);
    for(let xi=xr-this.sample;xi<=xr+this.sample;xi++){
      let yPrimed=yPrimedBase;
      for(let yi=yr-this.sample;yi<=yr+this.sample;yi++){
        const hash=this.fnl._HashR2(this.seed,xPrimed,yPrimed),idx=hash&(255<<1);
        const vecX=xi+this.fnl._RandVecs2D[idx]*jitter,vecY=yi+this.fnl._RandVecs2D[idx|1]*jitter;
        const dx=vecX-x,dy=vecY-y,newDistance=dx*dx+dy*dy;
        distance1=Math.max(Math.min(distance1,newDistance),distance0);
        if(newDistance<distance0){distance0=newDistance;closestHash=hash;centerX=vecX;centerY=vecY;cellX=xi;cellY=yi}
        yPrimed=(yPrimed+primeY)|0;
      }
      xPrimed=(xPrimed+primeX)|0;
    }
    return{x:centerX/this.frequency,y:centerY/this.frequency,cx:cellX,cy:cellY,f1:distance0,f2:distance1,noise:closestHash*(1/2147483648)};
  }
}

function makeWorld(version,seed){
  const random=new Xoroshiro128PlusPlus(seed);
  let regionSeed,cellSeed,cellSample,continentSeed,temperatureSeed,rainfallSeed;
  if(version==='1.20.1'){
    regionSeed=random.nextLong();
    cellSeed=random.nextLong();
    cellSample=1;
    continentSeed=foldLong(random.nextLong());
    temperatureSeed=random.nextInt();
    rainfallSeed=random.nextInt();
  }else{
    cellSeed=seed;
    cellSample=2;
    continentSeed=foldLong(random.nextLong());
    temperatureSeed=foldLong(random.nextLong());
    random.nextLong(); // oceanic influence
    rainfallSeed=foldLong(random.nextLong());
  }
  const cells=new Cellular2D(cellSeed,cellSample).spread(Math.fround(1/96)),continentDetail=simplex(continentSeed,4,2.5,Math.fround(8.7),Math.fround(.24));
  const world={
    continent(gridX,gridZ){const cell=cells.cell(gridX,gridZ);return(1-cell.f1/(.37+cell.f2))*continentDetail(gridX,gridZ)},
    temperatureDetail:simplex(temperatureSeed,2,-3,3,.15),
    rainfallDetail:simplex(rainfallSeed,2,-80,40,.15)
  };
  const frequency=128/(2*20000);
  world.rawClimate=(gridX,gridZ)=>({temperature:5+25*triangle(frequency,gridZ)+world.temperatureDetail(gridX,gridZ),rainfall:250+250*triangle(frequency,gridX)+world.rainfallDetail(gridX,gridZ)});
  if(version==='1.20.1'&&globalThis.TFGRegionV20)world.region=TFGRegionV20.create({levelSeed:seed,regionSeed,cells,continent:world.continent,rawClimate:world.rawClimate});
  return world;
}
const WORLD_CACHE=new Map;
function getWorld(version,seed){const key=`${version}:${seed}`;let world=WORLD_CACHE.get(key);if(!world){world=makeWorld(version,seed);if(WORLD_CACHE.size>=2)WORLD_CACHE.delete(WORLD_CACHE.keys().next().value);WORLD_CACHE.set(key,world)}return world}

function triangle(frequency,value){return Math.abs(4*frequency*value+1-4*Math.floor(frequency*value+.75))-1}
function clamp(value,min,max){return Math.max(min,Math.min(max,value))}
function mix(a,b,t){return Math.round(a+(b-a)*t)}
function gradient(stops,value){
  const v=clamp(value,stops[0][0],stops.at(-1)[0]);
  for(let i=1;i<stops.length;i++)if(v<=stops[i][0]){const[a,ca]=stops[i-1],[b,cb]=stops[i],t=(v-a)/(b-a||1);return[mix(ca[0],cb[0],t),mix(ca[1],cb[1],t),mix(ca[2],cb[2],t)]}
  return stops.at(-1)[1];
}
const TEMP=[[-23,[37,50,100]],[-10,[48,109,159]],[0,[75,162,170]],[10,[123,168,104]],[20,[211,153,70]],[33,[178,55,38]]];
const RAIN=[[-80,[105,65,39]],[0,[150,94,48]],[100,[195,157,70]],[250,[84,150,91]],[500,[52,117,155]],[540,[45,75,135]]];
const ROCK_NAMES=['Unknown','andesite','basalt','chalk','chert','claystone','conglomerate','dacite','diorite','dolomite','gabbro','gneiss','granite','limestone','marble','phyllite','quartzite','rhyolite','schist','shale','slate'];
const BIOME_NAMES=['Unknown','Ocean','Ocean Reef','Deep Ocean','Deep Ocean Trench','Plains','Hills','Lowlands','Salt Marsh','Low Canyons','Rolling Hills','Highlands','Badlands','Inverted Badlands','Plateau','Old Mountains','Mountains','Volcanic Mountains','Oceanic Mountains','Volcanic Oceanic Mountains','Canyons','Shore','Tidal Flats','Lake','River','Mountain Lake','Volcanic Mountain Lake','Old Mountain Lake','Oceanic Mountain Lake','Volcanic Oceanic Mountain Lake','Plateau Lake'];
const codeOf=(array,value)=>{const index=array.indexOf(value);return index<0?0:index};
function terrainColor(temp,rain,continent,shade=1,coast=false){
  if(continent<=4.4){
    const depth=clamp((4.4-continent)/3.2,0,1),cold=clamp((-temp-2)/25,0,.28);
    const water=[mix(37,10,depth),mix(105,43,depth),mix(139,92,depth+cold*.25)];
    return water.map(value=>Math.round(value*shade));
  }
  const wet=clamp(rain/500,0,1),warm=clamp((temp+20)/50,0,1),high=clamp((continent-4.4)/3.5,0,1);
  let low;
  if(coast&&temp>-12)low=[185,166,111];
  else if(temp<-10)low=[164,177,174];
  else if(rain<90)low=[176,142,82];
  else if(rain<210)low=[132,145,75];
  else low=[68,132,76];
  const highColor=temp<0?[210,215,207]:[104,105,87];
  return low.map((value,index)=>Math.round(mix(value,highColor[index],high*.62)*shade));
}
function overlayColor(layer,temp,rain,continent,base){
  const tc=gradient(TEMP,temp),rc=gradient(RAIN,rain);
  if(layer==='temperature')return base.map((value,index)=>mix(value,tc[index],.48));
  if(layer==='rainfall')return base.map((value,index)=>mix(value,rc[index],.46));
  if(layer==='terrain')return base;
  const wet=clamp(rain/500,0,1),warm=clamp((temp+20)/50,0,1);
  const climate=[
    mix(mix(55,196,warm),rc[0],.38),
    mix(mix(91,160,wet),rc[1],.42),
    mix(mix(133,55,warm),rc[2],.4)
  ];
  return base.map((value,index)=>mix(value,climate[index],.42));
}
function renderPixels(layer,width,height,temperatures,rainfalls,continents,surfaces,elevations=new Uint8Array(width*height),rockCodes=new Uint8Array(width*height),riverMasks=new Uint8Array(width*height),kaolinMasks=new Uint8Array(width*height)){
  const pixels=new Uint8ClampedArray(width*height*4);
  for(let py=0;py<height;py++)for(let px=0;px<width;px++){
    const index=py*width+px,left=continents[py*width+Math.max(0,px-1)],right=continents[py*width+Math.min(width-1,px+1)],up=continents[Math.max(0,py-1)*width+px],down=continents[Math.min(height-1,py+1)*width+px];
    const gradientX=left-right,gradientZ=up-down,shade=clamp(.94+gradientX*.15+gradientZ*.1,.77,1.12);
    let coast=false;
    if(surfaces[index])for(let dz=-1;dz<=1&&!coast;dz++)for(let dx=-1;dx<=1;dx++){const nx=px+dx,nz=py+dz;if(nx>=0&&nx<width&&nz>=0&&nz<height&&!surfaces[nz*width+nx]){coast=true;break}}
    const base=terrainColor(temperatures[index],rainfalls[index],continents[index],shade,coast);let rgb;
    if(layer==='elevation'){
      const level=elevations[index],elevationColor=!surfaces[index]?[34,91,132]:level>=12?[224,226,219]:level>=8?[135,125,103]:level>=4?[126,146,84]:[68,130,74];rgb=base.map((value,i)=>mix(value,elevationColor[i],.68));
    }else if(layer==='rocks'){
      const name=ROCK_NAMES[rockCodes[index]],rock=globalThis.TFGRegionV20?.rockColors?.[name]||[95,95,95];rgb=base.map((value,i)=>mix(value,rock[i],surfaces[index] ? .78 : .5));
    }else if(layer==='kaolin'){
      rgb=kaolinMasks[index]?base.map((value,i)=>mix(value,[229,137,83][i],.82)):base.map(value=>Math.round(value*.48));
    }else if(layer==='rivers'){
      rgb=base.map(value=>Math.round(value*.55));
    }else rgb=overlayColor(layer,temperatures[index],rainfalls[index],continents[index],base);
    if(riverMasks[index]){const strength=layer==='rivers'?.92:layer==='terrain'?.38:layer==='elevation'?.25:0;if(strength)rgb=rgb.map((value,i)=>mix(value,[39,137,198][i],strength))}
    const out=index*4;
    pixels[out]=rgb[0];pixels[out+1]=rgb[1];pixels[out+2]=rgb[2];pixels[out+3]=255;
  }
  return pixels;
}

function generateMap(data,onProgress=()=>{}){
    const{version,seed:centerSeed,layer,centerX,centerZ,span,width,height}=data,seed=BigInt(centerSeed),world=getWorld(version,seed),quartReady=layer==='kaolin',riverRasterReady=layer==='rivers',count=width*height,temperatures=new Float32Array(count),rainfalls=new Float32Array(count),continents=new Float32Array(count),surfaces=new Uint8Array(count),elevations=new Uint8Array(count),rockCodes=new Uint8Array(count),biomeCodes=new Uint8Array(count),kaolinMasks=new Uint8Array(count),verticalSpan=data.verticalSpan??span*height/width,pointCache=new Map;
    for(let py=0;py<height;py++){
      const blockZ=centerZ+(py/(height-1)-.5)*verticalSpan,gridZ=blockZ/128;
      for(let px=0;px<width;px++){
        const blockX=centerX+(px/(width-1)-.5)*span,gridX=blockX/128,index=py*width+px;
        let regionPoint=null;if(world.region){const scale=quartReady?4:128,key=`${Math.floor(blockX/scale)},${Math.floor(blockZ/scale)}`;regionPoint=pointCache.get(key);if(!regionPoint){regionPoint=quartReady?world.region.sample(blockX,blockZ):world.region.sampleRegional(blockX,blockZ);if(pointCache.size>150000)pointCache.clear();pointCache.set(key,regionPoint)}}
        const raw=world.rawClimate(gridX,gridZ),temperature=regionPoint?.temperature??raw.temperature,rainfall=regionPoint?.rainfall??raw.rainfall,continent=world.continent(gridX,gridZ);
        temperatures[index]=temperature;rainfalls[index]=rainfall;continents[index]=continent;surfaces[index]=regionPoint?Number(regionPoint.land):Number(continent>4.4);elevations[index]=regionPoint?.altitude||0;rockCodes[index]=codeOf(ROCK_NAMES,regionPoint?.rock||'Unknown');biomeCodes[index]=codeOf(BIOME_NAMES,regionPoint?.biome||'Unknown');kaolinMasks[index]=Number(regionPoint?.kaolinEligible||false);
      }
      if(py%32===0)onProgress(py/height);
    }
    const riverMasks=world.region&&riverRasterReady?world.region.rasterRivers(centerX,centerZ,span,width,height,verticalSpan,data.displaySpan??span):new Uint8Array(count),pixels=data.skipRender?new Uint8ClampedArray(count*4):renderPixels(layer,width,height,temperatures,rainfalls,continents,surfaces,elevations,rockCodes,riverMasks,kaolinMasks);
    return{type:'result',width,height,pixels,temperatures,rainfalls,continents,surfaces,elevations,rockCodes,biomeCodes,riverMasks,kaolinMasks,quartReady,riverRasterReady};
}
globalThis.TFGMapCore={generateMap,renderPixels,ROCK_NAMES,BIOME_NAMES,_internals:{Xoroshiro128PlusPlus,Cellular2D,U64,foldLong,clamp,simplex,triangle}};
