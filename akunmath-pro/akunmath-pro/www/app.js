/* AkunMath Pro - logika aplikasi */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const nf=n=>Number(Math.round(n*1e4)/1e4).toLocaleString('id-ID');
const rp=n=>'Rp '+nf(n);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const strip=h=>h.replace(/<\/(tr|li|p|div)>/g,'\n').replace(/<\/t[dh]>/g,' | ').replace(/<[^>]+>/g,'').replace(/\n\s*\n/g,'\n').trim();
let tt;function toast(m){const t=$('#toast');t.textContent=m;t.classList.remove('hidden');clearTimeout(tt);tt=setTimeout(()=>t.classList.add('hidden'),1800);}
const num=id=>parseFloat($(id).value);

/* ---------- Riwayat ---------- */
const HK='akunmath_history';
const getH=()=>{try{return JSON.parse(localStorage.getItem(HK))||[]}catch(e){return[]}};
const setH=h=>{try{localStorage.setItem(HK,JSON.stringify(h))}catch(e){}};
function addH(type,title,detail){const h=getH();h.unshift({id:Date.now(),t:new Date().toLocaleString('id-ID'),type,title,detail});setH(h.slice(0,100));}
function renderH(){const h=getH(),l=$('#h-list');
  l.innerHTML=h.length?h.map(x=>`<div class="card"><div class="flex justify-between gap-2"><div><div class="text-xs text-slate-500">${esc(x.type)} · ${esc(x.t)}</div><div class="font-semibold text-navy">${esc(x.title)}</div></div><button data-del="${x.id}" class="text-slate-400 text-xl px-1" aria-label="Hapus">×</button></div><div class="text-sm whitespace-pre-wrap mt-1 text-slate-700">${esc(x.detail)}</div></div>`).join(''):'<p class="text-sm text-slate-500">Belum ada riwayat. Hasil hitungan dan soal cerita akan muncul di sini.</p>';}

/* ---------- Navigasi & tab ---------- */
function go(p){$$('.page').forEach(e=>e.classList.toggle('hidden',e.id!=='page-'+p));$$('.navbtn').forEach(b=>b.classList.toggle('on',b.dataset.p===p));const el=$('#page-'+p);el.classList.remove('fade');void el.offsetWidth;el.classList.add('fade');window.scrollTo(0,0);if(p==='history')renderH();}
function setTab(g,n){$$(`[data-tabgroup="${g}"]`).forEach(b=>b.classList.toggle('on',b.dataset.tab===n));$$(`[data-panelgroup="${g}"]`).forEach(p=>p.classList.toggle('hidden',p.dataset.panel!==n));}
function act(a){const[pg,x]=a.split(':');go(pg);
  if(pg==='calc'){const g=['jurnal','susut','bep','rasio'].includes(x)?'ak':'mt';setTab('calcgrp',g);setTab(g,x);}
  if(pg==='story'){setTab('story','off');if(x!=='auto'){$('#cat').value=x;fillSample();}}}
document.addEventListener('click',e=>{
  let b;
  if(b=e.target.closest('[data-tabgroup]'))setTab(b.dataset.tabgroup,b.dataset.tab);
  else if(b=e.target.closest('[data-act]'))act(b.dataset.act);
  else if(b=e.target.closest('.navbtn'))go(b.dataset.p);
  else if(b=e.target.closest('[data-del]')){setH(getH().filter(x=>String(x.id)!==b.dataset.del));renderH();}
  else if(b=e.target.closest('[data-mx]'))mxOp(b.dataset.mx);
});
$('#h-clear').onclick=()=>{if(getH().length&&confirm('Hapus semua riwayat?')){setH([]);renderH();toast('Riwayat dihapus');}};

