(()=>{
  const STORAGE_KEY='tfg_language';
  const pairs=[
    ['↻ Wyczyść','↻ Clear'],['↻ Wycentruj','↻ Recenter'],['Kalkulatory','Calculators'],['Narzędzia','Tools'],
    ['⚗ Stopy','⚗ Alloys'],['⚒ Kowadło','⚒ Anvil'],['⌖ Mapa seeda','⌖ Seed Map'],
    ['TFG Toolkit — stopy, Bloomery i kowadło','TFG Toolkit — alloys, Bloomery and anvil'],['TFG Toolkit — solver kowadła','TFG Toolkit — anvil solver'],['TFG Toolkit — mapa seeda','TFG Toolkit — seed map'],
    ['Kalkulator stopów','Alloy Calculator'],['Oblicza proporcje i liczbę porcji metali dla wybranej pojemności.','Calculates metal ratios and portion counts for the selected capacity.'],
    ['Kalkulator Bloomery','Bloomery Calculator'],['Oblicza ilość materiału, charcoal oraz liczbę otrzymanych bloomów.','Calculates material, charcoal, and the resulting bloom count.'],
    ['Solver kowadła','Anvil Solver'],['Odczytuje GUI kowadła i na bieżąco pokazuje kolejne operacje.','Reads the anvil GUI and continuously displays the next operations.'],
    ['Ustawienia wytopu','Smelting Setup'],['Wybierz stop i pojemność','Choose an alloy and capacity'],['Stop','Alloy'],
    ['Nazwa stopu','Alloy name'],['＋ Dodaj własny stop…','＋ Add custom alloy…'],['＋ Dodaj materiał','＋ Add material'],['✓ Dodaj stop do listy','✓ Add alloy to list'],['✓ Zapisz zmiany','✓ Save changes'],['Usuń stop','Delete alloy'],
    ['Suma udziałów: 100% ✓','Total share: 100% ✓'],['Udziały muszą dawać 100%. Zapisane stopy pojawią się na liście wyboru.','Shares must allow a 100% mixture. Saved alloys will appear in the selection list.'],
    ['Pojemność naczynia','Vessel capacity'],['Docelowa ilość','Target amount'],['Wypełnij do pełna (cel = pojemność)','Fill completely (target = capacity)'],
    ['Porcje metali','Metal Portions'],['Podaj wielkości, które masz','Enter the sizes you have'],['＋ Dodaj rozmiar porcji','＋ Add portion size'],
    ['OBLICZ NAJLEPSZĄ PROPORCJĘ','CALCULATE BEST RATIO'],['WYNIK OPTYMALIZACJI','OPTIMIZATION RESULT'],['Gotowa rozpiska','Ready Breakdown'],['POPRAWNY STOP','VALID ALLOY'],['BRAK KOMBINACJI','NO COMBINATION'],
    ['Podsumowanie wazy','Vessel Summary'],['Wypełnienie','Fill'],['Liczba porcji','Portion count'],['Pełne sztabki (144 mB)','Full ingots (144 mB)'],['Reszta','Remainder'],['Kopiuj rozpiskę','Copy breakdown'],['Skopiowano ✓','Copied ✓'],
    ['Solver sprawdził całkowite kombinacje porcji i wybrał poprawny stop możliwie najbliżej podanej wartości mB.','The solver checked whole-portion combinations and selected a valid alloy as close as possible to the requested mB value.'],['Zmień wielkości porcji lub pojemność i spróbuj ponownie.','Change the portion sizes or capacity and try again.'],['Nie udało się ułożyć stopu','Could not create the alloy'],
    ['⚠ JESZCZE NIEPRZETESTOWANE','⚠ NOT TESTED YET'],['Kalkulator Bloomery może podawać nieprawidłowe wyniki.','The Bloomery Calculator may return incorrect results.'],
    ['Parametry Bloomery','Bloomery Parameters'],['Pojemność konstrukcji i materiał','Structure capacity and material'],['Maks. liczba przedmiotów','Maximum item count'],['Dostępny pył','Available dust'],['Żelazo w jednej porcji','Iron per portion'],
    ['Wartość 0 przy dostępnym pyle oznacza: wykorzystaj maksymalną pojemność pieca.','A value of 0 for available dust means: use the maximum furnace capacity.'],
    ['Przelicznik procesu','Process Ratio'],['Możesz dopasować do wersji moda','Adjust it to your mod version'],['mB żelaza na bloom','mB of iron per bloom'],['Węgiel na bloom','Charcoal per bloom'],
    ['Nie wkładaj żelaza, które nie zwiększy liczby bloomów','Do not add iron that will not increase the bloom count'],
    ['Aktualny Field Guide: 100 mB żelaza + 2 charcoal = 1 bloom. Kalkulator pilnuje również łącznego limitu przedmiotów.','Current Field Guide: 100 mB of iron + 2 charcoal = 1 bloom. The calculator also enforces the total item limit.'],
    ['OBLICZ WSAD DO BLOOMERY','CALCULATE BLOOMERY LOAD'],['GOTOWY WSAD','READY LOAD'],['Rozpiska Bloomery','Bloomery Breakdown'],['BEZ PRZEKROCZENIA LIMITU','WITHIN THE LIMIT'],
    ['Odczytaj kowadło ze screena','Read the Anvil from an Image'],['Przechwyć okno, wczytaj, wklej lub przeciągnij obraz','Capture a window, upload, paste, or drag an image'],
    ['▣ Uruchom podgląd Minecrafta','▣ Start Minecraft Capture'],['■ Zatrzymaj podgląd','■ Stop Capture'],['↑ Wczytaj screenshot','↑ Upload Screenshot'],['◎ Odczytaj wartości','◎ Read Values'],
    ['Podgląd sam znajduje GUI w całym oknie i na bieżąco aktualizuje wartości. Możesz też wkleić obraz skrótem Ctrl+V.','Capture automatically finds the GUI in the whole window and continuously updates values. You can also paste an image with Ctrl+V.'],
    ['Przeciągnij tutaj screenshot kowadła','Drag an anvil screenshot here'],['Oczekiwanie na obraz…','Waiting for an image…'],
    ['Pozycja na kowadle','Anvil Position'],['Odczytaj wartości z interfejsu gry','Read values from the game interface'],['Aktualna wartość','Current value'],['Wartość docelowa','Target value'],
    ['Do odczytania dokładnego celu potrzebny jest resource pack pokazujący wartości kowadła.','A resource pack displaying anvil values is required to read the exact target.'],
    ['Reguły końcowe','Final Rules'],['Ikona oraz ograniczenie odczytane z kresek pod nią','Icon and position constraint read from the bars below it'],
    ['Reguła 1 (lewa)','Rule 1 (left)'],['Reguła 2','Rule 2'],['Reguła 3 (prawa)','Rule 3 (right)'],['ZNAJDŹ NAJKRÓTSZĄ SEKWENCJĘ','FIND SHORTEST SEQUENCE'],
    ['Sekwencja uderzeń','Strike Sequence'],['PLAN NA ŻYWO','LIVE PLAN'],['NASTĘPNY KROK','NEXT STEP'],['Uruchom solver','Run the solver'],['STATUS','STATUS'],['Wartości wyrównane','Values aligned'],['Gotowe ✓','Done ✓'],
    ['Mechaniki: TFG / TFC Field Guide · Kalkulatory działają lokalnie','Mechanics: TFG / TFC Field Guide · Calculators run locally'],
    ['Mapa seeda','Seed Map'],['Mapa regionów liczona lokalnie z seeda TFC. Przeciągnij widok, użyj kółka myszy do zmiany skali i wskaż punkt, aby odczytać dane.','A regional map calculated locally from the TFC seed. Drag the view, use the mouse wheel to zoom, and point at a location to inspect its data.'],
    ['⚠ GENERATOR REGIONÓW — TESTY','⚠ REGION GENERATOR — TESTING'],
    ['Dla TFC 3.2.23 mapa uwzględnia wyspy, góry, rzeki, jeziora i końcowy quart-scale biome layer. Warstwa kaolinu pokazuje obszary spełniające biom oraz klimat; nie oznacza gwarantowanego złoża, ponieważ właściwa żyła ma jeszcze rzadkość 1/40 i wymaga Y 75–110. TFC 4.2.7 nadal korzysta z podglądu kontynentów.','For TFC 3.2.23 the map includes islands, mountains, rivers, lakes, and the final quart-scale biome layer. The kaolin layer shows areas matching biome and climate conditions; it does not guarantee a deposit because the actual vein still has a 1/40 rarity and requires Y 75–110. TFC 4.2.7 still uses the continent preview.'],
    ['Generator','Generator'],['Wybierz dokładną parę TFC i Viewera','Choose the exact TFC and Viewer pair'],['Wersja generatora','Generator version'],['Seed świata','World seed'],['Warstwa','Layer'],
    ['Teren regionalny','Regional terrain'],['Rzeki i główne dopływy · TFC 3.2.23','Rivers and main tributaries · TFC 3.2.23'],['Elewacja / góry · TFC 3.2.23','Elevation / mountains · TFC 3.2.23'],['Skała powierzchniowa · TFC 3.2.23','Surface rock · TFC 3.2.23'],['Kaolinite clay — potencjał · TFC 3.2.23','Kaolinite clay — potential · TFC 3.2.23'],['Klimat','Climate'],['Temperatura bazowa','Base temperature'],['Opady bazowe','Base rainfall'],
    ['Środek X','Center X'],['Środek Z','Center Z'],['Szerokość widoku','View width'],['GENERUJ MAPĘ','GENERATE MAP'],['głęboki ocean','deep ocean'],['wysoki ląd','high land'],
    ['Każdy tryb zachowuje normalny teren pod półprzezroczystą nakładką. Położenie kontynentów, temperatura i opady korzystają z seeda oraz kolejności RNG wybranej wersji TFC.','Every mode keeps normal terrain beneath a translucent overlay. Continent placement, temperature, and rainfall use the seed and RNG order of the selected TFC version.'],
    ['↓ Zapisz PNG','↓ Save PNG'],['Wpisz seed i wygeneruj mapę','Enter a seed and generate the map'],['Obliczenia wykonuje osobny Worker.','Calculations run in a separate Worker.'],
    ['Pozycja:','Position:'],['Powierzchnia:','Surface:'],['Biom:','Biome:'],['Elewacja:','Elevation:'],['Skała:','Rock:'],['Rzeka:','River:'],['Kaolin:','Kaolin:'],['Temperatura:','Temperature:'],['Opady:','Rainfall:'],['Gotowe do generowania.','Ready to generate.'],
    ['Generator: TerraFirmaCraft · Obliczenia mapy działają lokalnie','Generator: TerraFirmaCraft · Map calculations run locally'],
    ['Teren regionalny','Regional terrain'],['Rzeki i główne dopływy','Rivers and main tributaries'],['Elewacja','Elevation'],['Skała powierzchniowa','Surface rock'],['Kaolinite clay — potencjał','Kaolinite clay — potential'],['Temperatura','Temperature'],['Opady','Rainfall'],
    ['niski teren','low terrain'],['góry','mountains'],['typ skały','rock type'],['powierzchnia','surface'],['brak warunków','conditions not met'],['biom + klimat','biome + climate'],['teren','terrain'],['koryto rzeki','river channel'],['zimno / sucho','cold / dry'],['ciepło / mokro','warm / wet'],
    ['Ląd','Land'],['Ocean','Ocean'],['Góry','Mountains'],['Średni','Medium'],['Niski','Low'],['Nie','No'],['Spełnia biom + klimat','Biome + climate match'],
    ['Seed musi być liczbą całkowitą.','Seed must be an integer.'],['Seed musi mieścić się w zakresie 64-bitowym Minecrafta.','Seed must fit Minecraft’s 64-bit range.'],['Generowanie mapy kafelkami…','Generating the map in tiles…'],['Dorysowywanie kafelków mapy…','Rendering map tiles…'],['Tryb lokalny — generowanie bez Workera…','Local mode — generating without a Worker…'],['Worker jest niedostępny — generowanie lokalne w głównym skrypcie…','Worker unavailable — generating locally on the main thread…'],['Nie udało się wygenerować mapy','Could not generate the map'],['Sprawdź seed i spróbuj ponownie.','Check the seed and try again.'],
    ['Brak','None'],['Nie ostatnia','Not last'],['Ostatnia','Last'],['2. od końca','2nd from last'],['3. od końca','3rd from last'],['Dowolna z ostatnich 3','Any of the last 3'],['Nie odczytano — wybierz ręcznie','Not recognized — select manually'],
    ['Zapisywanie własnych stopów','Saving Custom Alloys'],['Strona zapisuje wybór zgody, a po zezwoleniu także nazwy materiałów i procenty własnych stopów. Nie używa analityki ani śledzenia.','The site stores your consent choice and, if allowed, custom alloy material names and percentages. It does not use analytics or tracking.'],['Nie zapisuj stopów','Do not save alloys'],['Zezwól','Allow'],['Ustawienia cookie','Cookie settings'],
    ['Materiał','Material'],['Usuń materiał','Remove material'],['PORCJI','PORTIONS'],['Pył / materiał','Dust / material'],['Zajęte miejsca','Used slots'],['wolnych','free'],['wykorzystane','used'],['Brak rozwiązania','No solution'],['Sprawdź zasady','Check the rules']
  ];
  const plToEn=new Map(pairs),enToPl=new Map(pairs.map(([pl,en])=>[en,pl]));
  const patterns=[
    [/^(\d[\d\s]*) bloków$/,'$1 blocks',/^(\d[\d\s]*) blocks$/,'$1 bloków'],
    [/^Materiał (\d+)$/,'Material $1',/^Material (\d+)$/,'Materiał $1'],
    [/^Własny stop (\d+)$/,'Custom alloy $1',/^Custom alloy (\d+)$/,'Własny stop $1'],
    [/^Krok (\d+)( · reguła)?$/,(m,n,r)=>`Step ${n}${r?' · rule':''}`,/^Step (\d+)( · rule)?$/,(m,n,r)=>`Krok ${n}${r?' · reguła':''}`],
    [/^X (.+) · Z (.+) · (.+) bloków$/,'X $1 · Z $2 · $3 blocks',/^X (.+) · Z (.+) · (.+) blocks$/,'X $1 · Z $2 · $3 bloków'],
    [/^Wczytano obraz (.+)\. Kliknij „Odczytaj wartości”\.$/,'Loaded image $1. Click “Read Values”.',/^Loaded image (.+)\. Click “Read Values”\.$/,'Wczytano obraz $1. Kliknij „Odczytaj wartości”.'],
    [/^Start (.+) → cel (.+)\. Pozostało (\d+) operacji, w tym (\d+) końcowych\.(.*)$/,'Start $1 → target $2. $3 operations remaining, including $4 final operations.$5',/^Start (.+) → target (.+)\. (\d+) operations remaining, including (\d+) final operations\.(.*)$/,'Start $1 → cel $2. Pozostało $3 operacji, w tym $4 końcowych.$5'],
    [/^Warstwa „(.+)” nałożona na teren\.$/,'“$1” layer overlaid on terrain.',/^“(.+)” layer overlaid on terrain\.$/,'Warstwa „$1” nałożona na teren.']
  ];
  let lang='pl',scheduled=false;
  const convert=(value,target)=>{
    if(!value)return value;
    const direct=(target==='en'?plToEn:enToPl).get(value);if(direct!==undefined)return direct;
    for(const [plRe,enValue,enRe,plValue] of patterns){const re=target==='en'?plRe:enRe;if(re.test(value))return value.replace(re,target==='en'?enValue:plValue)}
    if(target==='en')return value.replace(/\(wymagane /g,'(required ').replace(/ porcja (\d+)/g,' portion $1');
    return value.replace(/\(required /g,'(wymagane ').replace(/ portion (\d+)/g,' porcja $1');
  };
  const translateTree=root=>{
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode())){const raw=node.nodeValue,match=raw.match(/^(\s*)([\s\S]*?)(\s*)$/);if(!match||!match[2])continue;const next=convert(match[2],lang);if(next!==match[2])node.nodeValue=match[1]+next+match[3]}
    root.querySelectorAll?.('[placeholder],[title],[aria-label]').forEach(el=>['placeholder','title','aria-label'].forEach(name=>{if(el.hasAttribute(name)){const current=el.getAttribute(name),next=convert(current,lang);if(next!==current)el.setAttribute(name,next)}}));
  };
  const apply=()=>{scheduled=false;document.documentElement.lang=lang;document.title=convert(document.title,lang);translateTree(document);document.querySelectorAll('.lang-btn').forEach(button=>{const active=button.dataset.lang===lang;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))})};
  const schedule=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(apply)}};
  const setLanguage=value=>{lang=value==='en'?'en':'pl';try{localStorage.setItem(STORAGE_KEY,lang)}catch{}apply();window.dispatchEvent(new CustomEvent('tfg:languagechange',{detail:{lang}}))};
  try{lang=localStorage.getItem(STORAGE_KEY)==='en'?'en':'pl'}catch{}
  const init=()=>{const actions=document.querySelector('.top-actions');if(actions&&!actions.querySelector('.language-switch')){const box=document.createElement('div');box.className='language-switch';box.setAttribute('aria-label','Language / Język');box.innerHTML='<button class="lang-btn" type="button" data-lang="pl">PL</button><button class="lang-btn" type="button" data-lang="en">EN</button>';box.addEventListener('click',event=>{const button=event.target.closest('.lang-btn');if(button)setLanguage(button.dataset.lang)});actions.prepend(box)}apply();new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','title','aria-label']})};
  window.TFGI18n={setLanguage,getLanguage:()=>lang,locale:()=>lang==='en'?'en-US':'pl-PL',translate:convert,apply:schedule};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
