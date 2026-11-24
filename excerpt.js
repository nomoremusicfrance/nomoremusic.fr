/* Choix de l'extrait « Unreleased » (30 secondes) — utilisé par le dashboard.
   Le morceau est lu et analysé DANS LE NAVIGATEUR : seules les 30 secondes choisies sont envoyées au site.
   Le morceau complet n'est jamais publié.
   - MP3 : on découpe directement les trames du fichier (aucune perte de qualité, fichier léger) ;
   - autre format (WAV, M4A, FLAC…) : l'extrait est converti en WAV, avec un léger fondu au début et à la fin. */
(function(){
  var LEN = 30;                       /* durée de l'extrait en secondes */
  var MAX_SRC = 200 * 1024 * 1024;    /* taille maximale du fichier d'origine */
  var PRE = 2;                        /* trames d'amorce avant le début (le décodeur MP3 en a besoin) */

  /* ---------------- MP3 : lecture des trames et découpe ---------------- */
  var BR1 = [0,32,40,48,56,64,80,96,112,128,160,192,224,256,320,0];
  var BR2 = [0,8,16,24,32,40,48,56,64,80,96,112,128,144,160,0];
  var SR  = { 3:[44100,48000,32000], 2:[22050,24000,16000], 0:[11025,12000,8000] };

  function id3size(b){
    if(b.length > 10 && b[0]===0x49 && b[1]===0x44 && b[2]===0x33)
      return 10 + (((b[6]&127)<<21) | ((b[7]&127)<<14) | ((b[8]&127)<<7) | (b[9]&127));
    return 0;
  }
  function header(b, i){
    if(i+4 > b.length || b[i] !== 0xFF || (b[i+1] & 0xE0) !== 0xE0) return null;
    var ver=(b[i+1]>>3)&3, layer=(b[i+1]>>1)&3;
    if(ver===1 || layer!==1) return null;                 /* MPEG réservé / pas Layer III */
    var br=(b[i+2]>>4)&15, sr=(b[i+2]>>2)&3, pad=(b[i+2]>>1)&1;
    if(br===0 || br===15 || sr===3) return null;
    var m1 = ver===3, bitrate=(m1?BR1:BR2)[br]*1000, rate=SR[ver][sr];
    return { len: Math.floor((m1?144:72)*bitrate/rate)+pad, rate: rate, spf: m1?1152:576 };
  }
  function isInfo(b, i, len){
    var end=Math.min(b.length, i+Math.min(len,60));
    for(var k=i+4;k<end-4;k++){
      if((b[k]===0x58&&b[k+1]===0x69&&b[k+2]===0x6E&&b[k+3]===0x67) ||
         (b[k]===0x49&&b[k+1]===0x6E&&b[k+2]===0x66&&b[k+3]===0x6F)) return true;   /* « Xing » / « Info » */
    }
    return false;
  }
  /* liste des trames : [{o: position, len}], et fréquence d'échantillonnage */
  function mp3Frames(b){
    var i=id3size(b), out=[], rate=0, spf=0, guard=0;
    while(i < b.length-4 && guard++ < 5e6){
      var h=header(b,i);
      if(h && (i+h.len===b.length || i+h.len>b.length-4 || header(b,i+h.len))){
        if(!rate){ rate=h.rate; spf=h.spf; }
        if(h.rate===rate && !(out.length===0 && isInfo(b,i,h.len))) out.push({o:i, len:h.len});
        i+=h.len;
      } else i++;                                           /* resynchronisation */
    }
    return out.length>20 ? {frames:out, rate:rate, spf:spf} : null;
  }
  function cutMp3(bytes, start){
    var m=mp3Frames(bytes); if(!m) return null;
    var per=m.spf/m.rate, total=m.frames.length*per;
    var f0=Math.max(0, Math.floor(start/per)-PRE);
    var f1=Math.min(m.frames.length, f0+Math.ceil(LEN/per)+PRE);
    var a=m.frames[f0].o, last=m.frames[f1-1], z=last.o+last.len;
    return { bytes: bytes.subarray(a, z), seconds: (f1-f0-PRE)*per, total: total };
  }

  /* ---------------- audio : décodage, crêtes, WAV ---------------- */
  function ctxNew(){ var AC=window.AudioContext||window.webkitAudioContext; if(!AC) throw new Error('audio'); return new AC(); }
  function decode(buf){
    return new Promise(function(res, rej){
      var c=ctxNew(), done=false;
      function fin(ab){ try{ c.close(); }catch(e){} res(ab); }
      var p=c.decodeAudioData(buf.slice(0), function(ab){ if(!done){ done=true; fin(ab); } }, function(e){ if(!done){ done=true; try{c.close();}catch(x){} rej(e||new Error('decode')); } });
      if(p && p.catch) p.catch(function(){});
    });
  }
  function rms(ab, n){
    var ch=ab.getChannelData(0), step=Math.max(1,Math.floor(ch.length/n)), w=[], max=0;
    for(var i=0;i<n;i++){
      var s=0, a=i*step, b=Math.min(ch.length,a+step);
      for(var j=a;j<b;j++) s+=ch[j]*ch[j];
      var v=Math.sqrt(s/Math.max(1,b-a)); w.push(v); if(v>max) max=v;
    }
    return w.map(function(v){ return Math.round((max?v/max:0)*1000)/1000; });
  }
  function peaks(ab, n){
    var out=new Array(n).fill(0), chs=Math.min(2,ab.numberOfChannels), len=ab.length, step=len/n, max=0;
    for(var c=0;c<chs;c++){
      var d=ab.getChannelData(c);
      for(var i=0;i<n;i++){
        var a=Math.floor(i*step), b=Math.min(len,Math.floor((i+1)*step)), m=0, k=Math.max(1,Math.floor((b-a)/200));
        for(var j=a;j<b;j+=k){ var v=d[j]<0?-d[j]:d[j]; if(v>m) m=v; }
        if(m>out[i]) out[i]=m;
      }
    }
    out.forEach(function(v){ if(v>max) max=v; });
    return out.map(function(v){ return max? v/max : 0; });
  }
  function wav(ab, start){
    var rate=ab.sampleRate, ch=Math.min(2,ab.numberOfChannels), a=Math.floor(start*rate),
        n=Math.min(Math.floor(LEN*rate), ab.length-a), bytes=44+n*ch*2, out=new DataView(new ArrayBuffer(bytes));
    function s(o,t){ for(var i=0;i<t.length;i++) out.setUint8(o+i,t.charCodeAt(i)); }
    s(0,'RIFF'); out.setUint32(4,bytes-8,true); s(8,'WAVE'); s(12,'fmt '); out.setUint32(16,16,true);
    out.setUint16(20,1,true); out.setUint16(22,ch,true); out.setUint32(24,rate,true); out.setUint32(28,rate*ch*2,true);
    out.setUint16(32,ch*2,true); out.setUint16(34,16,true); s(36,'data'); out.setUint32(40,n*ch*2,true);
    var fi=Math.floor(.25*rate), fo=Math.floor(.7*rate), data=[];
    for(var c=0;c<ch;c++) data.push(ab.getChannelData(c));
    for(var i=0;i<n;i++){
      var g=1; if(i<fi) g=i/fi; else if(i>n-fo) g=(n-i)/fo;              /* léger fondu : pas de claquement */
      for(c=0;c<ch;c++){
        var v=Math.max(-1,Math.min(1,data[c][a+i]*g));
        out.setInt16(44+(i*ch+c)*2, v<0 ? v*0x8000 : v*0x7FFF, true);
      }
    }
    return new Uint8Array(out.buffer);
  }
  function baseName(name){ return String(name||'extrait').replace(/\.[^.]+$/,''); }
  function isMp3(file, bytes){
    if(/\.mp3$/i.test(file.name||'') || /mpeg|mp3/i.test(file.type||'')) return true;
    return !!(bytes.length>3 && ((bytes[0]===0x49&&bytes[1]===0x44&&bytes[2]===0x33) || (bytes[0]===0xFF&&(bytes[1]&0xE0)===0xE0)));
  }

  /* extrait de LEN secondes à partir de « start » : { file, d, w } */
  function cut(file, start, ctx){
    /* ctx = { bytes, ab } déjà préparés par prepare() */
    var out=null;
    if(isMp3(file, ctx.bytes)){
      var c=cutMp3(ctx.bytes, start);
      if(c){
        var f=new File([c.bytes], baseName(file.name)+'-extrait.mp3', {type:'audio/mpeg'});
        return decode(c.bytes.buffer.slice(c.bytes.byteOffset, c.bytes.byteOffset+c.bytes.byteLength)).then(function(ab){
          return { file:f, d:Math.max(1,Math.round(ab.duration)), w:rms(ab,80) };
        }).catch(function(){ return cutWav(file, start, ctx); });   /* découpe illisible : on repasse par le WAV */
      }
    }
    return cutWav(file, start, ctx);
  }
  function cutWav(file, start, ctx){
    var bytes=wav(ctx.ab, start);
    var f=new File([bytes], baseName(file.name)+'-extrait.wav', {type:'audio/wav'});
    return decode(bytes.buffer).then(function(ab){ return { file:f, d:Math.max(1,Math.round(ab.duration)), w:rms(ab,80) }; });
  }
  function prepare(file){
    if(file.size > MAX_SRC) return Promise.reject(new Error('too_big'));
    return file.arrayBuffer().then(function(buf){
      var bytes=new Uint8Array(buf);
      return decode(buf).then(function(ab){ return { bytes:bytes, ab:ab }; });
    });
  }

  /* ---------------- fenêtre de choix ---------------- */
  var css = ''
  + '.xm{position:fixed;inset:0;z-index:120;display:grid;place-items:center;padding:16px;background:rgba(4,8,7,.78);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}'
  + '.xm-box{width:min(100%,760px);max-height:calc(100vh - 32px);overflow:auto;background:#0b1211;border:1px solid rgba(237,230,218,.24);border-radius:3px;padding:clamp(16px,3vw,26px);color:#ede6da;font-family:var(--sans,sans-serif)}'
  + '.xm-box h3{margin:0;font-family:var(--display,serif);font-weight:400;font-size:24px;letter-spacing:.1em;text-transform:uppercase}'
  + '.xm-name{margin:6px 0 0;font-size:12.5px;color:#8d948f;word-break:break-word}'
  + '.xm-wave{position:relative;margin-top:18px;height:104px;border:1px solid rgba(237,230,218,.13);background:#0e1615;border-radius:2px;cursor:ew-resize;touch-action:none;outline:none}'
  + '.xm-wave:focus-visible{border-color:#e0b784}'
  + '.xm-wave canvas{position:absolute;inset:0;width:100%;height:100%;display:block}'
  + '.xm-ruler{display:flex;justify-content:space-between;margin-top:6px;font-size:10px;letter-spacing:.14em;color:#8d948f}'
  + '.xm-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:14px}'
  + '.xm-time{flex:1 1 180px;font-size:15px;letter-spacing:.06em;text-align:center}'
  + '.xm-time b{font-weight:400;color:#e0b784}'
  + '.xm-hint{margin:14px 0 0;font-size:11.5px;color:#8d948f;line-height:1.7}'
  + '.xm-hint b{font-weight:400;color:rgba(237,230,218,.85)}'
  + '.xm-act{display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;margin-top:18px}'
  + '.xm-msg{margin:14px 0 0;font-size:13px;color:#8d948f}';

  function el(tag, cls, html){ var e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e; }
  function fmt(t){ t=Math.max(0,Math.round(t)); return Math.floor(t/60)+':'+String(t%60).padStart(2,'0'); }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  /* pick(file) → Promise<{file, d, w}> ; rejette avec { cancelled:true } si on annule */
  function pick(file){
    if(!document.getElementById('xm-css')){ var st=el('style'); st.id='xm-css'; st.textContent=css; document.head.appendChild(st); }
    var back=el('div','xm'), box=el('div','xm-box'); back.appendChild(box);
    box.setAttribute('role','dialog'); box.setAttribute('aria-modal','true'); box.setAttribute('aria-label','Choisir les 30 secondes');
    box.innerHTML='<h3>Choisir les 30 secondes</h3><p class="xm-name">'+esc(file.name)+'</p><p class="xm-msg">Lecture du morceau…</p>';
    document.body.appendChild(back);
    var prevFocus=document.activeElement, closed=false, player=null;

    return new Promise(function(resolve, reject){
      function close(){
        if(closed) return; closed=true; stop();
        document.removeEventListener('keydown', onKey, true);
        if(back.parentNode) back.parentNode.removeChild(back);
        try{ if(prevFocus && prevFocus.focus) prevFocus.focus(); }catch(e){}
      }
      function cancel(){ close(); reject({cancelled:true}); }
      function onKey(e){ if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); cancel(); } }
      document.addEventListener('keydown', onKey, true);
      back.addEventListener('pointerdown', function(e){ if(e.target===back) cancel(); });

      var ctx=null;
      function stop(){ if(player){ try{ player.src.stop(); }catch(e){} try{ player.ac.close(); }catch(e){} cancelAnimationFrame(player.raf); player=null; } }

      prepare(file).then(function(c){
        ctx=c;
        if(closed) return;
        var dur=c.ab.duration;
        if(dur <= LEN+0.8){
          /* morceau déjà court : rien à choisir, on garde le fichier tel quel */
          close(); resolve({ file:file, d:Math.max(1,Math.round(dur)), w:rms(c.ab,80), whole:true }); return;
        }
        build(dur);
      }).catch(function(e){
        if(closed) return;
        var m = e && e.message==='too_big' ? 'Ce fichier est trop lourd (200 Mo maximum).' : 'Ce fichier audio est illisible. Essayez un MP3, un WAV ou un M4A.';
        box.innerHTML='<h3>Choisir les 30 secondes</h3><p class="xm-msg">'+m+'</p><div class="xm-act"><button type="button" class="btn" data-x="no">Fermer</button></div>';
        box.querySelector('[data-x=no]').addEventListener('click', cancel);
      });

      function build(dur){
        var pk=peaks(c_ab(), 600), start=Math.min(Math.max(0, dur*0.3), dur-LEN), headT=null;
        function c_ab(){ return ctx.ab; }
        box.innerHTML='<h3>Choisir les 30 secondes</h3>'
          + '<p class="xm-name">'+esc(file.name)+' · durée '+fmt(dur)+'</p>'
          + '<div class="xm-wave" tabindex="0" role="slider" aria-label="Début de l\'extrait" aria-valuemin="0" aria-valuemax="'+Math.floor(dur-LEN)+'"><canvas></canvas></div>'
          + '<div class="xm-ruler"><span>0:00</span><span>'+fmt(dur/2)+'</span><span>'+fmt(dur)+'</span></div>'
          + '<div class="xm-row">'
          +   '<button type="button" class="btn ghost" data-x="m5" aria-label="Reculer de 5 secondes">&minus; 5 s</button>'
          +   '<div class="xm-time" aria-live="polite"></div>'
          +   '<button type="button" class="btn ghost" data-x="p5" aria-label="Avancer de 5 secondes">+ 5 s</button>'
          +   '<button type="button" class="btn" data-x="play">&#9654; Écouter</button>'
          + '</div>'
          + '<p class="xm-hint"><b>Glissez le cadre</b> (ou touchez la forme d\'onde) pour choisir le passage. Seules ces <b>30 secondes</b> sont envoyées : le morceau complet n\'est jamais publié.</p>'
          + '<div class="xm-act"><button type="button" class="btn ghost" data-x="no">Annuler</button><button type="button" class="btn primary" data-x="ok">Valider l\'extrait</button></div>';
        var wrap=box.querySelector('.xm-wave'), cv=wrap.querySelector('canvas'), g=cv.getContext('2d'),
            timeEl=box.querySelector('.xm-time'), bPlay=box.querySelector('[data-x=play]'), bOk=box.querySelector('[data-x=ok]');

        function size(){
          var r=wrap.getBoundingClientRect(), d=window.devicePixelRatio||1;
          cv.width=Math.max(10,Math.round(r.width*d)); cv.height=Math.max(10,Math.round(r.height*d)); draw();
        }
        function draw(){
          var W=cv.width, H=cv.height, d=window.devicePixelRatio||1, n=Math.floor(W/(3*d)), sx=start/dur*W, ex=(start+LEN)/dur*W;
          g.clearRect(0,0,W,H);
          /* cadre de sélection */
          g.fillStyle='rgba(201,153,92,.14)'; g.fillRect(sx,0,ex-sx,H);
          /* barres */
          for(var i=0;i<n;i++){
            var x=i*(W/n), v=pk[Math.min(pk.length-1,Math.floor(i/n*pk.length))], h=Math.max(2*d,v*(H-12*d)), inside=(x+1>=sx && x<=ex);
            g.fillStyle=inside?'#e0b784':'rgba(237,230,218,.3)';
            g.fillRect(x, (H-h)/2, Math.max(1,W/n-1.4*d), h);
          }
          g.fillStyle='#e0b784'; g.fillRect(sx,0,2*d,H); g.fillRect(ex-2*d,0,2*d,H);
          if(headT!=null){ var hx=headT/dur*W; g.fillStyle='#ede6da'; g.fillRect(hx-d,0,2*d,H); }
          timeEl.innerHTML='Début <b>'+fmt(start)+'</b> &nbsp;→&nbsp; fin <b>'+fmt(start+LEN)+'</b>';
          wrap.setAttribute('aria-valuenow', String(Math.round(start)));
          wrap.setAttribute('aria-valuetext', 'de '+fmt(start)+' à '+fmt(start+LEN));
        }
        function setStart(s, restart){
          start=Math.min(Math.max(0,s), dur-LEN); headT=null; draw();
          if(player && restart!==false) play();
        }
        function posOf(e){ var r=wrap.getBoundingClientRect(); return (e.clientX-r.left)/r.width*dur; }
        var drag=null;
        wrap.addEventListener('pointerdown', function(e){
          e.preventDefault(); wrap.focus({preventScroll:true});
          var p=posOf(e), inside=(p>=start && p<=start+LEN);
          drag={ off: inside ? p-start : LEN/2 };
          try{ wrap.setPointerCapture(e.pointerId); }catch(x){}
          setStart(p-drag.off, false);
        });
        wrap.addEventListener('pointermove', function(e){ if(drag) setStart(posOf(e)-drag.off, false); });
        function end(){ if(drag){ drag=null; if(player) play(); } }
        wrap.addEventListener('pointerup', end); wrap.addEventListener('pointercancel', end);
        wrap.addEventListener('keydown', function(e){
          var k=e.key, step=e.shiftKey?5:1;
          if(k==='ArrowRight'||k==='ArrowUp'){ e.preventDefault(); setStart(start+step); }
          else if(k==='ArrowLeft'||k==='ArrowDown'){ e.preventDefault(); setStart(start-step); }
          else if(k==='Home'){ e.preventDefault(); setStart(0); }
          else if(k==='End'){ e.preventDefault(); setStart(dur-LEN); }
          else if(k===' '){ e.preventDefault(); player?stop2():play(); }
        });
        box.querySelector('[data-x=m5]').addEventListener('click', function(){ setStart(start-5); });
        box.querySelector('[data-x=p5]').addEventListener('click', function(){ setStart(start+5); });
        box.querySelector('[data-x=no]').addEventListener('click', cancel);

        function stop2(){ stop(); headT=null; bPlay.innerHTML='&#9654; Écouter'; draw(); }
        function play(){
          stop();
          try{
            var ac=ctxNew(), s=ac.createBufferSource(), gain=ac.createGain();
            s.buffer=ctx.ab; s.connect(gain); gain.connect(ac.destination);
            var t0=ac.currentTime+0.03, from=start;
            gain.gain.setValueAtTime(0,t0); gain.gain.linearRampToValueAtTime(1,t0+0.15);
            gain.gain.setValueAtTime(1,t0+LEN-0.5); gain.gain.linearRampToValueAtTime(0,t0+LEN);
            s.start(t0, from, LEN);
            player={ac:ac, src:s, raf:0};
            bPlay.innerHTML='&#10074;&#10074; Pause';
            (function tick(){
              if(!player || player.ac!==ac) return;
              var el=ac.currentTime-t0;
              if(el>=LEN){ stop2(); return; }
              headT=from+Math.max(0,el); draw(); player.raf=requestAnimationFrame(tick);
            })();
          }catch(e){ player=null; }
        }
        bPlay.addEventListener('click', function(){ if(player) stop2(); else play(); });
        bOk.addEventListener('click', function(){
          stop2(); bOk.disabled=true; bPlay.disabled=true;
          var m=box.querySelector('.xm-hint'); m.innerHTML='Préparation de l\'extrait…';
          cut(file, start, ctx).then(function(r){ close(); r.start=start; resolve(r); })
            .catch(function(){ bOk.disabled=false; bPlay.disabled=false; m.innerHTML='Impossible de préparer l\'extrait. Essayez un autre passage ou un autre format.'; });
        });
        window.addEventListener('resize', size);
        size(); wrap.focus({preventScroll:true});
        var oc=close; close=function(){ window.removeEventListener('resize', size); oc(); };
      }
    });
  }

  window.NomoreExcerpt = { pick:pick, prepare:prepare, cut:cut, LEN:LEN, _mp3Frames:mp3Frames };
})();