/* ---------- Parser angka (format Indonesia) ---------- */
const NUM='(?:Rp\\.?\\s*)?(\\d+\\.\\d{1,2}(?!\\d)|\\d+(?:\\.\\d{3})*(?:,\\d+)?)\\s*(miliar|juta|ribu|persen|%)?';
function val(m){let s=m[1];if(/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(',','.');let v=parseFloat(s);const u=(m[2]||'').toLowerCase();if(u==='miliar')v*=1e9;else if(u==='juta')v*=1e6;else if(u==='ribu')v*=1e3;return v;}
function find(t,kw){let m=new RegExp('(?:'+kw+')[^\\d\\n]{0,40}?'+NUM,'i').exec(t);if(m)return val(m);m=new RegExp(NUM+'\\s*(?:'+kw+')','i').exec(t);return m?val(m):null;}
function findU(t,u){const m=new RegExp(NUM+'\\s*(?:'+u+')','i').exec(t);return m?val(m):null;}
const need=(o)=>{const k=Object.keys(o).filter(k=>o[k]==null||isNaN(o[k]));if(k.length)throw new Error('Data belum lengkap, tidak ditemukan: '+k.join(', ')+'. Periksa penulisan angka dan kata kunci pada soal.');};

/* ---------- Penyusutan ---------- */
function depTable(c,r,u,m){const rows=[];let bv=c,ak=0;for(let i=1;i<=u;i++){const b=m==='sl'?(c-r)/u:(i===u?bv-r:Math.min(bv*2/u,bv-r));ak+=b;bv=c-ak;rows.push([i,b,ak,bv]);}return rows;}
const depHtml=rows=>`<table class="tb"><tr><th>Thn</th><th class="r">Beban</th><th class="r">Akum.</th><th class="r">Nilai buku</th></tr>${rows.map(x=>`<tr><td>${x[0]}</td><td class="r">${rp(x[1])}</td><td class="r">${rp(x[2])}</td><td class="r">${rp(x[3])}</td></tr>`).join('')}</table>`;

/* ---------- Solver offline ---------- */
function sSusut(t){const c=find(t,'harga perolehan|harga beli|dibeli|membeli|seharga|harga'),r=find(t,'nilai residu|residu|nilai sisa|sisa')||0,u0=findU(t,'tahun')||find(t,'umur ekonomis|umur|masa manfaat');need({'harga perolehan':c,'umur ekonomis':u0});
  const u=Math.min(Math.round(u0),50),m=/saldo menurun/i.test(t)?'sm':'sl',rows=depTable(c,r,u,m);
  return{judul:'Penyusutan Aset ('+(m==='sl'?'Garis Lurus':'Saldo Menurun Ganda')+')',dik:[`Harga perolehan = ${rp(c)}`,`Nilai residu = ${rp(r)}`,`Umur ekonomis = ${u} tahun`],dit:'Beban penyusutan per tahun, akumulasi, dan nilai buku.',
  rumus:m==='sl'?'Penyusutan = (Harga perolehan − Residu) ÷ Umur':'Penyusutan = Nilai buku awal × (2 ÷ Umur)',
  langkah:m==='sl'?[`(${nf(c)} − ${nf(r)}) ÷ ${u} = ${nf((c-r)/u)} per tahun`,'Akumulasi bertambah sebesar beban tiap tahun.','Nilai buku = Harga perolehan − Akumulasi.']:[`Tarif = 2 ÷ ${u} = ${nf(200/u)}% dari nilai buku awal`,'Tahun terakhir disesuaikan agar nilai buku sama dengan residu.'],
  jawab:depHtml(rows)};}
function sBep(t){const F=find(t,'biaya tetap'),V=find(t,'biaya variabel|biaya per unit'),P=find(t,'harga jual|dijual'),L=find(t,'target laba|laba yang diinginkan');need({'biaya tetap':F,'biaya variabel':V,'harga jual':P});
  if(P<=V)throw new Error('Harga jual harus lebih besar dari biaya variabel per unit.');
  const cm=P-V,u=F/cm,dik=[`Biaya tetap = ${rp(F)}`,`Biaya variabel/unit = ${rp(V)}`,`Harga jual/unit = ${rp(P)}`],st=[`Margin kontribusi/unit = ${nf(P)} − ${nf(V)} = ${rp(cm)}`,`BEP unit = ${nf(F)} ÷ ${nf(cm)} = ${nf(u)} unit`,`BEP rupiah = ${nf(Math.ceil(u))} × ${nf(P)} = ${rp(Math.ceil(u)*P)}`];
  let j=`<b>BEP = ${nf(Math.ceil(u))} unit</b> atau <b>${rp(Math.ceil(u)*P)}</b>`;
  if(L){dik.push(`Target laba = ${rp(L)}`);const tu=(F+L)/cm;st.push(`Unit untuk target laba = (${nf(F)} + ${nf(L)}) ÷ ${nf(cm)} = ${nf(tu)} unit`);j+=`<br>Untuk laba ${rp(L)}: <b>${nf(Math.ceil(tu))} unit</b>`;}
  return{judul:'Titik Impas (BEP)',dik,dit:'BEP dalam unit dan rupiah.',rumus:'BEP unit = Biaya tetap ÷ (Harga − Biaya variabel)',langkah:st,jawab:j};}
function sBunga(t){const M=find(t,'modal|pokok|investasi|menabung|meminjam|pinjaman|deposito|uang sebesar|sebesar'),i=findU(t,'%|persen')??find(t,'bunga');let n=findU(t,'tahun');const b=findU(t,'bulan');if(n==null&&b!=null)n=b/12;need({'modal/pokok':M,'suku bunga':i,'lama (tahun)':n});
  const tung=/tunggal/i.test(t),m=/bulanan/i.test(t)?12:/triwulan|kuartal/i.test(t)?4:/semester/i.test(t)?2:1,r=i/100;
  const fv=tung?M*(1+r*n):M*Math.pow(1+r/m,m*n);
  return{judul:tung?'Bunga Tunggal':'Bunga Majemuk',dik:[`Modal = ${rp(M)}`,`Bunga = ${nf(i)}% per tahun`,`Waktu = ${nf(n)} tahun`,...(tung?[]:[`Periode majemuk = ${m}× per tahun`])],dit:'Nilai akhir dan total bunga.',
  rumus:tung?'FV = PV × (1 + i × n)':'FV = PV × (1 + i/m)^(m×n)',langkah:tung?[`FV = ${nf(M)} × (1 + ${r} × ${nf(n)}) = ${rp(fv)}`]:[`i/m = ${nf(r/m)}; m×n = ${nf(m*n)}`,`FV = ${nf(M)} × (1 + ${nf(r/m)})^${nf(m*n)} = ${rp(fv)}`],
  jawab:`<b>Nilai akhir = ${rp(fv)}</b><br>Total bunga = ${rp(fv-M)}`};}
const ASET={peralatan:'Peralatan',perlengkapan:'Perlengkapan',kendaraan:'Kendaraan',gedung:'Gedung',tanah:'Tanah',persediaan:'Persediaan','barang dagang':'Persediaan',mesin:'Mesin',komputer:'Peralatan Komputer'};
function sJurnal(t){const ss=t.split(/\.\s+|\n|;/).map(s=>s.trim().replace(/\.$/,'')).filter(Boolean),ent=[],lg=[];
  ss.forEach((s,k)=>{let a=find(s,'rp\\.?');if(a==null){const m=new RegExp(NUM,'i').exec(s);a=m?val(m):null;}
    if(a==null){lg.push(`Kalimat ${k+1}: nominal tidak ditemukan, dilewati.`);return;}
    const L=s.toLowerCase(),kr=/kredit|utang|hutang/.test(L);let d,c;
    if(/(bayar|membayar|melunasi|dilunasi).*(utang|hutang)/.test(L)){d='Utang Usaha';c='Kas';}
    else if(/(terima|diterima).*(piutang|pelunasan)/.test(L)){d='Kas';c='Piutang Usaha';}
    else if(/prive|diambil pemilik|pemilik mengambil/.test(L)){d='Prive';c='Kas';}
    else if(/modal|menyetor|investasi pemilik/.test(L)&&!/beli|membeli/.test(L)){d='Kas';c='Modal Pemilik';}
    else if(/(bayar|membayar|dibayar|biaya|beban)/.test(L)&&!/(beli|membeli)/.test(L)){d=/gaji|upah/.test(L)?'Beban Gaji':/dimuka/.test(L)?'Sewa Dibayar Dimuka':/sewa/.test(L)?'Beban Sewa':/listrik|air|telepon|internet/.test(L)?'Beban Utilitas':/iklan/.test(L)?'Beban Iklan':'Beban Lain-lain';c='Kas';}
    else if(/pendapatan|jasa|penjualan|menjual|dijual/.test(L)){d=kr?'Piutang Usaha':'Kas';c=/penjualan|menjual|dijual/.test(L)?'Penjualan':'Pendapatan Jasa';}
    else if(/beli|membeli|pembelian|dibeli/.test(L)){const k2=Object.keys(ASET).find(x=>L.includes(x));d=k2?ASET[k2]:'Persediaan';c=kr?'Utang Usaha':'Kas';}
    else{lg.push(`Kalimat ${k+1}: jenis transaksi tidak dikenali, dilewati.`);return;}
    ent.push([d,c,a]);lg.push(`Transaksi ${ent.length}: Debit ${d}, Kredit ${c} sebesar ${rp(a)}.`);});
  if(!ent.length)throw new Error('Tidak ada transaksi yang dikenali. Gunakan kata seperti dibeli, tunai, kredit, dibayar, pendapatan, modal.');
  let sd=0;const rows=ent.map(([d,c,a],i)=>{sd+=a;return`<tr><td>${i+1}</td><td>${d}</td><td class="r">${nf(a)}</td><td></td></tr><tr><td></td><td class="pl-4">&nbsp;&nbsp;${c}</td><td></td><td class="r">${nf(a)}</td></tr>`}).join('');
  return{judul:'Jurnal Umum',dik:ss.map(s=>esc(s)),dit:'Jurnal untuk tiap transaksi.',rumus:'Σ Debit = Σ Kredit',langkah:lg,
  jawab:`<table class="tb"><tr><th>No</th><th>Akun</th><th class="r">Debit</th><th class="r">Kredit</th></tr>${rows}<tr><td></td><td><b>Total</b></td><td class="r"><b>${nf(sd)}</b></td><td class="r"><b>${nf(sd)}</b></td></tr></table><div class="mt-1 text-xs text-em">Balance ✓</div>`};}
function sSpl(t){let vars=[],rows=[],rhs=[],names={};
  if(t.includes('=')){const eqs=t.split(/[\n;]+/).filter(e=>e.includes('='));
    eqs.forEach(e=>{[...e.matchAll(/([+-]?\s*\d*[.,]?\d*)\s*\*?\s*([a-z])\b/gi)].forEach(m=>{const v=m[2].toLowerCase();if(!vars.includes(v))vars.push(v);});});
    vars.sort();eqs.forEach(e=>{const [l,r]=e.split('=');const row=vars.map(v=>{const m=new RegExp('([+-]?\\s*\\d*[.,]?\\d*)\\s*\\*?\\s*'+v+'\\b','i').exec(l);if(!m)return 0;const s=m[1].replace(/\s/g,'').replace(',','.');return s===''||s==='+'?1:s==='-'?-1:parseFloat(s);});rows.push(row);rhs.push(parseFloat(r.replace(',','.')));});}
  else{const sk=t.split(/\.\s+|\n|;/).filter(Boolean),ex=['rp','rupiah','tahun','bulan','hari','juta','ribu','miliar'],items=[];
    const pr=sk.map(s=>{const p=[...s.matchAll(/(\d+)\s+([a-zA-Z]+)/g)].filter(m=>!ex.includes(m[2].toLowerCase())).map(m=>[m[1],m[2].toLowerCase()]);const tot=find(s,'rp\\.?|seharga|total|bayar');return{p,tot};}).filter(x=>x.p.length&&x.tot!=null);
    pr.forEach(x=>x.p.forEach(([,w])=>{if(!items.includes(w))items.push(w);}));vars=items.slice(0,3);names=Object.fromEntries(vars.map(v=>['harga '+v,v]));
    pr.forEach(x=>{rows.push(vars.map(v=>{const f=x.p.find(q=>q[1]===v);return f?+f[0]:0;}));rhs.push(x.tot);});}
  if(!vars.length||rows.length!==vars.length||vars.length>3)throw new Error('Butuh jumlah persamaan sama dengan jumlah variabel (maks. 3). Contoh: 2x + 3y = 12; x - y = 1');
  if(Math.abs(math.det(rows))<1e-9)throw new Error('Sistem tidak punya solusi tunggal (determinan = 0).');
  const sol=math.lusolve(rows,rhs).map(r=>r[0]),word=!t.includes('=');
  return{judul:'Sistem Persamaan Linear',dik:rows.map((r,i)=>r.map((c,j)=>c?`${c}${vars[j]}`:'').filter(Boolean).join(' + ')+' = '+nf(rhs[i])),dit:'Nilai '+vars.join(', ')+'.',rumus:'A·x = b, maka x = A⁻¹·b (eliminasi)',
  langkah:['Susun matriks koefisien A = '+JSON.stringify(rows),`Determinan A = ${nf(math.det(rows))} ≠ 0, solusi tunggal.`,'Selesaikan dengan eliminasi Gauss.'],
  jawab:vars.map((v,i)=>`<b>${word?'harga '+v:v} = ${word?rp(sol[i]):nf(sol[i])}</b>`).join('<br>')};}
const SOLV={susut:sSusut,bep:sBep,bunga:sBunga,jurnal:sJurnal,spl:sSpl};
const LBL={susut:'Penyusutan',bep:'BEP',bunga:'Bunga',jurnal:'Jurnal',spl:'SPL'};
function detect(t){const L=t.toLowerCase();return/=/.test(t)?'spl':/penyusutan|residu|umur ekonomis/.test(L)?'susut':/impas|bep|biaya tetap/.test(L)?'bep':/bunga|majemuk/.test(L)?'bunga':/dibeli|membeli|dibayar|diterima|modal|kredit|jurnal/.test(L)?'jurnal':'spl';}
const sec=(h,b)=>`<div><div class="text-xs font-semibold text-slate-500 mb-1">${h}</div>${b}</div>`;
function showSolve(el,r){el.innerHTML=`<div class="card fade space-y-3"><h3 class="serif font-bold text-lg text-navy">${r.judul}</h3>${sec('Diketahui','<ul class="list-disc pl-5 text-sm">'+r.dik.map(x=>`<li>${x}</li>`).join('')+'</ul>')}${sec('Ditanya',`<p class="text-sm">${r.dit}</p>`)}${sec('Rumus',`<p class="text-sm font-mono bg-slate-100 rounded p-2">${r.rumus}</p>`)}${sec('Langkah penyelesaian','<ol class="list-decimal pl-5 text-sm space-y-1">'+r.langkah.map(x=>`<li>${x}</li>`).join('')+'</ol>')}<div class="rounded-xl bg-em-100 border border-em/30 p-3 overflow-x-auto"><div class="text-xs font-semibold text-em mb-1">Jawaban akhir</div><div class="text-sm">${r.jawab}</div></div></div>`;}
const SAMPLE={
 susut:'Sebuah mesin dibeli seharga Rp 50.000.000 dengan nilai residu Rp 5.000.000 dan umur ekonomis 5 tahun. Hitung penyusutan per tahun dengan metode garis lurus.',
 bep:'Biaya tetap Rp 30.000.000 per bulan, biaya variabel Rp 12.000 per unit, harga jual Rp 20.000 per unit. Berapa BEP unit dan rupiah?',
 bunga:'Budi menabung Rp 10.000.000 dengan bunga majemuk 6% per tahun selama 3 tahun. Berapa nilai akhir tabungannya?',
 jurnal:'Tuan Andi menyetor modal tunai Rp 100.000.000. Dibeli peralatan secara kredit Rp 15.000.000. Dibayar sewa Rp 2.000.000 tunai. Pendapatan jasa tunai Rp 8.000.000.',
 spl:'Harga 2 pensil dan 3 buku adalah Rp 17.000. Harga 1 pensil dan 2 buku adalah Rp 11.000.'};
function fillSample(){const c=$('#cat').value;$('#story-in').value=SAMPLE[c==='auto'?'susut':c];}
$('#btn-sample').onclick=fillSample;
$('#btn-solve').onclick=()=>{const t=$('#story-in').value.trim(),out=$('#story-out');if(!t){toast('Isi teks soal dulu');return;}
  let c=$('#cat').value;if(c==='auto')c=detect(t);
  try{const r=SOLV[c](t);showSolve(out,r);addH('Soal Cerita · '+LBL[c],r.judul,'Soal: '+t+'\n\nJawaban: '+strip(r.jawab));toast('Tersimpan di riwayat');}
  catch(e){out.innerHTML=`<div class="card border-red-300 text-sm text-red-700">${esc(e.message)}</div>`;}};

/* ---------- Mode AI ---------- */
const AK='akunmath_ai',DM={gemini:'gemini-2.0-flash',openai:'gpt-4o-mini'};
try{const s=JSON.parse(localStorage.getItem(AK)||'{}');$('#ai-prov').value=s.provider||'gemini';$('#ai-key').value=s.key||'';$('#ai-model').value=s.model||DM[$('#ai-prov').value];}catch(e){$('#ai-model').value=DM.gemini;}
$('#ai-prov').onchange=()=>{$('#ai-model').value=DM[$('#ai-prov').value];};
$('#btn-ai').onclick=async()=>{const prov=$('#ai-prov').value,key=$('#ai-key').value.trim(),model=$('#ai-model').value.trim()||DM[prov],q=$('#ai-q').value.trim(),out=$('#ai-out');
  if(!key||!q){toast('Isi API key dan soal');return;}
  try{localStorage.setItem(AK,JSON.stringify({provider:prov,key,model}));}catch(e){}
  const prompt='Kamu tutor akuntansi dan matematika untuk mahasiswa Indonesia. Jawab dalam Bahasa Indonesia dengan urutan: Diketahui, Ditanya, Rumus, Langkah penyelesaian (bertahap), Jawaban akhir.\n\nSoal:\n'+q;
  out.innerHTML='<div class="card text-sm text-slate-500">Menyusun pembahasan...</div>';
  try{let txt;
    if(prov==='gemini'){const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt}]}]})});const d=await r.json();if(!r.ok)throw new Error(d.error?.message||'Permintaan gagal ('+r.status+')');txt=d.candidates?.[0]?.content?.parts?.map(p=>p.text).join('')||'(Tidak ada jawaban)';}
    else{const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+key},body:JSON.stringify({model,messages:[{role:'user',content:prompt}]})});const d=await r.json();if(!r.ok)throw new Error(d.error?.message||'Permintaan gagal ('+r.status+')');txt=d.choices?.[0]?.message?.content||'(Tidak ada jawaban)';}
    out.innerHTML=`<div class="card fade text-sm leading-relaxed">${esc(txt).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>')}</div>`;
    addH('Soal Cerita · AI',q.slice(0,60),'Soal: '+q+'\n\nPembahasan:\n'+txt);
  }catch(e){out.innerHTML=`<div class="card text-sm text-red-700">${esc(e.message)}</div>`;}};

