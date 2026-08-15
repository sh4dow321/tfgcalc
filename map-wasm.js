globalThis.TFGWasm=(()=>{
  let instancePromise=null,instance=null;
  const layerCodes={terrain:0,rivers:1,elevation:2,rocks:3,kaolin:4,climate:5,temperature:6,rainfall:7};
  async function init(){
    if(instance)return instance;
    if(!instancePromise)instancePromise=(async()=>{const imports={env:{abort(){throw Error('WASM abort')}}};try{const url='./map-kernel.wasm?v=035',response=await fetch(url),module=WebAssembly.instantiateStreaming?await WebAssembly.instantiateStreaming(response.clone(),imports):await WebAssembly.instantiate(await response.arrayBuffer(),imports);return instance=module.instance}catch{try{const response=await fetch('./map-kernel.wasm?v=035'),module=await WebAssembly.instantiate(await response.arrayBuffer(),imports);return instance=module.instance}catch{return null}}})();
    return instancePromise;
  }
  function copy(exports,array){const ptr=exports.alloc(array.byteLength),view=new Uint8Array(exports.memory.buffer,ptr,array.byteLength);view.set(new Uint8Array(array.buffer,array.byteOffset,array.byteLength));return ptr}
  function render(result,layer){
    if(!instance)return null;const e=instance.exports;e.reset();
    const temp=copy(e,result.temperatures),rain=copy(e,result.rainfalls),continents=copy(e,result.continents),surfaces=copy(e,result.surfaces),elevations=copy(e,result.elevations),rocks=copy(e,result.rockCodes),rivers=copy(e,result.riverMasks),kaolin=copy(e,result.kaolinMasks),colors=new Uint8Array(TFGMapCore.ROCK_NAMES.length*3),palette=globalThis.TFGRegionV20?.rockColors||{};
    TFGMapCore.ROCK_NAMES.forEach((name,index)=>colors.set(palette[name]||[95,95,95],index*3));const rockColors=copy(e,colors),out=e.alloc(result.width*result.height*4);
    e.render(temp,rain,continents,surfaces,elevations,rocks,rivers,kaolin,rockColors,out,result.width,result.height,layerCodes[layer]??0);
    return new Uint8ClampedArray(new Uint8Array(e.memory.buffer,out,result.width*result.height*4));
  }
  function fillRocks(result,task){if(!instance||!task)return false;const e=instance.exports;e.reset(),source=copy(e,task.source),coords=copy(e,task.coords),out=e.alloc(result.width*result.height);e.fillRocks(source,task.minX,task.minZ,task.width,task.height,coords,out,result.width*result.height,task.seed);result.rockCodes=new Uint8Array(new Uint8Array(e.memory.buffer,out,result.width*result.height));result.exactRocksReady=true;return true}
  return{init,render,fillRocks,get ready(){return!!instance}};
})();
