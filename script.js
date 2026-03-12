// ============================================================
// DATABASE
// ============================================================
const DB_KEY = 'ghouDB5';
let DB = {
  users:{ admin:'solar786', cashier:'cash123' },
  products:[], sales:[], customers:[], expenses:[], returns:[], activityLog:[],
  categories:['Solar Panels','Inverters','Batteries','Cables & Wires','Charge Controllers','Mounting','LED Lights','Accessories'],
  settings:{ shopName:'Ghousia Solar & Electric System', address:'', phone:'', gstRate:17, gstEnabled:false },
  nextInvoice:1001, nextProdId:1, nextCustId:1, nextRetNo:1
};
let currentUser=null, cart=[], editProd=null, editCust=null, editExp=null, rstTarget=null, retSale=null, retSelectedItems=[];

function loadDB(){
  try{ const s=localStorage.getItem(DB_KEY); if(s){ const d=JSON.parse(s); Object.assign(DB,d); } }catch(e){}
  // ensure arrays exist
  ['products','sales','customers','expenses','returns','activityLog','categories'].forEach(k=>{ if(!Array.isArray(DB[k])) DB[k]=[]; });
  if(!DB.settings) DB.settings={shopName:'Ghousia Solar & Electric System',address:'',phone:'',gstRate:17,gstEnabled:false};
  if(DB.settings.gstRate===undefined) DB.settings.gstRate=17;
  if(DB.settings.gstEnabled===undefined) DB.settings.gstEnabled=false;
  if(!DB.nextRetNo) DB.nextRetNo=1;
}
function saveDB(){ try{ localStorage.setItem(DB_KEY, JSON.stringify(DB)); }catch(e){ toast('Storage error!','err'); } }
loadDB();

// Seed products if empty
if(DB.products.length===0){
  const seeds=[
    {name:'200W Solar Panel',sku:'SP-200W',cat:'Solar Panels',buy:8000,sell:12000,stock:15,minStock:3,unit:'Piece',icon:'',desc:'Monocrystalline 200W'},
    {name:'400W Solar Panel',sku:'SP-400W',cat:'Solar Panels',buy:15000,sell:22000,stock:8,minStock:2,unit:'Piece',icon:'',desc:'Poly 400W'},
    {name:'1KW Pure Sine Inverter',sku:'INV-1K',cat:'Inverters',buy:10000,sell:14500,stock:5,minStock:2,unit:'Piece',icon:'',desc:'Pure Sine Wave'},
    {name:'3KW Hybrid Inverter',sku:'INV-3K',cat:'Inverters',buy:28000,sell:38000,stock:3,minStock:1,unit:'Piece',icon:'',desc:''},
    {name:'150Ah Tubular Battery',sku:'BAT-150',cat:'Batteries',buy:18000,sell:24000,stock:4,minStock:2,unit:'Piece',icon:'',desc:''},
    {name:'100Ah AGM Battery',sku:'BAT-100',cat:'Batteries',buy:12000,sell:16000,stock:6,minStock:2,unit:'Piece',icon:'',desc:''},
    {name:'2.5mm Solar Cable',sku:'CAB-25',cat:'Cables & Wires',buy:30,sell:60,stock:200,minStock:50,unit:'Meter',icon:'',desc:''},
    {name:'MPPT 30A Controller',sku:'CC-30',cat:'Charge Controllers',buy:3500,sell:5500,stock:7,minStock:2,unit:'Piece',icon:'',desc:''},
    {name:'LED Bulb 20W',sku:'LED-20',cat:'LED Lights',buy:120,sell:220,stock:50,minStock:10,unit:'Piece',icon:'',desc:''},
    {name:'MC4 Connector Pair',sku:'MC4-P',cat:'Accessories',buy:80,sell:150,stock:100,minStock:20,unit:'Pair',icon:'',desc:''},
  ];
  seeds.forEach(p=>{ DB.products.push({id:DB.nextProdId++,...p}); });
  saveDB();
}
if(DB.customers.length===0){
  [{name:'Ahmed Ali',phone:'0300-1234567',city:'Lahore',addr:'',notes:''},{name:'Muhammad Usman',phone:'0321-9876543',city:'Faisalabad',addr:'',notes:'Regular customer'},{name:'Sara Khan',phone:'0333-5555555',city:'Karachi',addr:'',notes:''}]
    .forEach(c=>{ DB.customers.push({id:DB.nextCustId++,...c}); });
  saveDB();
}

// ============================================================
// ACTIVITY LOG
// ============================================================
function logAct(type,msg){
  DB.activityLog.unshift({type,msg,date:new Date().toISOString(),user:currentUser?currentUser.name:'System'});
  if(DB.activityLog.length>300) DB.activityLog=DB.activityLog.slice(0,300);
}
function renderActivity(){
  const el=document.getElementById('actList');
  if(!DB.activityLog.length){el.innerHTML='<div class="empty"><div class="ei"></div><p>No activity yet</p></div>';return;}
  el.innerHTML=DB.activityLog.map(a=>`<div class="ait"><div class="ad ${a.type}"></div><div style="flex:1"><div style="font-weight:700">${a.msg}</div><div style="display:flex;gap:10px;margin-top:3px"><span style="font-family:JetBrains Mono,monospace;font-size:10px;color:var(--muted)">${new Date(a.date).toLocaleString()}</span><span style="font-size:11px;color:var(--muted);font-weight:600">by ${a.user}</span></div></div></div>`).join('');
}

// ============================================================
// AUTH
// ============================================================
let selRole='admin';
function setRole(r){selRole=r;document.querySelectorAll('.role-tab').forEach((t,i)=>t.classList.toggle('active',(i===0&&r==='admin')||(i===1&&r==='cashier')));}
function doLogin(){
  const u=document.getElementById('loginUser').value.trim(), p=document.getElementById('loginPass').value;
  const err=document.getElementById('loginError');
  if(selRole==='admin'&&u==='admin'&&p===DB.users.admin) currentUser={role:'admin',name:'Admin/Owner'};
  else if(selRole==='cashier'&&u==='cashier'&&p===DB.users.cashier) currentUser={role:'cashier',name:'Cashier'};
  else{err.style.display='block';return;}
  err.style.display='none';
  document.getElementById('loginScreen').style.display='none';
  document.getElementById('app').style.display='flex';
  document.getElementById('uRole').textContent=currentUser.role==='admin'?' Owner':' Cashier';
  document.getElementById('uName').textContent=currentUser.name;
  document.querySelectorAll('.admin-only').forEach(el=>el.style.display=currentUser.role==='admin'?'':'none');
  setInterval(()=>document.getElementById('clk').textContent=new Date().toLocaleString('en-PK',{weekday:'short',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}),1000);
  updateGSTUI(); initApp();
}
document.getElementById('loginPass').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});
function doLogout(){currentUser=null;cart=[];document.getElementById('loginScreen').style.display='flex';document.getElementById('app').style.display='none';document.getElementById('loginUser').value='';document.getElementById('loginPass').value='';}

