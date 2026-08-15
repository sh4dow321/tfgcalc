const $=selector=>document.querySelector(selector);
const canvas=$('#seedMap'),ctx=canvas.getContext('2d'),viewport=$('#mapViewport'),loading=$('#mapLoading'),status=$('#mapStatus'),generateButton=$('#generateMap');
let worker=null,workerBusy=false,lastMap=null,pendingMap=null,drag=null,requestCounter=0;

function buildRockLegend(){
  const legend=$('#rockLegend'),colors=globalThis.TFGRegionV20?.rockColors||{};
  legend.innerHTML=TFGMapCore.ROCK_NAMES.slice(1).map(name=>{const color=colors[name]||[95,95,95];return `<span><i style="background:rgb(${color.join(',')})"></i><b>${name}</b></span>`}).join('');
}

function setStatus(message,type=''){
  status.textContent=message;
  status.className=`capture-status ${type}`.trim();
}
function validateSeed(){
  const raw=$('#mapSeed').value.trim();
  if(!/^-?\d+$/.test(raw))throw Error('Seed musi być liczbą całkowitą.');
  const seed=BigInt(raw),min=-(1n<<63n),max=(1n<<63n)-1n;
  if(seed<min||seed>max)throw Error('Seed musi mieścić się w zakresie 64-bitowym Minecrafta.');
  return raw;
}
function currentSettings(){
  return{version:$('#mapVersion').value,seed:validateSeed(),layer:$('#mapLayer').value,centerX:Math.round(Number($('#mapCenterX').value)||0),centerZ:Math.round(Number($('#mapCenterZ').value)||0),span:Number($('#mapSpan').value)||64000};
}
function layerName(layer){return{terrain:'Teren regionalny',rivers:'Rzeki i główne dopływy',elevation:'Elewacja',rocks:'Skała powierzchniowa',kaolin:'Kaolinite clay — potencjał',climate:'Klimat',temperature:'Temperatura',rainfall:'Opady'}[layer]}
function syncLayerAvailability(){const exact=$('#mapVersion').value==='1.20.1';document.querySelectorAll('#mapLayer option[data-region-v20]').forEach(option=>option.disabled=!exact);if(!exact&&$('#mapLayer').selectedOptions[0]?.disabled)$('#mapLayer').value='terrain'}
function updateHeader(settings){
  $('#mapTitle').textContent=layerName(settings.layer);
  $('#mapSubtitle').textContent=`X ${settings.centerX.toLocaleString('pl-PL')} · Z ${settings.centerZ.toLocaleString('pl-PL')} · ${settings.span.toLocaleString('pl-PL')} bloków`;
  const labels=settings.layer==='temperature'?['−23°C','33°C']:settings.layer==='rainfall'?['0 mm','500 mm']:settings.layer==='elevation'?['niski teren','góry']:settings.layer==='rocks'?['typ skały','powierzchnia']:settings.layer==='kaolin'?['brak warunków','biom + klimat']:settings.layer==='rivers'?['teren','koryto rzeki']:settings.layer==='terrain'?['głęboki ocean','wysoki ląd']:['zimno / sucho','ciepło / mokro'];
  $('#legendMin').textContent=labels[0];$('#legendMax').textContent=labels[1];
  $('#legendBar').style.background=settings.layer==='temperature'?'linear-gradient(90deg,#253264,#306d9f,#4ba2aa,#7ba868,#d39946,#b23726)':settings.layer==='rainfall'?'linear-gradient(90deg,#693f27,#965e30,#c39d46,#54965b,#34759b)':settings.layer==='elevation'?'linear-gradient(90deg,#44824a,#7e9254,#877d67,#e0e2db)':settings.layer==='rocks'?'linear-gradient(90deg,#1d2021,#55464a,#8e8e8e,#e3ebeb)':settings.layer==='kaolin'?'linear-gradient(90deg,#28241f 0 48%,#e58953 52% 100%)':settings.layer==='rivers'?'linear-gradient(90deg,#25251f,#2789c6)':settings.layer==='terrain'?'linear-gradient(90deg,#0a2b5c,#25698b,#b39a59,#5a9558,#d2d7cf)':'linear-gradient(90deg,#375b85,#37877c,#b39b47,#c65d37)';
  $('#rockLegend').hidden=settings.layer!=='rocks';
}
function mapSize(){const exact=$('#mapVersion').value==='1.20.1',detail=exact&&Number($('#mapSpan').value)<=8000,local=location.protocol==='file:',density=Math.min(window.devicePixelRatio||1,local?1.35:1.65),minWidth=detail?420:exact?240:480,maxWidth=detail?560:exact?320:(local?960:1440),minHeight=detail?280:exact?170:340,maxHeight=detail?400:exact?230:(local?720:960),width=Math.max(minWidth,Math.min(maxWidth,Math.round(viewport.clientWidth*density))),height=Math.max(minHeight,Math.min(maxHeight,Math.round(viewport.clientHeight*density)));return{width,height}}
function emptyMap(width,height,settings){const count=width*height;return{width,height,settings,pixels:new Uint8ClampedArray(count*4),temperatures:new Float32Array(count),rainfalls:new Float32Array(count),continents:new Float32Array(count),surfaces:new Uint8Array(count),elevations:new Uint8Array(count),rockCodes:new Uint8Array(count),biomeCodes:new Uint8Array(count),riverMasks:new Uint8Array(count),kaolinMasks:new Uint8Array(count),quartReady:false,riverRasterReady:false}}
function copyTile(target,tile,x,y){const fields=['temperatures','rainfalls','continents','surfaces','elevations','rockCodes','biomeCodes','riverMasks','kaolinMasks'];for(const field of fields)for(let row=0;row<tile.height;row++)target[field].set(tile[field].subarray(row*tile.width,(row+1)*tile.width),(y+row)*target.width+x);for(let row=0;row<tile.height;row++)target.pixels.set(tile.pixels.subarray(row*tile.width*4,(row+1)*tile.width*4),((y+row)*target.width+x)*4)}
function generate(){
  let settings;
  try{settings=currentSettings()}catch(error){setStatus(error.message,'bad');return}
  const{width,height}=mapSize();
  const requestId=++requestCounter;let fallbackStarted=false,canvasReady=canvas.width===width&&canvas.height===height;
  if(workerBusy){worker?.terminate();worker=null;workerBusy=false}
  pendingMap=emptyMap(width,height,settings);
  if(lastMap)loading.className='map-loading hidden';else{loading.className='map-loading busy';loading.innerHTML='<b>Generowanie mapy kafelkami…</b><span>0%</span>'}generateButton.disabled=true;$('#downloadMap').disabled=true;setStatus(location.protocol==='file:'?'Tryb lokalny — generowanie bez Workera…':'Dorysowywanie kafelków mapy…','progress');updateHeader(settings);
  const finish=data=>{pendingMap.quartReady=data.quartReady;pendingMap.riverRasterReady=data.riverRasterReady;pendingMap.usedWasm=!!data.usedWasm;lastMap=pendingMap;pendingMap=null;workerBusy=false;loading.classList.add('hidden');generateButton.disabled=false;$('#downloadMap').disabled=false;setStatus(`Gotowe — ${width.toLocaleString('pl-PL')} × ${height.toLocaleString('pl-PL')} próbek · ${data.usedWasm?'WASM':'JS fallback'}. Wersja ${settings.version}.`,'ok');const query=new URLSearchParams({v:settings.version,seed:settings.seed,layer:settings.layer,x:settings.centerX,z:settings.centerZ,span:settings.span});try{history.replaceState(null,'',`${location.pathname}?${query}`)}catch{}};
  const handleData=data=>{
    if(data.requestId!==undefined&&data.requestId!==requestId)return;
    if(data.type==='error'){workerBusy=false;loading.className='map-loading';loading.innerHTML='<b>Nie udało się wygenerować mapy</b><span>Sprawdź seed i spróbuj ponownie.</span>';generateButton.disabled=false;setStatus(data.message,'bad');return}
    if(data.type==='tile'){if(!canvasReady){canvas.width=width;canvas.height=height;canvasReady=true}copyTile(pendingMap,data,data.x,data.y);ctx.putImageData(new ImageData(data.pixels,data.width,data.height),data.x,data.y);loading.classList.add('hidden');setStatus(`Dorysowywanie mapy — kafelek ${data.completed}/${data.total}…`,'progress');return}
    if(data.type==='complete'){finish(data);return}
    if(data.type==='result'){if(!canvasReady){canvas.width=data.width;canvas.height=data.height;canvasReady=true}ctx.putImageData(new ImageData(data.pixels,data.width,data.height),0,0);pendingMap={...data,settings};finish(data)}
  };
  const generateLocally=()=>{if(fallbackStarted)return;fallbackStarted=true;worker?.terminate();worker=null;workerBusy=false;setStatus('Worker jest niedostępny — generowanie lokalne w głównym skrypcie…','progress');setTimeout(()=>{try{handleData(TFGMapCore.generateMap({...settings,width,height}))}catch(error){handleData({type:'error',message:error?.message||String(error)})}},30)};
  if(location.protocol==='file:'||typeof Worker==='undefined'){generateLocally();return}
  try{
    if(!worker)worker=new Worker('map-worker.js?v=034');workerBusy=true;
    worker.onmessage=event=>handleData(event.data);
    worker.onerror=()=>generateLocally();
    worker.postMessage({...settings,width,height,requestId,tileSize:128});
  }catch{generateLocally()}
}
function pointFromEvent(event){
  if(!lastMap)return null;const rect=canvas.getBoundingClientRect(),px=Math.max(0,Math.min(lastMap.width-1,Math.floor((event.clientX-rect.left)/rect.width*lastMap.width))),py=Math.max(0,Math.min(lastMap.height-1,Math.floor((event.clientY-rect.top)/rect.height*lastMap.height))),verticalSpan=lastMap.settings.span*lastMap.height/lastMap.width,x=Math.round(lastMap.settings.centerX+(px/(lastMap.width-1)-.5)*lastMap.settings.span),z=Math.round(lastMap.settings.centerZ+(py/(lastMap.height-1)-.5)*verticalSpan),index=py*lastMap.width+px;return{x,z,index,left:event.clientX-rect.left,top:event.clientY-rect.top}}
