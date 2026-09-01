import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless:'shell', args:['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width:390, height:844, deviceScaleFactor:2 });
await p.goto('https://mcard.fromtoday.co.kr/w/6z7TDr/', { waitUntil:'networkidle2', timeout:60000 });
await new Promise(r=>setTimeout(r,3000));
await p.screenshot({ path:'tools/shots/ref-rsvp-top.png' });
// 참석 관련 요소 찾기
const hits = await p.evaluate(()=>{
  const out=[];
  for(const el of document.querySelectorAll('body *')){
    const own=[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();
    if(!/참석/.test(own)) continue;
    const r=el.getBoundingClientRect(); const cs=getComputedStyle(el);
    out.push({ tag:el.tagName, cls:String(el.className).slice(0,60), text:own.slice(0,60),
      y:Math.round(r.top+scrollY), visible:cs.display!=='none'&&cs.visibility!=='hidden'&&r.height>0 });
  }
  return out.slice(0,12);
});
console.log(JSON.stringify(hits,null,1));
await b.close();