// ============================================================
// NAVIGATION
// ============================================================
const pgNames={dashboard:'Dashboard',pos:'POS / Sale',inventory:'Inventory',customers:'Customers',sales:'Sales History',reports:'Reports',expenses:'Expenses',returns:'Returns & Refunds',activity:'Activity Log',settings:'Settings'};
function showPage(p){
  document.querySelectorAll('.page').forEach(el=>el.classList.remove('active'));
  document.querySelectorAll('.nb').forEach(el=>el.classList.remove('active'));
  document.getElementById('page-'+p).classList.add('active');
  const nb=document.getElementById('nav-'+p); if(nb) nb.classList.add('active');
  document.getElementById('topTitle').textContent=pgNames[p]||p;
  if(p==='dashboard') renderDash();
  if(p==='pos') initPOS();
  if(p==='inventory') renderInv();
  if(p==='customers') renderCusts();
  if(p==='sales') renderSales();
  if(p==='reports') renderReports();
  if(p==='expenses') renderExp();
  if(p==='returns') renderReturns();
  if(p==='activity') renderActivity();
  if(p==='settings') renderSettings();
}
function initApp(){renderDash();initPOS();renderInv();renderCusts();renderSales();renderSettings();}

// ============================================================
// GST
// ============================================================
function toggleGST(){
  DB.settings.gstEnabled=!DB.settings.gstEnabled;
  saveDB(); updateGSTUI(); updateTotals();
  toast(DB.settings.gstEnabled?` GST ${DB.settings.gstRate}% ON`:'GST Disabled',DB.settings.gstEnabled?'ok':'warn');
}
function updateGSTUI(){
  const on=DB.settings.gstEnabled, r=DB.settings.gstRate;
  const pill=document.getElementById('gstPill'); if(!pill)return;
  pill.classList.toggle('on',on);
  document.getElementById('gstPillTxt').textContent=on?'GST ON':'GST OFF';
  document.getElementById('gstPillRate').textContent=on?` ${r}%`:'';
  const gr=document.getElementById('gstRow'); if(gr) gr.style.display=on?'flex':'none';
  const grd=document.getElementById('gstRD'); if(grd) grd.textContent=r;
  const btn=document.getElementById('gstTogBtn'); if(btn){btn.textContent=on?'Disable GST':'Enable GST';btn.className='btn '+(on?'btn-danger':'btn-success');}
  const st=document.getElementById('gstStatTxt'); if(st) st.textContent=on?`ON — ${r}%`:'OFF';
  const inp=document.getElementById('gstRateInp'); if(inp) inp.value=r;
}
function saveGSTSettings(){
  const v=parseFloat(document.getElementById('gstRateInp').value);
  if(isNaN(v)||v<0||v>100){toast('Invalid GST rate','err');return;}
  DB.settings.gstRate=v; saveDB(); updateGSTUI(); updateTotals(); toast(' GST settings saved!');
}

// ============================================================
// DASHBOARD
// ============================================================
function renderDash(){
  const td=new Date().toDateString();
  const ts=DB.sales.filter(s=>new Date(s.date).toDateString()===td);
  const rev=ts.reduce((a,s)=>a+s.total,0);
  const itms=ts.reduce((a,s)=>a+s.items.reduce((b,i)=>b+i.qty,0),0);
  const low=DB.products.filter(p=>p.stock<=p.minStock);
  document.getElementById('d-rev').textContent='Rs '+rev.toLocaleString();
  document.getElementById('d-items').textContent=itms;
  document.getElementById('d-prods').textContent=DB.products.length;
  document.getElementById('d-low').textContent=low.length;
  const isAdmin=currentUser&&currentUser.role==='admin';
  document.getElementById('lowTbl').innerHTML=low.length?low.map(p=>`<tr><td>${p.icon||''} <b>${p.name}</b></td><td><span class="badge ${p.stock===0?'bg-red':'bg-yellow'}">${p.stock} ${p.unit}</span></td><td>${isAdmin?`<button class="btn btn-success btn-sm" onclick="openRestock(${p.id})"> Restock</button>`:'<span style="color:var(--muted);font-size:11px">Admin only</span>'}</td></tr>`).join(''):'<tr><td colspan="3" style="text-align:center;color:var(--muted);padding:16px;font-weight:700"> All items well stocked</td></tr>';
  const rec=[...DB.sales].reverse().slice(0,6);
  document.getElementById('recTbl').innerHTML=rec.length?rec.map(s=>`<tr><td style="font-family:JetBrains Mono,monospace;color:var(--g3);font-weight:700">#${s.invoice}</td><td style="font-weight:800">Rs ${s.total.toLocaleString()}</td><td style="color:var(--amber);font-size:11px;font-weight:700">${s.gstAmt>0?'Rs '+s.gstAmt.toLocaleString():'—'}</td><td style="color:var(--muted);font-size:12px">${new Date(s.date).toLocaleTimeString()}</td></tr>`).join(''):'<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:16px;font-weight:700">No sales yet</td></tr>';
  document.querySelectorAll('.admin-only').forEach(el=>el.style.display=isAdmin?'':'none');
}