viewport.addEventListener('pointermove',event=>{
  if(drag){drag.lastX=event.clientX;drag.lastY=event.clientY;canvas.style.transform=`translate(${drag.lastX-drag.startX}px,${drag.lastY-drag.startY}px)`;return}
  const p=pointFromEvent(event);if(!p)return;const elevation=lastMap.elevations[p.index],rock=TFGMapCore.ROCK_NAMES[lastMap.rockCodes[p.index]],biome=TFGMapCore.BIOME_NAMES[lastMap.biomeCodes[p.index]];$('#cursorCoords').textContent=`X ${p.x} · Z ${p.z}`;$('#cursorSurface').textContent=lastMap.surfaces[p.index]?'Ląd':'Ocean';$('#cursorBiome').textContent=biome==='Unknown'?'—':biome;$('#cursorElevation').textContent=!lastMap.surfaces[p.index]?'Ocean':elevation>=12?'Góry':elevation>=8?'Wysoki':elevation>=4?'Średni':'Niski';$('#cursorRock').textContent=rock==='Unknown'?'—':rock[0].toUpperCase()+rock.slice(1);$('#cursorRiver').textContent=lastMap.riverMasks[p.index]?'Tak':'Nie';$('#cursorKaolin').textContent=lastMap.kaolinMasks[p.index]?'Spełnia biom + klimat':'Nie';$('#cursorTemp').textContent=`${lastMap.temperatures[p.index].toFixed(1)}°C`;$('#cursorRain').textContent=`${Math.max(0,lastMap.rainfalls[p.index]).toFixed(0)} mm`;const cross=$('#mapCrosshair');cross.hidden=false;cross.style.left=`${p.left}px`;cross.style.top=`${p.top}px`;
});
viewport.addEventListener('pointerleave',()=>{$('#mapCrosshair').hidden=true});
viewport.addEventListener('pointerdown',event=>{if(!lastMap)return;drag={startX:event.clientX,startY:event.clientY,lastX:event.clientX,lastY:event.clientY};viewport.classList.add('dragging');viewport.setPointerCapture(event.pointerId)});
viewport.addEventListener('pointerup',event=>{if(!drag||!lastMap)return;const rect=viewport.getBoundingClientRect(),dx=drag.lastX-drag.startX,dy=drag.lastY-drag.startY,verticalSpan=lastMap.settings.span*lastMap.height/lastMap.width;$('#mapCenterX').value=Math.round(lastMap.settings.centerX-dx/rect.width*lastMap.settings.span);$('#mapCenterZ').value=Math.round(lastMap.settings.centerZ-dy/rect.height*verticalSpan);drag=null;canvas.style.transform='';viewport.classList.remove('dragging');generate()});
viewport.addEventListener('pointercancel',()=>{drag=null;canvas.style.transform='';viewport.classList.remove('dragging')});
viewport.addEventListener('wheel',event=>{if(!lastMap)return;event.preventDefault();const spans=[4000,8000,16000,32000,64000,128000],current=Number($('#mapSpan').value),index=spans.indexOf(current),next=event.deltaY>0?Math.min(spans.length-1,index+1):Math.max(0,index-1);if(next!==index){$('#mapSpan').value=spans[next];generate()}},{passive:false});
$('#generateMap').onclick=generate;
$('#resetMap').onclick=()=>{$('#mapCenterX').value=$('#mapCenterZ').value=0;if(lastMap)generate()};
$('#downloadMap').onclick=()=>{if(!lastMap)return;const link=document.createElement('a'),s=lastMap.settings;link.download=`tfc-${s.version}-${s.seed}-${s.layer}-x${s.centerX}-z${s.centerZ}.png`;link.href=canvas.toDataURL('image/png');link.click()};
$('#mapVersion').onchange=()=>{syncLayerAvailability();if(lastMap)generate()};
$('#mapLayer').onchange=()=>{if(!lastMap)return;const layer=$('#mapLayer').value;if(layer==='rivers'&&!lastMap.riverRasterReady||layer==='kaolin'&&!lastMap.quartReady){generate();return}const pixels=TFGMapCore.renderPixels(layer,lastMap.width,lastMap.height,lastMap.temperatures,lastMap.rainfalls,lastMap.continents,lastMap.surfaces,lastMap.elevations,lastMap.rockCodes,lastMap.riverMasks,lastMap.kaolinMasks);lastMap.pixels=pixels;lastMap.settings.layer=layer;ctx.putImageData(new ImageData(pixels,lastMap.width,lastMap.height),0,0);updateHeader(lastMap.settings);setStatus(`Warstwa „${layerName(layer)}” nałożona na teren.`,'ok');const s=lastMap.settings,query=new URLSearchParams({v:s.version,seed:s.seed,layer:s.layer,x:s.centerX,z:s.centerZ,span:s.span});try{history.replaceState(null,'',`${location.pathname}?${query}`)}catch{}};

buildRockLegend();
const query=new URLSearchParams(location.search),bindings={v:'#mapVersion',seed:'#mapSeed',layer:'#mapLayer',x:'#mapCenterX',z:'#mapCenterZ',span:'#mapSpan'};for(const[key,selector]of Object.entries(bindings))if(query.has(key))$(selector).value=query.get(key);syncLayerAvailability();updateHeader({layer:$('#mapLayer').value,centerX:Number($('#mapCenterX').value)||0,centerZ:Number($('#mapCenterZ').value)||0,span:Number($('#mapSpan').value)||32000});if(query.has('seed'))generate();