/* ---------- Kalkulator akuntansi ---------- */
const AKUN=['Kas','Piutang Usaha','Persediaan','Perlengkapan','Peralatan','Kendaraan','Gedung','Tanah','Sewa Dibayar Dimuka','Utang Usaha','Utang Bank','Pendapatan Diterima Dimuka','Modal Pemilik','Prive','Pendapatan Jasa','Penjualan','Beban Gaji','Beban Sewa','Beban Utilitas','Beban Iklan','Beban Penyusutan'];
function jrRow(){const d=document.createElement('div');d.className='jr';d.innerHTML=`<select class="inp jr-a" style="padding:10px 6px">${AKUN.map(a=>`<option>${a}</option>`).join('')}</select><input type="number" inputmode="decimal" placeholder="Debit" class="inp jr-d" style="padding:10px 6px"><input type="number" inputmode="decimal" placeholder="Kredit" class="inp jr-k" style="padding:10px 6px"><button class="text-slate-400 text-xl px-2" aria-label="Hapus baris">×</button>`;d.querySelector('button').onclick=()=>d.remove();$('#jr-rows').append(d);}
$('#jr-add').onclick=jrRow;
$('#jr-calc').onclick=()=>{let D=0,K=0;const L=[];$$('#jr-rows .jr').forEach(r=>{const a=$('.jr-a',r).value,d=+$('.jr-d',r).value||0,k=+$('.jr-k',r).value||0;D+=d;K+=k;if(d||k)L.push(`${d?'Debit':'Kredit'} ${a}: ${nf(d||k)}`);});
  const ok=D===K&&D>0,sel=D-K;$('#jr-out').innerHTML=`<div>Total Debit: <b>${rp(D)}</b></div><div>Total Kredit: <b>${rp(K)}</b></div><div class="mt-1 font-semibold ${ok?'text-em':'text-red-700'}">${ok?'Balance ✓':D===0&&K===0?'Isi nominal dulu':'Tidak balance, selisih '+rp(Math.abs(sel))}</div>`;
  if(D||K)addH('Jurnal Umum',ok?'Jurnal balance':'Jurnal tidak balance',L.join('\n')+`\nTotal D ${nf(D)} / K ${nf(K)}`);};