// ============================================================
// POS
// ============================================================
let activeCat='All';
function initPOS(){
  const cats=['All',...DB.categories];
  document.getElementById('catTabs').innerHTML=cats.map(c=>`<button class="ct ${c===activeCat?'active':''}" onclick="selCat('${c}',this)">${c}</button>`).join('');
  populateCustSel(); renderPOS();
}
function selCat(c,el){activeCat=c;document.querySelectorAll('.ct').forEach(t=>t.classList.remove('active'));el.classList.add('active');renderPOS();}
function renderPOS(){
  const q=document.getElementById('posQ').value.toLowerCase();
  let prods=DB.products;
  if(activeCat!=='All') prods=prods.filter(p=>p.cat===activeCat);
  if(q) prods=prods.filter(p=>p.name.toLowerCase().includes(q)||p.sku.toLowerCase().includes(q));
  const g=document.getElementById('prodGrid');
  if(!prods.length){g.innerHTML='<div class="empty"><div class="ei">🔍</div><p>No products found</p></div>';return;}
  g.innerHTML=prods.map(p=>`<div class="pc ${p.stock===0?'oos':''}" onclick="addCart(${p.id})"><div class="pi">${p.icon||''}</div><div class="pn">${p.name}</div><div class="pp">Rs ${p.sell.toLocaleString()}</div><div class="pst">${p.stock===0?'<span style="color:var(--red)">Out of Stock</span>':`Stock: ${p.stock} ${p.unit}`}</div></div>`).join('');
}
function populateCustSel(){const s=document.getElementById('posCust');if(!s)return;const v=s.value;s.innerHTML='<option value="">— Walk-in Customer —</option>'+DB.customers.map(c=>`<option value="${c.id}">${c.name}${c.phone?' ('+c.phone+')':''}</option>`).join('');if(v)s.value=v;}
function addCart(id){
  const p=DB.products.find(x=>x.id===id); if(!p||p.stock===0)return;
  const ex=cart.find(c=>c.id===id);
  if(ex){if(ex.qty>=p.stock){toast(' Max stock reached','err');return;}ex.qty++;}
  else cart.push({id,name:p.name,price:p.sell,qty:1,unit:p.unit,icon:p.icon||''});
  renderCart();
}
function renderCart(){
  const el=document.getElementById('cartBody');
  if(!cart.length){el.innerHTML='<div class="empty"><div class="ei">🛒</div><p>Cart is empty</p></div>';updateTotals();return;}
  el.innerHTML=cart.map((c,i)=>`<div class="ci"><span style="font-size:17px">${c.icon}</span><div class="cii"><div class="cin">${c.name}</div><div class="cip">Rs ${c.price.toLocaleString()} / ${c.unit}</div></div><div class="qc"><button class="qb" onclick="chgQty(${i},-1)">−</button><span class="qv">${c.qty}</span><button class="qb" onclick="chgQty(${i},1)">+</button><button class="qb" style="color:var(--red)" onclick="remCart(${i})">✕</button></div></div>`).join('');
  updateTotals();
}
function chgQty(i,d){const p=DB.products.find(x=>x.id===cart[i].id);cart[i].qty+=d;if(cart[i].qty>p.stock){cart[i].qty=p.stock;toast(' Max stock','warn');}if(cart[i].qty<=0)cart.splice(i,1);renderCart();}
function remCart(i){cart.splice(i,1);renderCart();}
function clearCart(){cart=[];document.getElementById('discInp').value=0;renderCart();}
function calcTotals(){
  const sub=cart.reduce((a,c)=>a+c.price*c.qty,0);
  const disc=parseFloat(document.getElementById('discInp').value)||0;
  const after=Math.max(0,sub-disc);
  const gst=DB.settings.gstEnabled?Math.round(after*(DB.settings.gstRate/100)*100)/100:0;
  return{sub,disc,after,gst,total:after+gst};
}
function updateTotals(){
  const {sub,gst,total}=calcTotals();
  document.getElementById('cSub').textContent='Rs '+sub.toLocaleString();
  document.getElementById('cGST').textContent='Rs '+gst.toLocaleString();
  document.getElementById('cTotal').textContent='Rs '+total.toLocaleString();
  const gr=document.getElementById('gstRow');if(gr)gr.style.display=DB.settings.gstEnabled?'flex':'none';
  const grd=document.getElementById('gstRD');if(grd)grd.textContent=DB.settings.gstRate;
}
function checkout(){
  if(!cart.length){toast('Cart is empty','err');return;}
  const {sub,disc,gst,total}=calcTotals();
  const payment=document.getElementById('payMeth').value;
  const custId=document.getElementById('posCust').value;
  const cust=custId?DB.customers.find(c=>c.id==custId):null;
  const inv=DB.nextInvoice++;
  const sale={invoice:inv,date:new Date().toISOString(),customer:cust?cust.name:'Walk-in',customerId:custId||null,payment,subtotal:sub,discount:disc,gstRate:DB.settings.gstEnabled?DB.settings.gstRate:0,gstAmt:gst,total,items:cart.map(c=>({...c})),cashier:currentUser.name};
  sale.items.forEach(c=>{const p=DB.products.find(x=>x.id===c.id);if(p)p.stock-=c.qty;});
  DB.sales.push(sale); logAct('sale',`Sale #${inv} — Rs ${total.toLocaleString()} (${payment})`); saveDB();
  showReceipt(sale); cart=[];document.getElementById('discInp').value=0;
  renderCart();renderPOS();renderDash();
}
function showReceipt(s){
  const st=DB.settings;
  document.getElementById('receiptContent').innerHTML=buildReceipt(s);
  openModal('receiptModal');
}
function buildReceipt(s){
  const st=DB.settings;
  const disc = s.discount>0 ? '<div class="rl"><span>Discount:</span><span>-Rs '+s.discount.toLocaleString()+'</span></div>' : '';
  const gstLine = s.gstAmt>0 ? '<div class="rl rgst"><span>GST ('+s.gstRate+'%):</span><span>Rs '+s.gstAmt.toLocaleString()+'</span></div>' : '';
  const itemsHtml = s.items.map(function(i){return '<div class="rl"><span>'+i.name+' x'+i.qty+'</span><span>Rs '+(i.price*i.qty).toLocaleString()+'</span></div>';}).join('');
  return '<div class="receipt"><h4>'+(st.shopName||'Ghousia Solar & Electric')+'</h4><div class="rsub2">'+(st.address||'')+' '+(st.phone?' | '+st.phone:'')+'</div><div class="rdiv"></div><div class="rl"><span>Invoice:</span><span>#'+s.invoice+'</span></div><div class="rl"><span>Date:</span><span>'+new Date(s.date).toLocaleString()+'</span></div><div class="rl"><span>Customer:</span><span>'+s.customer+'</span></div><div class="rl"><span>Cashier:</span><span>'+s.cashier+'</span></div><div class="rl"><span>Payment:</span><span>'+s.payment+'</span></div><div class="rdiv"></div>'+itemsHtml+'<div class="rdiv"></div><div class="rl"><span>Subtotal:</span><span>Rs '+s.subtotal.toLocaleString()+'</span></div>'+disc+gstLine+'<div class="rl rtot"><span>TOTAL:</span><span>Rs '+s.total.toLocaleString()+'</span></div><div class="rdiv"></div><div style="text-align:center;font-size:11px">Thank you for your business! ☀️</div></div>';
}
function printReceipt(){const w=window.open('','_blank','width=400,height=640');w.document.write('<html><body style="margin:20px">'+document.getElementById('receiptContent').innerHTML+'</body></html>');w.document.close();w.print();}

// ============================================================
// INVENTORY
// ============================================================
function renderInv(){
  const q=document.getElementById('invQ').value.toLowerCase();
  const cf=document.getElementById('invCatF').value;
  const sf=document.getElementById('invStatusF').value;
  // Refresh cat filter
  const sel=document.getElementById('invCatF'),cv=sel.value;
  sel.innerHTML='<option value="">All Categories</option>'+DB.categories.map(c=>`<option value="${c}"${c===cv?' selected':''}>${c}</option>`).join('');
  let prods=DB.products;
  if(cf) prods=prods.filter(p=>p.cat===cf);
  if(sf==='low') prods=prods.filter(p=>p.stock>0&&p.stock<=p.minStock);
  else if(sf==='out') prods=prods.filter(p=>p.stock===0);
  else if(sf==='ok') prods=prods.filter(p=>p.stock>p.minStock);
  if(q) prods=prods.filter(p=>p.name.toLowerCase().includes(q)||(p.sku||''). toLowerCase().includes(q)||p.cat.toLowerCase().includes(q));
  const isAdmin=currentUser&&currentUser.role==='admin';
  const tb=document.getElementById('invTbl');
  if(!prods.length){tb.innerHTML='<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:20px;font-weight:700">No products found</td></tr>';return;}
  tb.innerHTML=prods.map(p=>{
    const sc=p.stock===0?'bg-red':p.stock<=p.minStock?'bg-yellow':'bg-green';
    const sl=p.stock===0?'Out of Stock':p.stock<=p.minStock?'Low Stock':'In Stock';
    return `<tr>
      <td style="font-family:JetBrains Mono,monospace;font-size:11px;color:var(--muted);font-weight:600">${p.sku||'—'}</td>
      <td><span style="font-size:14px;margin-right:5px">${p.icon||''}</span><b>${p.name}</b>${p.desc?`<div style="font-size:11px;color:var(--muted)">${p.desc}</div>`:''}</td>
      <td><span class="badge bg-blue" style="font-size:10px">${p.cat}</span></td>
      <td style="font-weight:700">${p.buy?'Rs '+p.buy.toLocaleString():'—'}</td>
      <td style="font-weight:900;color:var(--g3)">Rs ${p.sell.toLocaleString()}</td>
      <td style="font-weight:800">${p.stock} ${p.unit}</td>
      <td style="color:var(--muted);font-size:12px">${p.minStock}</td>
      <td><span class="badge ${sc}">${sl}</span></td>
      <td><div style="display:flex;gap:4px">
        ${isAdmin?`<button class="btn btn-blue btn-sm" onclick="openEditProd(${p.id})">✏️</button>`:''}
        <button class="btn btn-success btn-sm" onclick="openRestock(${p.id})"></button>
        ${isAdmin?`<button class="btn btn-danger btn-sm" onclick="delProd(${p.id})">🗑</button>`:''}
      </div></td>
    </tr>`;
  }).join('');
}

