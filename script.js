window.addEventListener("scroll",()=>{
    const nav=document.getElementById("navbar");
    if(!nav) return;
    if(window.scrollY>50){
        nav.classList.add("scrolled");
    }else{
        nav.classList.remove("scrolled");
    }
});

function animateValue(id,start,end,duration){
    const el=document.getElementById(id);
    if(!el) return;
    let current=start;
    const range=end-start;
    const step=Math.max(1,Math.floor(duration/range));
    const timer=setInterval(()=>{
        current++;
        el.textContent=current;
        if(current>=end) clearInterval(timer);
    },step);
}

window.addEventListener("load",()=>{
    if(document.getElementById("tapCounter")){
        animateValue("tapCounter",0,20,1200);
    }
});

function showPopup(option){
    document.getElementById("modalTitle").textContent=option;
    document.getElementById("modalText").textContent=
        "This is usually where your " + option + " would be.";
    document.getElementById("legalModal").style.display="flex";
}

function closePopup(){
    document.getElementById("legalModal").style.display="none";
}

window.addEventListener("click",(e)=>{
    const modal=document.getElementById("legalModal");
    if(modal && e.target===modal){
        closePopup();
    }
});

/* ============================================================
   LIVE CONTENT FROM GOOGLE SHEETS
   ------------------------------------------------------------
   Paste your two "Publish to web" CSV links below.
   How to get them (one-time setup, ~5 minutes):

   1. Go to Google Sheets, create a new sheet.
   2. Make TWO tabs (bottom of screen): name one "Beers",
      one "Events".
   3. In the "Beers" tab, put headers in row 1: Name | Style
      Then list beers below, one per row.
   4. In the "Events" tab, put headers in row 1: Name | Day
   5. File > Share > Publish to web.
   6. Choose the "Beers" tab, format "Comma-separated values
      (.csv)", click Publish. Copy the link it gives you.
   7. Repeat for the "Events" tab.
   8. Paste both links into BEERS_CSV_URL and EVENTS_CSV_URL
      below (keep the quotes).

   From then on, editing the spreadsheet is all the brewery
   needs to do — add a row, delete a row, change a word — and
   the website updates itself automatically. If the links are
   left blank, or the sheet is unreachable, each page quietly
   falls back to the hardcoded cards already in its HTML, so
   nothing ever breaks. This file is shared by every page, so
   you only ever need to update these two links in one place.
   ============================================================ */
const BEERS_CSV_URL  = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRhkqlgAAwZwO8TnqGkKlFAGpHv8yCGsZcdLMp49OKJ2XZNEhr4ZEPsqxfPy_GtU7TkanM26mFWa-hM/pub?gid=56140579&single=true&output=csv";
const EVENTS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRhkqlgAAwZwO8TnqGkKlFAGpHv8yCGsZcdLMp49OKJ2XZNEhr4ZEPsqxfPy_GtU7TkanM26mFWa-hM/pub?output=csv";

// Minimal CSV parser: handles quoted fields and commas inside quotes.
function parseCSV(text){
    const rows=[];
    let row=[],field="",inQuotes=false;
    for(let i=0;i<text.length;i++){
        const c=text[i];
        if(inQuotes){
            if(c==='"'){
                if(text[i+1]==='"'){field+='"';i++;}
                else{inQuotes=false;}
            }else{field+=c;}
        }else{
            if(c==='"'){inQuotes=true;}
            else if(c===','){row.push(field);field="";}
            else if(c==='\n'||c==='\r'){
                if(field.length||row.length){row.push(field);rows.push(row);}
                field="";row=[];
                if(c==='\r'&&text[i+1]==='\n')i++;
            }else{field+=c;}
        }
    }
    if(field.length||row.length){row.push(field);rows.push(row);}
    return rows.filter(r=>r.some(cell=>cell.trim().length));
}

function escapeHTML(str){
    const div=document.createElement("div");
    div.textContent=str;
    return div.innerHTML;
}

async function loadSheet(url){
    if(!url) return null;
    try{
        const res=await fetch(url,{cache:"no-store"});
        if(!res.ok) throw new Error("Bad response");
        const text=await res.text();
        const rows=parseCSV(text);
        if(rows.length<2) throw new Error("No data rows");
        return rows.slice(1); // drop header row
    }catch(err){
        console.warn("Live content unavailable, using fallback.",err);
        return null;
    }
}

async function renderBeers(){
    // Only run on pages that actually have these elements (Home + Beers page).
    const grid=document.getElementById("boardGrid");
    const counter=document.getElementById("tapCounter");
    if(!grid && !counter) return;
    const rows=await loadSheet(BEERS_CSV_URL);
    if(!rows) return; // keep hardcoded fallback cards
    if(grid){
        grid.innerHTML=rows.map(r=>{
            const name=escapeHTML(r[0]||"");
            const style=escapeHTML(r[1]||"");
            return `<div class="beer-card"><h3>${name}</h3><p>${style}</p></div>`;
        }).join("");
    }
    if(counter){
        counter.textContent=rows.length;
    }
}

async function renderEvents(){
    // Only runs on the Events page.
    const list=document.getElementById("eventsList");
    if(!list) return;
    const rows=await loadSheet(EVENTS_CSV_URL);
    if(!rows) return; // keep hardcoded fallback list
    list.innerHTML=rows.map(r=>{
        const name=escapeHTML(r[0]||"");
        const day=escapeHTML(r[1]||"");
        return `<div class="event"><span>${name}</span><span>${day}</span></div>`;
    }).join("");
}

renderBeers();
renderEvents();