$('#sd-go').onclick=()=>{const c=num('#sd-c'),r=num('#sd-r')||0,u=Math.round(num('#sd-u')),m=$('#sd-m').value;if(!c||!u||u<1||u>50||r>=c){$('#sd-out').innerHTML='<p class="text-sm text-red-700">Isi harga perolehan dan umur (1–50 tahun); residu harus lebih kecil dari harga.</p>';return;}
  const rows=depTable(c,r,u,m);$('#sd-out').innerHTML=depHtml(rows);addH('Penyusutan',(m==='sl'?'Garis Lurus':'Saldo Menurun')+' '+rp(c),`Residu ${rp(r)}, umur ${u} th. Beban tahun 1: ${rp(rows[0][1])}`);};
$('#bp-go').onclick=()=>{const F=num('#bp-f'),V=num('#bp-v'),P=num('#bp-p');if(isNaN(F)||isNaN(V)||!P||P<=V){$('#bp-out').innerHTML='<p class="text-red-700">Isi semua kolom; harga jual harus lebih besar dari biaya variabel.</p>';return;}
  const cm=P-V,u=Math.ceil(F/cm);$('#bp-out').innerHTML=`<div>Margin kontribusi/unit: <b>${rp(cm)}</b></div><div>Rasio margin kontribusi: <b>${nf(cm/P*100)}%</b></div><div>BEP unit: <b>${nf(u)} unit</b></div><div>BEP rupiah: <b>${rp(u*P)}</b></div>`;addH('BEP',`BEP ${nf(u)} unit`,`F ${nf(F)}, V ${nf(V)}, P ${nf(P)} → ${rp(u*P)}`);};