function openAddProd(){
  editProd=null;
  document.getElementById('prodModalTitle').textContent='➕ Add New Product';
  ['pName','pSKU','pBuy','pSell','pStock','pDesc'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('pMin').value='5';
  document.getElementById('pIcon').value='';
  document.getElementById('pUnit').value='Piece';
  fillCatSel('pCat','');
  openModal('prodModal');
}
function openEditProd(id){
  const p=DB.products.find(x=>x.id===id); if(!p)return;
  editProd=p;
  document.getElementById('prodModalTitle').textContent='✏️ Edit Product';
  document.getElementById('pName').value=p.name;
  document.getElementById('pSKU').value=p.sku||''
  document.getElementById('pBuy').value=p.buy||''
  document.getElementById('pSell').value=p.sell;
  document.getElementById('pStock').value=p.stock;
  document.getElementById('pMin').value=p.minStock;
  document.getElementById('pIcon').value=p.icon||'';
  document.getElementById('pDesc').value=p.desc||''
  document.getElementById('pUnit').value=p.unit||'Piece';
  fillCatSel('pCat',p.cat);
  openModal('prodModal');
}
function fillCatSel(selId,selected){
  document.getElementById(selId).innerHTML=DB.categories.map(c=>`<option value="${c}"${c===selected?' selected':''} >${c}</option>`).join('');
}
function saveProd(){
  const name=document.getElementById('pName').value.trim();
  const sell=parseFloat(document.getElementById('pSell').value);
  if(!name){toast('Product name is required','err');return;}
  if(!sell||sell<=0){toast('Sell price is required','err');return;}
  const d={
    name, sku:document.getElementById('pSKU').value.trim(),
    cat:document.getElementById('pCat').value,
    buy:parseFloat(document.getElementById('pBuy').value)||0,
    sell, stock:parseInt(document.getElementById('pStock').value)||0,
    minStock:parseInt(document.getElementById('pMin').value)||5,
    unit:document.getElementById('pUnit').value,
    icon:document.getElementById('pIcon').value.trim()||'',
    desc:document.getElementById('pDesc').value.trim()
  };
  if(editProd){
    Object.assign(editProd,d);
    logAct('product',`Product updated: ${d.name}`);
    toast(' Product updated!');
  } else {
    DB.products.push({id:DB.nextProdId++,...d});
    logAct('product',`Product added: ${d.name} (Rs ${d.sell.toLocaleString()})`);
    toast(' Product added!');
  }
  saveDB(); closeModal('prodModal'); renderInv(); renderDash(); initPOS();
}
function delProd(id){
  if(!confirm('Delete this product? This cannot be undone.')) return;
  const p=DB.products.find(x=>x.id===id);
  DB.products=DB.products.filter(p=>p.id!==id);
  logAct('product',`Product deleted: ${p?p.name:id}`);
  saveDB(); renderInv(); renderDash(); toast('🗑 Product deleted');
}
function openRestock(id){
  const p=DB.products.find(x=>x.id===id); if(!p)return;
  rstTarget=p;
  document.getElementById('rstName').textContent=p.icon+' '+p.name+' — '+p.cat;
  document.getElementById('rstCur').value=p.stock+' '+p.unit;
  document.getElementById('rstQty').value='';
  document.getElementById('rstNote').value='';
  openModal('restockModal');
}
function doRestock(){
  const qty=parseInt(document.getElementById('rstQty').value);
  if(!qty||qty<=0){toast('Enter valid quantity','err');return;}
  rstTarget.stock+=qty;
  logAct('restock',`Restock: ${rstTarget.name} +${qty} ${rstTarget.unit}`);
  saveDB(); closeModal('restockModal'); renderInv(); renderDash();
  toast(` Restocked ${qty} ${rstTarget.unit} of ${rstTarget.name}`);
}

// CSV Export Inventory
function exportInvCSV(){
  const rows=[['Name','SKU','Category','BuyPrice','SellPrice','Stock','MinStock','Unit','Icon','Description'],...DB.products.map(p=>[p.name,p.sku,p.cat,p.buy,p.sell,p.stock,p.minStock,p.unit,p.icon,p.desc||'']).map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`))];
  const csv=rows.map(r=>r.join(',')).join('\n');
  dlFile(csv,'inventory.csv','text/csv');
  toast(' Inventory exported!');
}

// CSV Template
function downloadCSVTemplate(){
  const csv=`Name,SKU,Category,BuyPrice,SellPrice,Stock,MinStock,Unit,Icon,Description
"200W Solar Panel","SP-200W","Solar Panels",8000,12000,10,2,"Piece","","Monocrystalline"
"1KW Inverter","INV-1K","Inverters",10000,14500,5,1,"Piece","","Pure Sine Wave"`;
  dlFile(csv,'inventory_template.csv','text/csv');
  toast(' Template downloaded!');
}

// CSV Import Inventory
function triggerImportCSV(){ document.getElementById('csvFileInput').click(); }
function importInvCSV(event){
  const file=event.target.files[0]; if(!file)return;
  const reader=new FileReader();
  reader.onload=function(e){
    const lines=e.target.result.split('\n').map(l=>l.trim()).filter(l=>l);
    if(lines.length<2){toast('CSV file is empty or invalid','err');return;}
    let added=0,updated=0,errors=[];
    // Skip header row
    for(let i=1;i<lines.length;i++){
      try{
        const cols=parseCSVLine(lines[i]);
        if(cols.length<6){errors.push(`Row ${i+1}: not enough columns`);continue;}
        const name=(cols[0]||''). trim();
        if(!name){errors.push(`Row ${i+1}: name empty`);continue;}
        const sku=(cols[1]||''). trim();
        const cat=(cols[2]||DB.categories[0]).trim();
        const buy=parseFloat(cols[3])||0;
        const sell=parseFloat(cols[4])||0;
        if(sell<=0){errors.push(`Row ${i+1}: invalid sell price`);continue;}
        const stock=parseInt(cols[5])||0;
        const minStock=parseInt(cols[6])||5;
        const unit=(cols[7]||'Piece').trim();
        const icon=(cols[8]||'').trim()||'';
        const desc=(cols[9]||''). trim();
        // Add missing category
        if(cat&&!DB.categories.includes(cat)) DB.categories.push(cat);
        // Check if SKU exists for update
        const existing=sku?DB.products.find(p=>p.sku===sku):null;
        if(existing){
          Object.assign(existing,{name,sku,cat,buy,sell,stock,minStock,unit,icon,desc});
          updated++;
        } else {
          DB.products.push({id:DB.nextProdId++,name,sku,cat,buy,sell,stock,minStock,unit,icon,desc});
          added++;
        }
      }catch(err){errors.push(`Row ${i+1}: ${err.message}`);}
    }
    saveDB(); renderInv(); renderDash(); initPOS();
    let msg=` Import done! Added: ${added}, Updated: ${updated}`;
    if(errors.length) msg+=` | ${errors.length} error(s)`;
    toast(msg,errors.length?'warn':'ok');
    if(errors.length) console.warn('CSV import errors:',errors);
  };
  reader.readAsText(file);
  event.target.value=''; // reset input
}
function parseCSVLine(line){
  const result=[]; let cur='', inQ=false;
  for(let i=0;i<line.length;i++){
    const ch=line[i];
    if(ch==='"' && inQ && line[i+1]==='"'){cur+='"';i++;} 
    else if(ch==='"'){inQ=!inQ;}
    else if(ch===','&&!inQ){result.push(cur.trim());cur='';}
    else cur+=ch;
  }
  result.push(cur.trim()); return result;
}

// ============================================================
// CUSTOMERS
// ============================================================
function renderCusts(){
  const q=document.getElementById('custQ').value.toLowerCase();
  let custs=DB.customers;
  if(q) custs=custs.filter(c=>c.name.toLowerCase().includes(q)||(c.phone||''). includes(q));
  const g=document.getElementById('custGrid');
  if(!custs.length){g.innerHTML='<div class="empty" style="grid-column:1/-1"><div class="ei">👥</div><p>No customers found</p></div>';return;}
  g.innerHTML=custs.map(c=>{
    const cs=DB.sales.filter(s=>s.customerId==c.id);
    const spent=cs.reduce((a,s)=>a+s.total,0);
    const init=c.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
    return `<div style="background:var(--card);border:2px solid var(--border);border-radius:13px;padding:15px;transition:.2s" onmouseover="this.style.borderColor='var(--g3)'" onmouseout="this.style.borderColor='var(--border)'">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">
        <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#388E3C,#1B5E20);display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:900;flex-shrink:0">${init}</div>
        <div><div style="font-size:14px;font-weight:900">${c.name}</div><div style="font-size:12px;color:var(--muted);font-weight:600">📞 ${c.phone||'—'}</div>${c.city?`<div style="font-size:11px;color:var(--muted);font-weight:600">📍 ${c.city}</div>`:''}</div>
      </div>
      ${c.notes?`<div style="font-size:12px;color:var(--text2);font-style:italic;padding:6px 10px;background:var(--bg);border-radius:7px;margin-bottom:8px">"${c.notes}"</div>`:''}
      <div style="display:flex;gap:9px;padding-top:9px;border-top:1.5px solid var(--border)">
        <div style="flex:1;text-align:center"><div style="font-size:14px;font-weight:900;color:var(--g3);font-family:JetBrains Mono,monospace">${cs.length}</div><div style="font-size:10px;color:var(--muted);font-weight:800;text-transform:uppercase">Sales</div></div>
        <div style="flex:1;text-align:center"><div style="font-size:13px;font-weight:900;color:var(--g3);font-family:JetBrains Mono,monospace">Rs ${spent.toLocaleString()}</div><div style="font-size:10px;color:var(--muted);font-weight:800;text-transform:uppercase">Spent</div></div>
      </div>
      <div style="display:flex;gap:6px;margin-top:10px">
        <button class="btn btn-success btn-sm" style="flex:1" onclick="viewCustHist(${c.id})">📋 History</button>
        <button class="btn btn-ghost btn-sm" onclick="openEditCust(${c.id})">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="delCust(${c.id})">🗑</button>
      </div>
    </div>`;
  }).join('');
}
function openAddCust(){editCust=null;document.getElementById('custModalTitle').textContent='👤 Add Customer';['cName','cPhone','cCity','cAddr','cNotes'].forEach(id=>document.getElementById(id).value='');openModal('custModal');}
function openEditCust(id){const c=DB.customers.find(x=>x.id===id);if(!c)return;editCust=c;document.getElementById('custModalTitle').textContent='✏️ Edit Customer';document.getElementById('cName').value=c.name;document.getElementById('cPhone').value=c.phone||'';document.getElementById('cCity').value=c.city||'';document.getElementById('cAddr').value=c.addr||'';document.getElementById('cNotes').value=c.notes||'';openModal('custModal');}
function saveCust(){
  const name=document.getElementById('cName').value.trim();
  if(!name){toast('Name required','err');return;}
  const d={name,phone:document.getElementById('cPhone').value.trim(),city:document.getElementById('cCity').value.trim(),addr:document.getElementById('cAddr').value.trim(),notes:document.getElementById('cNotes').value.trim()};
  if(editCust){Object.assign(editCust,d);toast(' Customer updated!');}
  else{DB.customers.push({id:DB.nextCustId++,...d});logAct('customer',`Customer added: ${d.name}`);toast(' Customer added!');}
  saveDB();closeModal('custModal');renderCusts();populateCustSel();
}
function delCust(id){if(!confirm('Delete this customer?'))return;const c=DB.customers.find(x=>x.id===id);DB.customers=DB.customers.filter(c=>c.id!==id);logAct('customer',`Customer deleted: ${c?c.name:id}`);saveDB();renderCusts();populateCustSel();toast('🗑 Customer deleted');}
function viewCustHist(id){
  const c=DB.customers.find(x=>x.id===id);const sales=DB.sales.filter(s=>s.customerId==id).reverse();const tot=sales.reduce((a,s)=>a+s.total,0);
  document.getElementById('custHistTitle').textContent='📋 '+c.name+' — History';
  document.getElementById('custHistContent').innerHTML=`<div style="display:flex;gap:11px;margin-bottom:13px"><div class="sc green" style="flex:1;padding:12px"><div class="sl">Purchases</div><div class="sv" style="font-size:20px">${sales.length}</div></div><div class="sc amber" style="flex:1;padding:12px"><div class="sl">Total Spent</div><div class="sv" style="font-size:20px">Rs ${tot.toLocaleString()}</div></div></div><div class="tw"><table><thead><tr><th>Invoice</th><th>Date</th><th>Total</th><th>GST</th><th>Payment</th></tr></thead><tbody>${sales.length?sales.map(s=>`<tr><td style="font-family:JetBrains Mono,monospace;color:var(--g3);font-weight:700">#${s.invoice}</td><td style="font-size:12px">${new Date(s.date).toLocaleString()}</td><td style="font-weight:800">Rs ${s.total.toLocaleString()}</td><td style="color:var(--amber);font-weight:700">${s.gstAmt>0?'Rs '+s.gstAmt.toLocaleString():'—'}</td><td>${s.payment}</td></tr>`).join(''):'<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:16px;font-weight:700">No purchases yet</td></tr>'}</tbody></table></div>`;
  openModal('custHistModal');
}
function exportCustCSV(){
  const rows=[['Name','Phone','City','Address','Notes','Total Sales','Total Spent'],...DB.customers.map(c=>{const cs=DB.sales.filter(s=>s.customerId==c.id);const sp=cs.reduce((a,s)=>a+s.total,0);return[c.name,c.phone||'',c.city||'',c.addr||'',c.notes||'',cs.length,sp];}).map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`))];
  dlFile(rows.map(r=>r.join(',')).join('\n'),'customers.csv','text/csv');
  toast('📥 Customers exported!');
}

