importScripts('./fastnoise-lite.js?v=032','./map-core.js?v=032','./region-v20.js?v=032');

self.onmessage=event=>{
  try{
    const result=TFGMapCore.generateMap(event.data,value=>self.postMessage({type:'progress',value}));
    self.postMessage(result,[result.pixels.buffer,result.temperatures.buffer,result.rainfalls.buffer,result.continents.buffer,result.surfaces.buffer,result.elevations.buffer,result.rockCodes.buffer,result.biomeCodes.buffer,result.riverMasks.buffer,result.kaolinMasks.buffer]);
  }catch(error){
    self.postMessage({type:'error',message:error?.message||String(error)});
  }
};
