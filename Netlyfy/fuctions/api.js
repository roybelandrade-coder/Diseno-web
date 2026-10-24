const JSZip=require('jszip');
const H={};
const SB=process.env.SUPABASE_URL,SK=process.env.SUPABASE_SERVICE_KEY;
const PP=process.env.PAYPAL_ENV==='live'?'https://api-m.paypal.com':'https://api-m.sandbox.paypal.com';
const res=(c,b)=>({statusCode:c,headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});
async function user(ev){const t=(ev.headers.authorization||'').replace('Bearer ','');if(!t)return null;const r=await fetch(SB+'/auth/v1/user',{headers:{apikey:SK,Authorization:'Bearer '+t}});return r.ok?r.json():null}
async function rest(path,opt={}){const r=await fetch(SB+'/rest/v1/'+path,{...opt,headers:{apikey:SK,Authorization:'Bearer '+SK,'Content-Type':'application/json',Prefer:'return=representation',...(opt.headers||{})}});const j=await r.json().catch(()=>null);if(!r.ok)throw new Error('db '+JSON.stringify(j));return j}
async function ppToken(){const r=await fetch(PP+'/v1/oauth2/token',{method:'POST',headers:{Authorization:'Basic '+Buffer.from(process.env.PAYPAL_CLIENT_ID+':'+process.env.PAYPAL_SECRET).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials'});const j=await r.json();if(!r.ok)throw new Error('paypal auth');return j.access_token}


const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const IMG=/^data:image\/[a-z+]+;base64,[A-Za-z0-9+\/=]+$/;
function norm(P){const t=x=>typeof x=='string'?x:'';const o={name:t(P.name),color:/^#[0-9a-f]{3,8}$/i.test(P.color)?P.color:'#e11d2e',dark:!!P.dark,font:t(P.font),wa:t(P.wa),email:t(P.email),css:t(P.css),js:t(P.js),cur:0};
o.pages=P.pages.slice(0,20).map(p=>({name:t(p.name)||'Página',secs:(Array.isArray(p.secs)?p.secs:[]).slice(0,60).map(s=>({type:t(s.type),title:t(s.title),text:t(s.text),items:t(s.items),btn:t(s.btn),img:IMG.test(s.img)?s.img:'',imgs:(Array.isArray(s.imgs)?s.imgs:[]).filter(u=>IMG.test(u)).slice(0,40)}))}));return o}
const mk=function(P0){const P=norm(P0);
const FONTS={'Moderna':'system-ui,sans-serif','Elegante':'Georgia,serif','Redonda':"'Trebuchet MS',sans-serif",'Técnica':"'Courier New',monospace"};
const slug=(s,i)=>i==0?'index':(s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'pagina'+i);
const lines=s=>String(s||'').split('\n').map(x=>x.trim()).filter(Boolean).map(x=>x.split('|').map(y=>y.trim()));
function css(){const d=P.dark;return `:root{--c:${esc(P.color)}}*{box-sizing:border-box}body{margin:0;font-family:${FONTS[P.font]};background:${d?'#0f0f12':'#fff'};color:${d?'#f5f5f5':'#18181b'};line-height:1.6}h1,h2,h3{line-height:1.2}nav{display:flex;gap:16px;align-items:center;flex-wrap:wrap;padding:14px 6%;border-bottom:1px solid #8884}nav b{margin-right:auto;color:var(--c)}nav a{text-decoration:none;color:inherit}section{padding:56px 6%;max-width:1100px;margin:auto}.hero{max-width:none;text-align:center;padding:100px 6%;background-size:cover;background-position:center}.hero h1{font-size:clamp(30px,6vw,54px)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}.card{background:${d?'#1a1a1f':'#f4f4f5'};border-radius:12px;padding:20px}.card h3{margin-top:0}.p{font-size:28px;font-weight:800;color:var(--c)}.btn{display:inline-block;background:var(--c);color:#fff;padding:11px 22px;border-radius:10px;text-decoration:none;border:0;font:inherit;cursor:pointer}.grid img{width:100%;height:200px;object-fit:cover;border-radius:12px}.ph{height:200px;border-radius:12px;background:var(--c);opacity:.25}form{display:grid;gap:10px;max-width:480px}input,textarea{padding:10px;border-radius:8px;border:1px solid #8886;font:inherit;background:transparent;color:inherit}.wa{position:fixed;right:16px;bottom:16px;background:#25d366;color:#fff;padding:12px 18px;border-radius:30px;text-decoration:none;font-weight:700}`+P.css}
function secHTML(s,i){const g=lines(s.items),h=s.title?`<h2>${esc(s.title)}</h2>`:'',id=`id="s${i}"`;
if(s.type=='hero')return`<section ${id} class="hero"${s.img?` style="background-image:linear-gradient(#0008,#0008),url(${s.img});color:#fff"`:''}><h1>${esc(s.title)}</h1><p>${esc(s.text)}</p>${s.btn?`<a class="btn" href="#contacto">${esc(s.btn)}</a>`:''}</section>`;
if(s.type=='services')return`<section ${id}>${h}<div class="grid">${g.map(r=>`<div class="card"><h3>${esc(r[0])}</h3><p>${esc(r[1]||'')}</p></div>`).join('')}</div></section>`;
if(s.type=='pricing')return`<section ${id}>${h}<div class="grid">${g.map(r=>`<div class="card"><h3>${esc(r[0])}</h3><div class="p">${esc(r[1]||'')}</div><p>${esc(r[2]||'')}</p></div>`).join('')}</div></section>`;
if(s.type=='gallery')return`<section ${id}>${h}<div class="grid">${s.imgs.length?s.imgs.map(u=>`<img src="${u}" alt="">`).join(''):'<div class="ph"></div><div class="ph"></div><div class="ph"></div>'}</div></section>`;
if(s.type=='social')return`<section ${id}>${h}<p>${g.filter(r=>/^https?:\/\//.test(r[1]||'')).map(r=>`<a class="btn" style="margin:4px" href="${esc(r[1])}" target="_blank" rel="noopener">${esc(r[0])}</a>`).join('')}</p></section>`;
if(s.type=='contact'){const w=(P.wa||'').replace(/\D/g,'');return`<section ${id}><span id="contacto"></span>${h}<p>${esc(s.text)}</p>${P.email?`<form action="mailto:${esc(P.email)}" method="post" enctype="text/plain"><input name="nombre" placeholder="Tu nombre" required><input name="correo" type="email" placeholder="Tu correo" required><textarea name="mensaje" placeholder="Tu mensaje" required></textarea><button class="btn">Enviar</button></form>`:''}${w?`<p><a class="btn" href="https://wa.me/${w}" target="_blank" rel="noopener">WhatsApp</a></p>`:''}</section>`}
return`<section ${id}>${h}<p>${esc(s.text).replace(/\n/g,'<br>')}</p></section>`}
function gen(pi,pre){const pg=P.pages[pi],w=(P.wa||'').replace(/\D/g,'');
return`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(P.name)} - ${esc(pg.name)}</title>${pre?`<style>${css()}</style>`:'<link rel="stylesheet" href="style.css">'}</head><body><nav><b>${esc(P.name)}</b>${P.pages.map((p,i)=>`<a href="${slug(p.name,i)}.html">${esc(p.name)}</a>`).join('')}</nav>${pg.secs.map(secHTML).join('')}${w?`<a class="wa" href="https://wa.me/${w}" target="_blank" rel="noopener">WhatsApp</a>`:''}${pre?`<script>document.addEventListener('click',e=>{const a=e.target.closest('a');if(a&&/\\.html$/.test(a.getAttribute('href')))e.preventDefault()})<\/script>`:'<script src="script.js"><\/script>'}</body></html>`}
return {gen,css,slug,P}}

H['config']=async()=>({statusCode:200,headers:{'Content-Type':'application/json'},body:JSON.stringify({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_ANON_KEY,paypal:process.env.PAYPAL_CLIENT_ID})});


H['create-order']=async ev=>{try{
const u=await user(ev);if(!u)return res(401,{error:'Inicia sesión'});
const b=JSON.parse(ev.body||'{}');
const [pl]=await rest('plans?id=eq.'+encodeURIComponent(b.plan_id)+'&select=*');
if(!pl)return res(400,{error:'Plan inválido'});
const t=await ppToken();
const r=await fetch(PP+'/v2/checkout/orders',{method:'POST',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json'},body:JSON.stringify({intent:'CAPTURE',purchase_units:[{description:'Diseño Web Profesional - '+pl.name,amount:{currency_code:'USD',value:Number(pl.price).toFixed(2)}}]})});
const o=await r.json();if(!r.ok)return res(502,{error:'PayPal rechazó el pedido'});
await rest('orders',{method:'POST',body:JSON.stringify({user_id:u.id,user_email:u.email,plan_id:pl.id,plan_name:pl.name,amount:pl.price,status:'pending',paypal_order_id:o.id,project_name:String(b.project||'').slice(0,100)})});
return res(200,{id:o.id})}catch(e){return res(500,{error:'Error del servidor'})}};


H['capture-order']=async ev=>{try{
const u=await user(ev);if(!u)return res(401,{error:'Inicia sesión'});
const {orderID}=JSON.parse(ev.body||'{}');
const [o]=await rest('orders?paypal_order_id=eq.'+encodeURIComponent(orderID)+'&user_id=eq.'+u.id+'&select=*');
if(!o)return res(404,{error:'Pedido no encontrado'});
if(o.status==='paid')return res(200,{ok:true});
const t=await ppToken();
const r=await fetch(PP+'/v2/checkout/orders/'+encodeURIComponent(orderID)+'/capture',{method:'POST',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json'}});
const c=await r.json(),cap=c.purchase_units?.[0]?.payments?.captures?.[0];
// Verificación oficial: estado COMPLETED + moneda + monto igual al precio guardado en TU base de datos
const ok=r.ok&&c.status==='COMPLETED'&&cap&&cap.status==='COMPLETED'&&cap.amount.currency_code==='USD'&&Number(cap.amount.value)===Number(o.amount);
if(!ok)return res(402,{error:'El pago no se pudo verificar'});
await rest('orders?id=eq.'+o.id,{method:'PATCH',body:JSON.stringify({status:'paid',paid_at:new Date().toISOString()})});
return res(200,{ok:true})}catch(e){return res(500,{error:'Error del servidor'})}};


H['request-order']=async ev=>{try{const u=await user(ev);if(!u)return res(401,{error:'Inicia sesión'});const b=JSON.parse(ev.body||'{}');
const [pl]=await rest('plans?id=eq.'+encodeURIComponent(b.plan_id)+'&select=*');if(!pl)return res(400,{error:'Plan inválido'});
const [o]=await rest('orders',{method:'POST',body:JSON.stringify({user_id:u.id,user_email:u.email,plan_id:pl.id,plan_name:pl.name,amount:pl.price,status:'pending',project_name:String(b.project||'').slice(0,100),contact:String(b.contact||'').replace(/[^0-9+]/g,'').slice(0,20)})});
return res(200,{id:o.id})}catch(e){return res(500,{error:'Error del servidor'})}};


H['confirm-order']=async ev=>{try{const u=await user(ev);if(!u||!u.email_confirmed_at)return res(401,{error:'Inicia sesión'});
const a=await rest('admins?email=eq.'+encodeURIComponent(u.email)+'&select=email');if(!a.length)return res(403,{error:'Solo el administrador'});
const {id}=JSON.parse(ev.body||'{}');await rest('orders?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({status:'paid',paid_at:new Date().toISOString()})});
return res(200,{ok:true})}catch(e){return res(500,{error:'Error del servidor'})}};


H['export']=async ev=>{try{
const u=await user(ev);if(!u)return res(401,{error:'Inicia sesión'});
if((ev.body||'').length>5e6)return res(413,{error:'Proyecto demasiado grande (reduce las imágenes)'});
const b=JSON.parse(ev.body||'{}');
const os=await rest('orders?user_id=eq.'+u.id+'&status=eq.paid&order=created_at.asc&select=*');
const o=b.order_id?os.find(x=>x.id===b.order_id):os.find(x=>!x.snapshot);
if(!o)return res(403,{error:'No tienes un pago confirmado disponible'});
let P=o.snapshot;
if(!P){P=b.project;if(!P||!Array.isArray(P.pages)||!P.pages.length)return res(400,{error:'Proyecto inválido'});
await rest('orders?id=eq.'+o.id,{method:'PATCH',body:JSON.stringify({snapshot:P,used_at:new Date().toISOString()})})}
const S=mk(P);P=S.P;const z=new JSZip(),A=z.folder('assets'),seen={};let n=0;
const ext=h=>h.replace(/data:image\/([a-z+]+);base64,[A-Za-z0-9+\/=]+/g,m=>{if(!seen[m]){const x=m.slice(11,m.indexOf(';')).replace('jpeg','jpg').replace('+xml','');const nm='img'+(++n)+'.'+x;A.file(nm,m.split(',')[1],{base64:true});seen[m]='assets/'+nm}return seen[m]});
P.pages.forEach((p,i)=>z.file(S.slug(p.name,i)+'.html',ext(S.gen(i,0))));
z.file('style.css',S.css()+'\n');z.file('script.js',P.js||'// Tu JavaScript aquí\n');
z.file('LEEME.txt','Tu sitio: '+P.name+'\n\nPUBLICAR GRATIS\n1) Netlify: entra a app.netlify.com/drop y arrastra esta carpeta descomprimida. Obtendrás una URL pública.\n2) GitHub Pages: crea un repositorio, sube estos archivos, ve a Settings > Pages y elige la rama main.\n3) Cloudflare Pages: Workers & Pages > Create > Pages > Upload assets.\n\nDOMINIO PROPIO: en el panel del servicio, sección Domains / Custom domain.\n\nNOTA: el formulario de contacto abre el correo del visitante (mailto). Para formularios reales usa Netlify Forms o Formspree.\n\nAyuda por WhatsApp: https://wa.me/50589493456\n');
const buf=await z.generateAsync({type:'nodebuffer'});
return res(200,{name:S.slug(P.name,1)+'.zip',data:buf.toString('base64')})}catch(e){return res(500,{error:'No se pudo generar el ZIP'})}};


exports.handler=async ev=>{const h=H[(ev.queryStringParameters||{}).fn];if(!h)return res(404,{error:'No existe'});return h(ev)};
  