$('#rs-go').onclick=()=>{const al=num('#rs-al'),ul=num('#rs-ul'),lb=num('#rs-lb'),eq=num('#rs-eq'),sl=num('#rs-sl'),o=[];
  if(ul)o.push(['Current Ratio',nf(al/ul)+' kali']);if(eq)o.push(['ROE',nf(lb/eq*100)+'%']);if(sl)o.push(['NPM',nf(lb/sl*100)+'%']);
  $('#rs-out').innerHTML=o.length?o.map(x=>`<div>${x[0]}: <b>${x[1]}</b></div>`).join(''):'<p class="text-red-700">Isi pasangan data yang diperlukan.</p>';if(o.length)addH('Rasio Keuangan','Rasio keuangan',o.map(x=>x.join(': ')).join('\n'));};

/* ---------- Kalkulator ilmiah ---------- */
let deg=true,ans='';
const D2R=x=>deg?x*Math.PI/180:x,R2D=x=>deg?x*180/Math.PI:x;
const KEYS=[['C','','op'],['⌫','','op'],['(','('],[')',')'],['÷','/','op'],['sin','sin(','op'],['cos','cos(','op'],['tan','tan(','op'],['log','log10(','op'],['ln','log(','op'],['asin','asin(','op'],['acos','acos(','op'],['atan','atan(','op'],['√','sqrt(','op'],['^','^','op'],['7','7'],['8','8'],['9','9'],['×','*','op'],['!','!','op'],['4','4'],['5','5'],['6','6'],['−','-','op'],['π','pi','op'],['1','1'],['2','2'],['3','3'],['+','+','op'],['e','e','op'],['0','0'],['.','.'],['DEG','','op'],['Ans','','op'],['=','','eq']];
$('#sci-keys').innerHTML=KEYS.map((k,i)=>`<button class="key ${k[2]||''}" data-k="${i}">${k[0]}</button>`).join('');
$('#sci-keys').onclick=e=>{const b=e.target.closest('[data-k]');if(!b)return;const k=KEYS[+b.dataset.k],i=$('#sci-in');
  if(k[0]==='C'){i.value='';$('#sci-out').textContent='';}
  else if(k[0]==='⌫')i.value=i.value.slice(0,-1);
  else if(k[0]==='DEG'){deg=!deg;b.textContent=deg?'DEG':'RAD';}
  else if(k[0]==='Ans')i.value+=ans;
  else if(k[0]==='=')sciEval();
  else i.value+=k[1];};
