var VER='v6',items=[],lim=600,tela=null,cur=null,selMode=false,SDK=0,lp=false,vlist=[],vi=0,tx=0;
var Galeria=(window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.Galeria)||null;
var PS={},VISTOS={};
try{PS=JSON.parse(localStorage.getItem('praia')||'{}');VISTOS=JSON.parse(localStorage.getItem('vistos')||'{}')}catch(e){}
function salvar(){try{localStorage.setItem('praia',JSON.stringify(PS));localStorage.setItem('vistos',JSON.stringify(VISTOS))}catch(e){}}
window.onerror=function(m){var e=document.querySelector('#m');if(e)e.textContent='Erro no app: '+m};
function $(s){return document.querySelector(s)}
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function setm(t){$('#m').textContent=t}
function cand(i){
  var a=[];
  if(i.u)a.push(Capacitor.convertFileSrc(i.u));
  a.push(Capacitor.convertFileSrc(encodeURI(i.p).replace(/#/g,'%23').replace(/\?/g,'%3F')));
  a.push(Capacitor.convertFileSrc(i.p));
  return a;
}
function load(i,im,done){
  var c=cand(i),k=0;
  im.loading='lazy';im.alt='';
  im.onerror=function(){k++;if(k<c.length){im.src=c[k]}else{i.bad=true;im.onerror=null;if(done)done()}};
  im.src=c[0];
}
function capa(list,im,from,n){
  while(from<list.length&&list[from].bad)from++;
  if(from>=list.length||n>6){im.style.display='none';return}
  load(list[from],im,function(){capa(list,im,from+1,n+1)});
}
function ehPrint(w,h){
  if(!tela||!w||!h)return false;
  var a=Math.max(w,h),b=Math.min(w,h),A=Math.max(tela.w,tela.h),B=Math.min(tela.w,tela.h);
  if(a===A&&b===B)return true;
  return Math.abs(a/b-A/B)<0.012&&a<=A*1.02&&a>=A*0.5;
}
var CONV=/whatsapp|telegram|messenger|signal|discord|mensagens|messages|sms|chat|conversa/i;
function album(x){
  var p=x.p,f=p.split('/').pop(),parts=p.split('/'),d=parts[parts.length-2]||'Outros';
  if(PS[p])return 'Praia';
  if(/^(sent|private)$/i.test(d))d=(parts[parts.length-3]||'Outros')+' · enviadas';
  if(/screenshot|captura/i.test(f)||/screenshots/i.test(p)){
    var m=f.match(/screenshot[_ -]?\d{8}[-_ ]?\d{4,6}[_ -](.+)\.\w+$/i);
    var app=m?m[1].replace(/[_-]+/g,' ').trim():'';
    if(CONV.test(app))return 'Prints · Conversas';
    return app?'Prints · '+app:'Prints';
  }
  if(ehPrint(x.w,x.h))return 'Prints recebidos';
  return d;
}
function groups(){var g={};items.forEach(function(i){if(i.bad)return;(g[i.a]=g[i.a]||[]).push(i)});return g}
function home(){
  cur=null;selMode=false;
  var g=groups(),ns=Object.keys(g).sort(function(a,b){
    if(a==='Prints · Conversas')return -1;if(b==='Prints · Conversas')return 1;
    return g[b].length-g[a].length});
  var total=0;ns.forEach(function(n){total+=g[n].length});
  var hd=$('#hd');hd.innerHTML='';
  hd.appendChild(el('h1',0,'Galeria'));
  hd.appendChild(el('p','sub',total?total+' fotos em '+ns.length+' álbuns':'Separe suas fotos em álbuns automaticamente'));
  var row=el('div','row');
  var b1=el('button','pri',total?'Atualizar':'Ler minha galeria');b1.onclick=function(){ler()};row.appendChild(b1);
  if(total){var b2=el('button','sec','Detectar praia');b2.onclick=praia;row.appendChild(b2)}
  hd.appendChild(row);
  var app=$('#app');app.innerHTML='';
  var secs=[{t:'Prints',f:function(n){return n.indexOf('Prints')===0}},{t:'Detectados',f:function(n){return n==='Praia'}},{t:'Pastas do celular',f:function(){return true}}];
  var used={};
  secs.forEach(function(s){
    var list=ns.filter(function(n){return !used[n]&&s.f(n)});
    if(!list.length)return;
    list.forEach(function(n){used[n]=1});
    app.appendChild(el('div','sh',s.t));
    var grid=el('div','albums');
    list.forEach(function(n){
      var c=el('button','card'),im=el('img'),t=el('div','t');
      capa(g[n],im,0,0);
      t.appendChild(el('b',0,n));t.appendChild(el('span',0,g[n].length+' fotos'));
      c.appendChild(im);c.appendChild(t);
      c.onclick=function(){lim=600;abrir(n)};grid.appendChild(c);
    });
    app.appendChild(grid);
  });
}
function nsel(list){var c=0;list.forEach(function(i){if(i.s)c++});return c}
function pinta(i){if(i.el)i.el.classList.toggle('on',!!i.s)}
function barra(n,list){
  var hd=$('#hd');hd.innerHTML='';
  var bar=el('div','bar');
  if(!selMode){
    var bk=el('button','back','‹ Voltar');bk.onclick=home;
    var bs=el('button','back','Selecionar');bs.onclick=function(){selMode=true;barra(n,list)};
    bar.appendChild(bk);bar.appendChild(el('h2',0,n+' ('+list.length+')'));bar.appendChild(bs);
  }else{
    var c=nsel(list);
    var bc=el('button','back','Cancelar');
    bc.onclick=function(){list.forEach(function(i){i.s=false;pinta(i)});selMode=false;barra(n,list)};
    var bt=el('button','back','Tudo');
    bt.onclick=function(){list.forEach(function(i){i.s=true;pinta(i)});barra(n,list)};
    var bd=el('button','back dang','Apagar');bd.disabled=!c;
    bd.onclick=function(){apagar(list.filter(function(i){return i.s}))};
    bar.appendChild(bc);bar.appendChild(el('h2',0,c+' selecionadas'));bar.appendChild(bt);bar.appendChild(bd);
  }
  hd.appendChild(bar);
}
function abrir(n,keep){
  cur=n;
  var list=groups()[n]||[];
  if(!keep){selMode=false;list.forEach(function(i){i.s=false})}
  barra(n,list);
  var app=$('#app');app.innerHTML='';
  var grid=el('div','grid');
  list.slice(0,lim).forEach(function(i,idx){
    var im=el('img');i.el=im;pinta(i);load(i,im,function(){im.style.display='none'});
    var t;
    im.ontouchstart=function(){lp=false;t=setTimeout(function(){lp=true;selMode=true;i.s=true;pinta(i);barra(n,list)},450)};
    im.ontouchend=im.ontouchmove=im.ontouchcancel=function(){clearTimeout(t)};
    im.onclick=function(){
      if(lp){lp=false;return}
      if(selMode){i.s=!i.s;pinta(i);barra(n,list)}
      else mostrar(list,idx);
    };
    grid.appendChild(im);
  });
  app.appendChild(grid);
  if(list.length>lim){var mb=el('button','mais','Mostrar mais');mb.onclick=function(){lim+=600;abrir(n,true)};app.appendChild(mb)}
  window.scrollTo(0,0);
}
function mostrar(list,idx){vlist=list;vi=idx;showV();$('#vw').style.display='flex'}
function showV(){
  var i=vlist[vi],im=$('#vim'),c=cand(i),k=0;
  im.onerror=function(){k++;if(k<c.length)im.src=c[k]};
  im.src=c[0];
  $('#vc').textContent=(vi+1)+' / '+vlist.length;
  if(vlist[vi+1])new Image().src=cand(vlist[vi+1])[0];
}
function nav(d){var k=vi+d;if(k<0||k>=vlist.length)return;vi=k;showV()}
$('#vw').ontouchstart=function(e){tx=e.touches[0].clientX};
$('#vw').ontouchend=function(e){var dx=e.changedTouches[0].clientX-tx;if(Math.abs(dx)>50)nav(dx<0?1:-1)};
$('#vx').onclick=function(){$('#vw').style.display='none'};
$('#vd').onclick=async function(){var ok=await apagar([vlist[vi]]);if(ok)$('#vw').style.display='none'};
async function apagar(arr){
  if(!arr.length)return false;
  if(!Galeria){setm('Módulo da galeria indisponível.');return false}
  try{
    var a=await Galeria.acessoTotal();
    if(!a.ativo){
      if(confirm('Para apagar fotos o Android exige a permissão "Acesso a todos os arquivos". Vou abrir a tela para você ativar. Depois volte ao app e toque em Apagar de novo.'))await Galeria.pedirAcessoTotal();
      return false;
    }
  }catch(e){setm('Erro: '+(e.message||e));return false}
  var msg=SDK>=30?'Mover '+arr.length+' foto(s) para a lixeira do Android?':'APAGAR '+arr.length+' foto(s) para sempre? Não dá para desfazer.';
  if(!confirm(msg))return false;
  setm('Apagando…');
  var feito=false;
  try{
    var r=await Galeria.apagar({uris:arr.map(function(i){return i.u}),permanente:false});
    setm(r.ok+' foto(s) apagada(s)'+(r.falha?' · '+r.falha+' não puderam ser apagadas':''));
    feito=r.ok>0;
  }catch(e){setm('Não foi possível apagar: '+(e.message||e))}
  var voltar=cur;
  await ler(voltar,true);
  return feito;
}
async function diag(){
  if(!Galeria){$('#dx').textContent=VER+' · modulo Galeria nao encontrado no app';return}
  try{var r=await Galeria.estado();SDK=r.sdk;$('#dx').textContent=VER+' · Android API '+r.sdk+' · permissão: '+r.permissao}
  catch(e){$('#dx').textContent=VER+' · diagnóstico indisponível: '+(e.message||e)}
}
async function ler(voltar,quieto){
  if(!Galeria){setm('O módulo da galeria não foi carregado no app.');return}
  if(!quieto)setm('Lendo a galeria…');
  try{
    var r=await Galeria.listar();
    tela={w:r.telaW,h:r.telaH};
    items=r.fotos.map(function(x){var o={p:x.path,u:x.uri,w:x.w,h:x.h};o.a=album(o);return o});
    if(!quieto)setm(items.length?'':'Nenhuma foto encontrada.');
    if(voltar&&groups()[voltar])abrir(voltar);else home();
  }catch(e){setm('Não foi possível ler: '+(e.message||e))}
  diag();
}
function isBeach(img){
  var w=img.naturalWidth,h=img.naturalHeight;
  if(w&&h&&Math.max(w,h)/Math.min(w,h)>1.9)return false;
  var c=document.createElement('canvas');c.width=c.height=24;
  var x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0,24,24);
  var d=x.getImageData(0,0,24,24).data,sky=0,sand=0,sea=0,n=0;
  for(var y=0;y<24;y++)for(var i=0;i<24;i++){
    var k=(y*24+i)*4,r=d[k],g=d[k+1],b=d[k+2];
    if(y<10){n++;if(b>r+20)sky++}
    else if(y>=14){if(r>150&&g>120&&r>b+30&&g>b+10)sand++;if(b>r+20)sea++}
  }
  return sky/n>0.4&&(sand/240>0.22||sea/240>0.35);
}
async function abrirImg(i){
  var c=cand(i);
  for(var k=0;k<c.length;k++){
    try{var im=new Image();im.src=c[k];await im.decode();return im}catch(e){}
  }
  return null;
}
async function praia(){
  var list=items.filter(function(i){return !i.bad&&i.a.indexOf('Prints')!==0&&i.a!=='Praia'&&!VISTOS[i.p]});
  if(!list.length){setm('Nada novo para analisar.');return}
  var pb=$('#pb');pb.style.display='block';
  for(var k=0;k<list.length;k++){
    setm('Procurando praia… '+(k+1)+' de '+list.length);
    pb.firstChild.style.width=Math.round((k+1)*100/list.length)+'%';
    var im=await abrirImg(list[k]);
    if(!im)list[k].bad=true;
    else{VISTOS[list[k].p]=1;if(isBeach(im)){PS[list[k].p]=1;list[k].a='Praia'}}
    if(k%50===0){salvar();await new Promise(function(r){setTimeout(r)})}
  }
  salvar();pb.style.display='none';setm('');home();
}
home();diag();