// ============================================================
// SALES HISTORY
// ============================================================
function renderSales(){
  const df=document.getElementById('saleDateF').value;
  let sales=[...DB.sales].reverse();
  if(df) sales=sales.filter(s=>new Date(s.date).toDateString()===new Date(df).toDateString());
  const tb=document.getElementById('saleTbl');
  if(!sales.length){tb.innerHTML='<tr><td colspan="11" style="text-align:center;color:var(--muted);padding:20px;font-weight:700">No sales found</td></tr>';return;}
  tb.innerHTML=sales.map(s=>`<tr>
    <td style="font-family:JetBrains Mono,monospace;color:var(--g3);font-weight:700">#${s.invoice}</td>
    <td style="font-size:12px;font-weight:600">${new Date(s.date).toLocaleString()}</td>
    <td style="font-weight:700">${s.customer}</td>
    <td>${s.items.length}</td>
    <td><span class="badge bg-blue">${s.payment}</span></td>
    <td>Rs ${s.subtotal.toLocaleString()}</td>
    <td>${s.discount>0?'Rs '+s.discount.toLocaleString():'—'}</td>
    <td style="color:var(--amber);font-weight:700">${s.gstAmt>0?`Rs ${s.gstAmt.toLocaleString()} <span style="font-size:10px">(${s.gstRate}%)</span>`:'—'}</td>
    <td style="font-weight:900;color:var(--g3)">Rs ${s.total.toLocaleString()}</td>
    <td style="font-size:12px;color:var(--muted)">${s.cashier}</td>
    <td><button class="btn btn-ghost btn-sm" onclick="viewSaleDet(${s.invoice})">👁</button></td>
  </tr>`).join('');
}
function viewSaleDet(inv){
  const s=DB.sales.find(x=>x.invoice===inv); if(!s)return;
  document.getElementById('saleDetContent').innerHTML=buildReceipt(s);
  openModal('saleDetModal');
}
function printSaleDet(){const w=window.open('','_blank','width=400,height=640');w.document.write('<html><body style="margin:20px">'+document.getElementById('saleDetContent').innerHTML+'</body></html>');w.document.close();w.print();}
function exportSalesCSV(){
  const rows=[['Invoice','Date','Customer','Items','Subtotal','Discount','GST Rate','GST Amt','Total','Payment','Cashier'],...DB.sales.map(s=>[s.invoice,new Date(s.date).toLocaleString(),s.customer,s.items.length,s.subtotal,s.discount||0,s.gstRate||0,s.gstAmt||0,s.total,s.payment,s.cashier]).map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`))];
  dlFile(rows.map(r=>r.join(',')).join('\n'),'sales.csv','text/csv');
  toast('📥 Sales exported!');
}

// ============================================================
// REPORTS
// ============================================================
function getRepSales(){
  const p=document.getElementById('repPeriod').value; const now=new Date();
  return DB.sales.filter(s=>{const d=new Date(s.date);if(p==='today')return d.toDateString()===now.toDateString();if(p==='week'){const w=new Date(now);w.setDate(now.getDate()-7);return d>=w;}if(p==='month')return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();return true;});
}
function renderReports(){
  const sales=getRepSales();
  const rev=sales.reduce((a,s)=>a+s.total,0);
  const gstT=sales.reduce((a,s)=>a+(s.gstAmt||0),0);
  const disc=sales.reduce((a,s)=>a+(s.discount||0),0);
  const items=sales.reduce((a,s)=>a+s.items.reduce((b,i)=>b+i.qty,0),0);
  const p=document.getElementById('repPeriod').value; const now=new Date();
  const exps=(DB.expenses||[]).filter(e=>{const d=new Date(e.date);if(p==='today')return d.toDateString()===now.toDateString();if(p==='week'){const w=new Date(now);w.setDate(now.getDate()-7);return d>=w;}if(p==='month')return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();return true;});
  const expT=exps.reduce((a,e)=>a+e.amount,0);
  const cogs=sales.reduce((a,s)=>a+s.items.reduce((b,i)=>{const pr=DB.products.find(x=>x.id===i.id);return b+(pr?pr.buy*i.qty:0);},0),0);
  const profit=rev-cogs-expT;
  document.getElementById('repCards').innerHTML=`
    <div class="rc"><h4> Revenue</h4><div class="rbig" style="color:var(--g3)">Rs ${rev.toLocaleString()}</div><div class="rsub">${sales.length} transactions</div></div>
    <div class="rc"><h4> GST Collected</h4><div class="rbig" style="color:var(--amber)">Rs ${gstT.toLocaleString()}</div><div class="rsub">Tax to FBR</div></div>
    <div class="rc"><h4> Discounts</h4><div class="rbig" style="color:var(--blue)">Rs ${disc.toLocaleString()}</div><div class="rsub">Total given</div></div>
    <div class="rc"><h4>Items Sold</h4><div class="rbig" style="color:var(--g3)">${items}</div><div class="rsub">Units sold</div></div>
    <div class="rc"><h4> Expenses</h4><div class="rbig" style="color:var(--red)">Rs ${expT.toLocaleString()}</div><div class="rsub">${exps.length} entries</div></div>
    <div class="rc"><h4> Est. Profit</h4><div class="rbig" style="color:${profit>=0?'var(--g3)':'var(--red)'}">${profit>=0?'':'−'}Rs ${Math.abs(profit).toLocaleString()}</div><div class="rsub">Rev − COGS − Exp</div></div>
  `;
  const ps={};sales.forEach(s=>s.items.forEach(i=>{if(!ps[i.id])ps[i.id]={name:i.name,icon:i.icon||'',qty:0,rev:0};ps[i.id].qty+=i.qty;ps[i.id].rev+=i.price*i.qty;}));
  const top=Object.values(ps).sort((a,b)=>b.rev-a.rev).slice(0,7);
  const maxR=top[0]?top[0].rev:1;
  document.getElementById('topProdsWrap').innerHTML=top.length?top.map((p,i)=>`<div class="tpi"><div class="tpr">${i+1}</div><div style="flex:1"><div style="font-size:13px;font-weight:800">${p.icon} ${p.name}</div><div class="pb-wrap"><div class="pb" style="width:${(p.rev/maxR*100).toFixed(0)}%"></div></div></div><div style="text-align:right"><div style="font-family:JetBrains Mono,monospace;font-size:13px;font-weight:700;color:var(--g3)">Rs ${p.rev.toLocaleString()}</div><div style="font-size:11px;color:var(--muted);font-weight:600">${p.qty} units</div></div></div>`).join(''):'<div class="empty"><div class="ei"></div><p>No sales data</p></div>';
  const pb={};sales.forEach(s=>{if(!pb[s.payment])pb[s.payment]={c:0,t:0};pb[s.payment].c++;pb[s.payment].t+=s.total;});
  const maxP=Math.max(...Object.values(pb).map(v=>v.t),1);
  document.getElementById('payBreak').innerHTML=Object.entries(pb).length?Object.entries(pb).map(([k,v])=>`<div class="tpi"><div style="flex:1"><div style="font-size:13px;font-weight:800">💳 ${k}</div><div class="pb-wrap"><div class="pb" style="width:${(v.t/maxP*100).toFixed(0)}%;background:linear-gradient(90deg,#1565C0,#42A5F5)"></div></div></div><div style="text-align:right"><div style="font-family:JetBrains Mono,monospace;font-size:13px;font-weight:700;color:var(--blue)">Rs ${v.t.toLocaleString()}</div><div style="font-size:11px;color:var(--muted);font-weight:600">${v.c} sales</div></div></div>`).join(''):'<div class="empty"><div class="ei">💳</div><p>No data</p></div>';
}
function exportRepCSV(){
  const sales=getRepSales();
  const rows=[['Invoice','Date','Customer','Subtotal','Discount','GST','Total','Payment','Cashier'],...sales.map(s=>[s.invoice,new Date(s.date).toLocaleString(),s.customer,s.subtotal,s.discount||0,s.gstAmt||0,s.total,s.payment,s.cashier]).map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`))];
  dlFile(rows.map(r=>r.join(',')).join('\n'),'report.csv','text/csv');
  toast('📥 Report exported!');
}

