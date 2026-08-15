importScripts('./fastnoise-lite.js?v=033','./map-core.js?v=033','./region-v20.js?v=033');

const buffers=result=>[result.pixels.buffer,result.temperatures.buffer,result.rainfalls.buffer,result.continents.buffer,result.surfaces.buffer,result.elevations.buffer,result.rockCodes.buffer,result.biomeCodes.buffer,result.riverMasks.buffer,result.kaolinMasks.buffer];
const crop=(result,left,top,width,height)=>{const output={...result,width,height},fields=['temperatures','rainfalls','continents','surfaces','elevations','rockCodes','biomeCodes','riverMasks','kaolinMasks'];for(const field of fields){const source=result[field],target=new source.constructor(width*height);for(let row=0;row<height;row++)target.set(source.subarray((top+row)*result.width+left,(top+row)*result.width+left+width),row*width);output[field]=target}output.pixels=new Uint8ClampedArray(width*height*4);for(let row=0;row<height;row++)output.pixels.set(result.pixels.subarray(((top+row)*result.width+left)*4,((top+row)*result.width+left+width)*4),row*width*4);return output};

self.onmessage=event=>{
  const data=event.data,requestId=data.requestId;
  try{
    const fullWidth=data.width,fullHeight=data.height,tileSize=data.tileSize||128,fullVerticalSpan=data.span*fullHeight/fullWidth,total=Math.ceil(fullWidth/tileSize)*Math.ceil(fullHeight/tileSize);let completed=0;
    for(let y=0;y<fullHeight;y+=tileSize)for(let x=0;x<fullWidth;x+=tileSize){
      const width=Math.min(tileSize,fullWidth-x),height=Math.min(tileSize,fullHeight-y),sampleX=Math.max(0,x-1),sampleY=Math.max(0,y-1),sampleRight=Math.min(fullWidth-1,x+width),sampleBottom=Math.min(fullHeight-1,y+height),sampleWidth=sampleRight-sampleX+1,sampleHeight=sampleBottom-sampleY+1,x0=data.centerX+(sampleX/(fullWidth-1)-.5)*data.span,x1=data.centerX+(sampleRight/(fullWidth-1)-.5)*data.span,z0=data.centerZ+(sampleY/(fullHeight-1)-.5)*fullVerticalSpan,z1=data.centerZ+(sampleBottom/(fullHeight-1)-.5)*fullVerticalSpan,span=Math.max(1,x1-x0),verticalSpan=Math.max(1,z1-z0),generated=TFGMapCore.generateMap({...data,centerX:(x0+x1)/2,centerZ:(z0+z1)/2,span,verticalSpan,width:sampleWidth,height:sampleHeight,displaySpan:data.span}),result=crop(generated,x-sampleX,y-sampleY,width,height);
      result.type='tile';result.requestId=requestId;result.x=x;result.y=y;result.fullWidth=fullWidth;result.fullHeight=fullHeight;result.completed=++completed;result.total=total;
      self.postMessage(result,buffers(result));
    }
    self.postMessage({type:'complete',requestId,width:fullWidth,height:fullHeight,quartReady:data.layer==='kaolin',riverRasterReady:data.layer==='rivers'});
  }catch(error){self.postMessage({type:'error',requestId,message:error?.message||String(error)})}
};