$('#sci-in').addEventListener('keydown',e=>{if(e.key==='Enter')sciEval();});
function sciEval(){const ex=$('#sci-in').value.trim();if(!ex)return;
  try{const r=math.evaluate(ex,{sin:x=>Math.sin(D2R(x)),cos:x=>Math.cos(D2R(x)),tan:x=>Math.tan(D2R(x)),asin:x=>R2D(Math.asin(x)),acos:x=>R2D(Math.acos(x)),atan:x=>R2D(Math.atan(x))});
    ans=math.format(r,{precision:12});$('#sci-out').textContent=ans;addH('Kalkulator Ilmiah',ex+' = '+ans,(deg?'Mode derajat':'Mode radian'));}
  catch(e){$('#sci-out').textContent='Ekspresi tidak valid';}}

/* ---------- Matriks ---------- */
function grid(id,n){const g=$(id);g.style.gridTemplateColumns=`repeat(${n},1fr)`;g.innerHTML=Array.from({length:n*n},()=>'<input type="number" inputmode="decimal" class="inp text-center" style="padding:10px 2px" value="0">').join('');}
const rd=(id,n)=>{const v=$$('input',$(id)).map(i=>+i.value||0);return Array.from({length:n},(_,r)=>v.slice(r*n,r*n+n));};
const mtx=m=>`<table class="tb">${m.map(r=>`<tr>${r.map(c=>`<td class="r">${nf(c)}</td>`).join('')}</tr>`).join('')}</table>`;
const mtxT=m=>m.map(r=>r.map(nf).join('  ')).join('\n');
function mxOp(op){const n=+$('#mx-n').value,A=rd('#mx-a',n),B=rd('#mx-b',n),o=$('#mx-out');let t,h;
  if(op==='add'){const r=math.add(A,B);t='A + B';h=mtx(r);addH('Matriks',t,mtxT(r));}
  else if(op==='mul'){const r=math.multiply(A,B);t='A × B';h=mtx(r);addH('Matriks',t,mtxT(r));}
  else{const m=op==='deta'?A:B,d=math.det(m);t='det('+(op==='deta'?'A':'B')+')';h=`<b>${t} = ${nf(d)}</b>`;addH('Matriks',t+' = '+nf(d),mtxT(m));}
  o.innerHTML=`<div class="font-semibold mb-1">${t}</div>${h}`;}
$('#mx-n').onchange=()=>{const n=+$('#mx-n').value;grid('#mx-a',n);grid('#mx-b',n);$('#mx-out').innerHTML='';};

/* ---------- Init ---------- */
jrRow();jrRow();grid('#mx-a',2);grid('#mx-b',2);
setTab('story','off');setTab('calcgrp','ak');setTab('ak','jurnal');setTab('mt','sci');renderH();