// ============================================================
// EXPENSES
// ============================================================
function renderExp(){
  if(!DB.expenses)DB.expenses=[];
  const tot=DB.expenses.reduce((a,e)=>a+e.amount,0);
  const td=new Date().toDateString();
  const todT=DB.expenses.filter(e=>new Date(e.date).toDateString()===td).reduce((a,e)=>a+e.amount,0);
  const cb={};DB.expenses.forEach(e=>{if(!cb[e.cat])cb[e.cat]=0;cb[e.cat]+=e.amount;});
  const topC=Object.entries(cb).sort((a,b)=>b[1]-a[1])[0];
  document.getElementById('expStats').innerHTML=`
    <div class="sc red"><div class="si">💸</div><div class="sl">Total Expenses</div><div class="sv" style="font-size:20px">Rs ${tot.toLocaleString()}</div></div>
    <div class="sc amber"><div class="si">📅</div><div class="sl">Today</div><div class="sv" style="font-size:20px">Rs ${todT.toLocaleString()}</div></div>
    <div class="sc blue"><div class="si">🏷️</div><div class="sl">Top Category</div><div class="sv" style="font-size:16px">${topC?topC[0]:'—'}</div></div>
  `;
  const tb=document.getElementById('expTbl');
  if(!DB.expenses.length){tb.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:20px;font-weight:700">No expenses recorded</td></tr>';return;}
  tb.innerHTML=[...DB.expenses].reverse().map((e,ri)=>{const i=DB.expenses.length-1-ri;return `<tr>
    <td style="font-size:12px;font-weight:600">${new Date(e.date).toLocaleDateString()}</td>
    <td><span class="badge bg-blue">${e.cat}</span></td>
    <td style="font-weight:700">${e.desc}</td>
    <td style="font-weight:900;color:var(--red);font-family:JetBrains Mono,monospace">Rs ${e.amount.toLocaleString()}</td>
    <td>${e.paidBy}</td>
    <td style="font-size:12px;color:var(--muted)">${e.note||'—'}</td>
    <td><div style="display:flex;gap:4px"><button class="btn btn-blue btn-sm" onclick="openEditExp(${i})">✏️</button><button class="btn btn-danger btn-sm" onclick="delExp(${i})">🗑</button></div></td>
  </tr>`}).join('');
}
function openAddExpense(){editExp=null;document.getElementById('expModalTitle').textContent='💸 Add Expense';['expAmt','expDesc','expNote'].forEach(id=>document.getElementById(id).value='');document.getElementById('expDate').value=new Date().toISOString().slice(0,10);openModal('expModal');}
function openEditExp(i){const e=DB.expenses[i];editExp=i;document.getElementById('expModalTitle').textContent='✏️ Edit Expense';document.getElementById('expCat').value=e.cat;document.getElementById('expAmt').value=e.amount;document.getElementById('expDesc').value=e.desc;document.getElementById('expPaid').value=e.paidBy;document.getElementById('expDate').value=e.date;document.getElementById('expNote').value=e.note||'';openModal('expModal');}
function saveExp(){
  const amt=parseFloat(document.getElementById('expAmt').value);
  const desc=document.getElementById('expDesc').value.trim();
  if(!amt||amt<=0){toast('Valid amount required','err');return;}
  if(!desc){toast('Description required','err');return;}
  if(!DB.expenses)DB.expenses=[];
  const d={cat:document.getElementById('expCat').value,amount:amt,desc,paidBy:document.getElementById('expPaid').value,date:document.getElementById('expDate').value||new Date().toISOString().slice(0,10),note:document.getElementById('expNote').value.trim()};
  if(editExp!==null){DB.expenses[editExp]=d;toast(' Expense updated!');}
  else{DB.expenses.push(d);logAct('expense',`Expense: ${d.cat} Rs ${d.amount.toLocaleString()}`);toast(' Expense added!');}
  saveDB();closeModal('expModal');renderExp();
}
function delExp(i){if(!confirm('Delete expense?'))return;DB.expenses.splice(i,1);saveDB();renderExp();toast('🗑 Expense deleted');}
function exportExpCSV(){
  const rows=[['Date','Category','Description','Amount','PaidBy','Note'],...(DB.expenses||[]).map(e=>[e.date,e.cat,e.desc,e.amount,e.paidBy,e.note||'']).map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`))];
  dlFile(rows.map(r=>r.join(',')).join('\n'),'expenses.csv','text/csv');
  toast('📥 Expenses exported!');
}

// ============================================================
// RETURNS
// ============================================================
function renderReturns(){
  if(!DB.returns)DB.returns=[];
  const tb=document.getElementById('retTbl');
  if(!DB.returns.length){tb.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:20px;font-weight:700">No returns processed</td></tr>';return;}
  tb.innerHTML=[...DB.returns].reverse().map(r=>`<tr>
    <td style="font-family:JetBrains Mono,monospace;color:var(--red);font-weight:700">R#${r.retNo}</td>
    <td style="font-family:JetBrains Mono,monospace;color:var(--g3);font-weight:700">#${r.origInv}</td>
    <td style="font-size:12px">${new Date(r.date).toLocaleString()}</td>
    <td style="font-weight:700">${r.customer}</td>
    <td>${r.items.length}</td>
    <td style="font-weight:900;color:var(--red);font-family:JetBrains Mono,monospace">Rs ${r.refund.toLocaleString()}</td>
    <td><span class="badge bg-purple">${r.reason}</span></td>
  </tr>`).join('');
}
function findReturnSale(){
  const inv=parseInt(document.getElementById('retInvInp').value);
  const sale=DB.sales.find(s=>s.invoice===inv);
  const el=document.getElementById('retDetails');
  if(!sale){el.innerHTML='<div style="color:var(--red);font-weight:800;padding:10px">❌ Invoice not found</div>';retSale=null;return;}
  retSale=sale;
  el.innerHTML=`<div style="background:var(--bg);border:1.5px solid var(--border);border-radius:10px;padding:14px">
    <div style="display:flex;justify-content:space-between;margin-bottom:10px">
      <span style="font-weight:900;font-size:15px">Invoice #${sale.invoice}</span>
      <span style="font-weight:900;color:var(--g3);font-family:JetBrains Mono,monospace">Rs ${sale.total.toLocaleString()}</span>
    </div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:4px">Customer: <b style="color:var(--text)">${sale.customer}</b> &nbsp;|&nbsp; ${new Date(sale.date).toLocaleString()}</div>
    <div style="font-size:12px;color:var(--muted);font-weight:800;margin:10px 0 7px">SELECT ITEMS TO RETURN:</div>
    ${sale.items.map((item,i)=>`<div class="ret-item"><input type="checkbox" id="ri${i}" onchange="calcRetAmt()" style="width:16px;height:16px;accent-color:var(--g3);cursor:pointer"><label for="ri${i}" style="flex:1;cursor:pointer;font-weight:800;font-size:13px">${item.icon||''} ${item.name} ×${item.qty}</label><span style="font-family:JetBrains Mono,monospace;font-weight:700;color:var(--g3)">Rs ${(item.price*item.qty).toLocaleString()}</span></div>`).join('')}
    <div style="margin-top:11px;padding-top:11px;border-top:1.5px dashed var(--border2);display:flex;justify-content:space-between;align-items:center">
      <span style="font-weight:800">Refund:</span><span id="retAmt" style="font-size:18px;font-weight:900;color:var(--red);font-family:JetBrains Mono,monospace">Rs 0</span>
    </div>
    <button class="btn btn-danger" style="width:100%;margin-top:11px" onclick="openRetModal()">↩️ Process Return</button>
  </div>`;
}
function calcRetAmt(){
  if(!retSale)return;
  let t=0;retSale.items.forEach((item,i)=>{const cb=document.getElementById('ri'+i);if(cb&&cb.checked)t+=item.price*item.qty;});
  const el=document.getElementById('retAmt');if(el)el.textContent='Rs '+t.toLocaleString();
}
function openRetModal(){
  if(!retSale){toast('Find a sale first','err');return;}
  const sel=retSale.items.filter((_,i)=>{const cb=document.getElementById('ri'+i);return cb&&cb.checked;});
  if(!sel.length){toast('Select at least one item','err');return;}
  const refund=sel.reduce((a,i)=>a+i.price*i.qty,0);
  retSelectedItems=sel;
  document.getElementById('retSum').textContent=`Invoice #${retSale.invoice} — ${retSale.customer}`;
  document.getElementById('retItemList').innerHTML=sel.map(i=>`<div class="ret-item"><span>${i.icon||''} ${i.name} ×${i.qty}</span><span style="font-family:JetBrains Mono,monospace;font-weight:700;color:var(--red)">Rs ${(i.price*i.qty).toLocaleString()}</span></div>`).join('');
  document.getElementById('retRefAmt').textContent='Rs '+refund.toLocaleString();
  openModal('retModal');
}
function confirmReturn(){
  if(!retSale||!retSelectedItems.length)return;
  if(!DB.returns)DB.returns=[];if(!DB.nextRetNo)DB.nextRetNo=1;
  const refund=retSelectedItems.reduce((a,i)=>a+i.price*i.qty,0);
  const ret={retNo:DB.nextRetNo++,origInv:retSale.invoice,date:new Date().toISOString(),customer:retSale.customer,items:retSelectedItems,refund,reason:document.getElementById('retReason').value,note:document.getElementById('retNote').value,by:currentUser.name};
  retSelectedItems.forEach(ri=>{const p=DB.products.find(x=>x.id===ri.id);if(p)p.stock+=ri.qty;});
  DB.returns.push(ret);
  logAct('sale',`Return R#${ret.retNo} for Invoice #${ret.origInv} — Refund Rs ${refund.toLocaleString()}`);
  saveDB();closeModal('retModal');
  document.getElementById('retInvInp').value='';
  document.getElementById('retDetails').innerHTML='';
  retSale=null;retSelectedItems=[];
  renderReturns();renderDash();renderInv();
  toast(` Return processed! Refund Rs ${refund.toLocaleString()}`);
}

// ============================================================
// SETTINGS
// ============================================================
function renderSettings(){
  document.getElementById('sName').value=DB.settings.shopName||'';document.getElementById('sAddr').value=DB.settings.address||'';document.getElementById('sPhone').value=DB.settings.phone||'';document.getElementById('gstRateInp').value=DB.settings.gstRate||17;
  updateGSTUI(); renderCatList();
}
function saveSettings(){
  DB.settings.shopName=document.getElementById('sName').value;
  DB.settings.address=document.getElementById('sAddr').value;
  DB.settings.phone=document.getElementById('sPhone').value;
  saveDB();toast(' Settings saved!');
}
function changePwd(){
  const c=document.getElementById('curP').value,n=document.getElementById('newP').value,cf=document.getElementById('conP').value;
  if(c!==DB.users.admin){toast('Wrong current password','err');return;}
  if(!n){toast('New password empty','err');return;}
  if(n!==cf){toast('Passwords do not match','err');return;}
  DB.users.admin=n;saveDB();['curP','newP','conP'].forEach(id=>document.getElementById(id).value='');
  toast(' Password updated!');
}
function addCat(){const v=document.getElementById('newCatInp').value.trim();if(!v){toast('Enter name','err');return;}if(DB.categories.includes(v)){toast('Already exists','err');return;}DB.categories.push(v);saveDB();renderCatList();initPOS();document.getElementById('newCatInp').value='';toast(' Category added!');}
function renderCatList(){document.getElementById('catListEl').innerHTML=DB.categories.map((c,i)=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 11px;background:var(--bg);border-radius:8px;margin-bottom:5px;border:1.5px solid var(--border)"><span style="font-size:13px;font-weight:700">${c}</span><button class="btn btn-danger btn-sm" onclick="delCat(${i})">✕</button></div>`).join('');}
function delCat(i){if(!confirm('Delete category?'))return;DB.categories.splice(i,1);saveDB();renderCatList();initPOS();}
function clearSales(){if(!confirm('Delete ALL sales history?'))return;DB.sales=[];saveDB();renderSales();renderDash();toast('🗑 Sales cleared');}
function clearInv(){if(!confirm('Delete ALL inventory?'))return;DB.products=[];DB.nextProdId=1;saveDB();renderInv();renderDash();initPOS();toast('🗑 Inventory cleared');}
function clearAll(){if(!confirm('RESET EVERYTHING? This deletes all data!'))return;localStorage.removeItem(DB_KEY);location.reload();}

// ============================================================
// MODALS & TOAST & UTILS
// ============================================================
function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}
document.querySelectorAll('.mo').forEach(el=>el.addEventListener('click',e=>{if(e.target===el)el.classList.remove('open');}));
let toastT;
function toast(msg,type='ok'){const t=document.getElementById('toast');t.textContent=msg;t.className=type==='err'?'err':type==='warn'?'warn':'';t.style.display='block';clearTimeout(toastT);toastT=setTimeout(()=>t.style.display='none',3500);}
function dlFile(content,name,type){const a=document.createElement('a');a.href='data:'+type+';charset=utf-8,'+encodeURIComponent(content);a.download=name;a.click();}

// ============================================================
// CSV PARSE FIX (standalone clean version)
// ============================================================
function parseCSVLine(line){
  const r=[];let cur='',inQ=false;
  for(let i=0;i<line.length;i++){
    const c=line[i];
    if(c==='"'){
      if(inQ&&line[i+1]==='"'){cur+='"';i++;}
      else inQ=!inQ;
    } else if(c===','&&!inQ){r.push(cur.trim());cur='';}
    else cur+=c;
  }
  r.push(cur.trim());return r;
}
