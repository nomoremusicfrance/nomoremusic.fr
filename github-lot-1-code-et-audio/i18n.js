/* Nomore — bascule FR / EN.
   Le français reste la langue d'origine écrite dans les pages ; ce fichier fournit l'anglais
   et remet le français à la demande. Langue retenue : ?lang=… > choix mémorisé > langue du navigateur. */
(function(){
  var EN = {
    /* ---- commun ---- */
    home:'Nomore Group — home',
    group:'Nomore Group',
    social:'Social media',
    langLabel:'Language',
    close:'Close',

    /* ---- menu ---- */
    menuNav:'Main navigation',
    mailCopied:'Address copied: {0}', mMusic:'Nomore Music', mHour:'Nomore Hour', mUnr:'Unreleased', mRefs:'References', mDisc:'Discography', mGal:'Gallery', mDates:'Dates', mFaq:'FAQ', mContact:'Contact',
    openMenu:'Open menu', closeMenu:'Close menu',

    /* ---- hero ---- */
    heroAlt:'Sunset over the rooftop: Pioneer decks, lounge seating and candles facing the bay',
    discover:'Discover Nomore',

    /* ---- pôles ---- */
    poles:'The two Nomore divisions',
    musicAlt:'Nomore on stage, arms open, under lasers and smoke',
    musicP:'Resident DJ at Les Bateaux Lyonnais (Maisons Bocuse), Nomore creates tailor-made DJ sets. Soft, understated house music that gives your events, private or professional, an elegant atmosphere.',
    bookSet:'Book a DJ set',
    bookSetAria:'Book a DJ set with Nomore Music, on WhatsApp',
    waMusic:'https://wa.me/33666564946?text=Hello%20Nomore%2C%20I%27d%20like%20to%20book%20a%20DJ%20set%20(Nomore%20Music).',
    hourAlt:'Nomore Hour: concert at the foot of an illuminated château, purple lasers and an orange stage',
    hourP:'We organize your events in exceptional venues: hotels, rooftops, private villas, boats, châteaux, gastronomic tables. One place, one hour, one atmosphere.',
    produce:'Produce my event',
    produceAria:'Produce my event with Nomore Hour, on WhatsApp',
    waHour:'https://wa.me/33666564946?text=Hello%20Nomore%2C%20I%27d%20like%20you%20to%20produce%20my%20event%20(Nomore%20Hour).',

    /* ---- sections ---- */
    refs:'References',
    disc:'Discography',
    gal:'Gallery',
    viewAll:'View all',
    band:'Gallery, unreleased tracks and dates',
    unrSub:'Exclusive previews',
    dates:'Dates',
    datesSub:'Upcoming dates',
    noDates:'Upcoming dates to be announced soon.',

    /* ---- FAQ ---- */
    faq:'FAQ',
    faqSub:'Frequently asked questions',
    portraitAlt:'Nomore, DJ and event producer, headphones on, under an amber spotlight',
    q1:'Who is Nomore?',
    a1:'Nomore is a Lyon-based DJ and event producer, resident at Les Bateaux Lyonnais (Maisons Bocuse). With 12 years of experience in clubs, hotels, rooftops and business events, he delivers a lounge and organic house music sound: an accessible style that speaks to everyone.',
    q2:'Where does he perform?',
    a2:'Lyon is his home port, but Nomore performs all over France, most often between Lyon, Paris and Saint-Tropez. His career has also taken him abroad, notably to London and Madrid.',
    q3:'Does he bring his own equipment?',
    a3:'Yes. He performs with a complete Pioneer setup and professional speakers. Setup is quick and carried out by our team. His sets run from 1 to 5 hours, depending on the format of your event.',
    q4:'Does he produce the whole event, from A to Z?',
    a4:'Yes. With the Nomore Hour service, your event is designed and produced as a whole: artistic direction, music, visuals, atmosphere and performers. One point of contact, from the first idea to the last track. If you are only looking for a DJ set, the Nomore Music service is the better choice.',
    q5:'How do I book, and how far in advance?',
    a5:'Simply get in touch via the <a href="contact.html">contact form</a> or directly on <a href="https://wa.me/33666564946" target="_blank" rel="noopener">WhatsApp</a>. It is best to book as early as possible, as some dates are blocked several months in advance.',

    /* ---- lecteur, bibliothèques, agrandissement ---- */
    player:'Player', closePlayer:'Close player', prevTrack:'Previous track', nextTrack:'Next track',
    play:'Play', pause:'Pause', playPreview:'Play preview', posTrack:'Position in track', posIn:'Position in {0}',
    secOf:'{0} seconds of {1}',
    fullDisc:'Full discography', closeDisc:'Close discography',
    fullGal:'Full gallery', closeGal:'Close gallery',
    bigPhoto:'Enlarged photo', portraitOpen:'Enlarge the photo', prevPhoto:'Previous photo', nextPhoto:'Next photo',
    listen:'Play {0}', coverOf:'Cover of {0}', enlarge:'Enlarge: {0}',
    askFull:'{0} — full track request',

    /* ---- contact ---- */
    cDesc:'Lounge & organic house DJ set, premium & tailor-made event production. Reply within 12 hours.',
    back:'Back',
    delay:'Reply within 12 hours.',
    yourProject:'Your project',
    projType:'Project type',
    hourSub:'Premium & tailor-made event production.', musicSub:'Lounge & organic house DJ set.',
    other:'Other', otherSub:'Tell us everything.',
    fName:'Name', phName:'First and last name',
    fMail:'Email', phMail:'you@example.com',
    fWhen:'Date',
    calOpen:'Open calendar', calTitle:'Calendar', calPrev:'Previous month', calNext:'Next month',
    calToday:'Today', calPick:'Choose month',
    fWhere:'Venue', phWhere:'Hotel, rooftop, villa, boat…',
    fMsg:'Message', phMsg:'Format, mood, number of guests, budget…',
    send:'Send', sending:'Sending…',
    thanks:'Thank you.',
    thanksP:'Your request has arrived.<br>We’ll get back to you within 12h.',
    again:'Send another request',
    errName:'Please enter your name.',
    errMail:'Invalid email.',
    errFmt:'Format: dd.mm.yyyy',
    errDate:'Invalid date.',
    errPast:'Please choose a date from today onwards.',
    errSend:'Sending failed. Write to us directly: '
  };

  /* légendes des photos de la galerie */
  var ALT = {
 "Portrait de profil, lumière orange": "Side-profile portrait, orange light",
 "Portrait en miroir, fumée rouge": "Mirrored portrait, red smoke",
 "Set Nomore devant l'écran LED du club": "Nomore set in front of the club's LED screen",
 "Soirée anniversaire au Petit Salon, salle pleine": "Birthday party at Le Petit Salon, packed room",
 "Lasers et public devant l'écran Nomore": "Lasers and crowd in front of the Nomore screen",
 "Salle comble sous les faisceaux rouges": "Packed room under red beams",
 "Dancefloor bleu face à l'écran Nomore": "Blue dancefloor facing the Nomore screen",
 "Dancefloor baigné de bleu face au booth": "Dancefloor bathed in blue facing the booth",
 "Mains levées face au booth, fin de set": "Hands in the air facing the booth, end of set",
 "Booth fleuri et faisceaux blancs, XLR Events": "Flower-dressed booth and white beams, XLR Events",
 "Faisceaux blancs et bougies vus depuis la piste": "White beams and candles seen from the floor",
 "Lasers turquoise et fumée devant l'écran Nomore": "Turquoise lasers and smoke in front of the Nomore screen",
 "Faisceaux orange en croix au-dessus du booth": "Crossed orange beams above the booth",
 "Lasers violets balayant le dancefloor": "Purple lasers sweeping the dancefloor",
 "Colonne de lumière magenta sur le booth": "Column of magenta light over the booth",
 "Foule dans le faisceau turquoise, XLR Events": "Crowd in the turquoise beam, XLR Events",
 "Bras levé, salle comble sous la lumière dorée": "Raised arm, packed room under golden light",
 "Public qui applaudit au-dessus des platines": "Crowd applauding above the decks",
 "Set en extérieur, foule bras levés au crépuscule": "Outdoor set, crowd with raised arms at dusk",
 "Scène inversée, silhouettes et écran bleuté": "Inverted scene, silhouettes and bluish screen",
 "Vue depuis les platines sur la foule": "View from the decks over the crowd",
 "Silhouette de Nomore devant l'écran géant": "Nomore's silhouette in front of the giant screen",
 "Nomore de dos face à la salle, lumières vertes": "Nomore from behind facing the room, green lights",
 "Nomore de dos en chemise à fleurs face à la salle": "Nomore from behind in a flowered shirt facing the room",
 "Nomore aux platines, foule bleue et djembé": "Nomore at the decks, blue crowd and djembe",
 "Nomore bras levé devant un dancefloor comble": "Nomore with a raised arm in front of a packed dancefloor",
 "Nomore aux platines devant l'enseigne Aftersun": "Nomore at the decks in front of the Aftersun sign",
 "Nomore concentré sous les gerbes lumineuses": "Nomore focused under bursts of light",
 "Nomore bras ouvert devant l'enseigne Aftersun": "Nomore with an open arm in front of the Aftersun sign",
 "Nomore aux platines sous les néons rouges": "Nomore at the decks under red neon",
 "Nomore de profil dans un faisceau bleu": "Nomore in profile in a blue beam",
 "Nomore bras levé, casque sur la nuque": "Nomore with a raised arm, headphones around his neck",
 "Nomore aux platines sous les lasers turquoise": "Nomore at the decks under turquoise lasers",
 "Nomore bras levé dans un faisceau blanc": "Nomore with a raised arm in a white beam",
 "Nomore aux platines, casquette et lumière verte": "Nomore at the decks, cap and green light",
 "Nomore aux platines derrière le feuillage": "Nomore at the decks behind the foliage",
 "Nomore de dos, casque et lumière rasante": "Nomore from behind, headphones and low light",
 "Nomore de profil sous une lumière violette": "Nomore in profile under purple light",
 "Nomore aux platines, lumière magenta": "Nomore at the decks, magenta light",
 "Nomore de profil, contre-jour blanc": "Nomore in profile, white backlight",
 "Nomore en backstage sous les lumières violettes": "Nomore backstage under purple lights"
};

  var D = { en: EN };
  var lang = 'fr';
  try{
    var q = (new URLSearchParams(location.search).get('lang')||'').toLowerCase();
    var s = ''; try{ s = localStorage.getItem('nm-lang')||''; }catch(e){}
    var nav = ((navigator.languages && navigator.languages[0]) || navigator.language || 'fr').toLowerCase();
    if(q==='fr' || q==='en') lang = q;
    else if(s==='fr' || s==='en') lang = s;
    else lang = nav.indexOf('fr')===0 ? 'fr' : 'en';
  }catch(e){}

  function t(key){
    var v = (lang==='en' && D.en[key]!=null) ? D.en[key] : null;
    if(v==null) return null;
    for(var i=1;i<arguments.length;i++) v = v.split('{'+(i-1)+'}').join(arguments[i]);
    return v;
  }
  /* texte courant : l'anglais si disponible, sinon le français passé en repli */
  function tr(key, fr){
    var a=[].slice.call(arguments,2), v=t.apply(null,[key].concat(a));
    if(v!=null) return v;
    for(var i=0;i<a.length;i++) fr = fr.split('{'+i+'}').join(a[i]);
    return fr;
  }

  function alt(fr){ return (lang==='en' && ALT[fr]) ? ALT[fr] : fr; }

  function apply(){
    var doc=document.documentElement; doc.lang=lang;
    document.querySelectorAll('[data-i18n]').forEach(function(el){
      if(el.getAttribute('data-fr')===null) el.setAttribute('data-fr', el.textContent);
      el.textContent = lang==='en' ? (D.en[el.getAttribute('data-i18n')]||el.getAttribute('data-fr')) : el.getAttribute('data-fr');
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function(el){
      if(el.getAttribute('data-fr')===null) el.setAttribute('data-fr', el.innerHTML);
      el.innerHTML = lang==='en' ? (D.en[el.getAttribute('data-i18n-html')]||el.getAttribute('data-fr')) : el.getAttribute('data-fr');
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(function(el){
      el.getAttribute('data-i18n-attr').split(',').forEach(function(p){
        var kv=p.split(':'), a=kv[0].trim(), k=kv[1].trim(), o='data-fr-'+a;
        if(el.getAttribute(o)===null) el.setAttribute(o, el.getAttribute(a)||'');
        el.setAttribute(a, lang==='en' ? (D.en[k]||el.getAttribute(o)) : el.getAttribute(o));
      });
    });
    var b=document.getElementById('langBtn');
    if(b){ b.setAttribute('data-lang', lang);
      [].forEach.call(b.querySelectorAll('[data-l]'), function(s){ s.setAttribute('data-on', s.getAttribute('data-l')===lang ? 'true':'false'); }); }
  }

  /* fondu : les textes s'effacent, la langue change, puis ils réapparaissent — pas de rechargement, pas d'écran blanc */
  var st=document.createElement('style');
  st.textContent='html.lang-out [data-i18n],html.lang-out [data-i18n-html]{opacity:0!important;transition:opacity .24s ease!important}'
    +'html.lang-in [data-i18n],html.lang-in [data-i18n-html]{transition:opacity .38s ease!important}';
  document.head.appendChild(st);
  var busy=false;
  function set(l){
    if(l===lang || busy) return;
    lang=l; try{ localStorage.setItem('nm-lang', l); }catch(e){}
    var d=document.documentElement, still = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
    function swap(){
      apply(); if(I.onchange) I.onchange(l);
      if(still){ busy=false; return; }
      d.classList.remove('lang-out'); d.classList.add('lang-in');
      setTimeout(function(){ d.classList.remove('lang-in'); busy=false; }, 420);
    }
    busy=true;
    if(still){ swap(); return; }
    d.classList.add('lang-out');
    setTimeout(swap, 260);
  }

  var I = window.I18N = { t:t, tr:tr, alt:alt, apply:apply, set:set, reload:false, beforeReload:null, onchange:null,
                          get lang(){ return lang; } };

  /* e-mail : ouvre l'application de messagerie par défaut (ordinateur ou mobile) ; si rien ne s'ouvre, l'adresse est copiée */
  document.addEventListener('click', function(e){
    var a=e.target.closest && e.target.closest('a[href^="mailto:"]'); if(!a) return;
    e.preventDefault();
    var u=a.href, addr=u.replace(/^mailto:/i,'').split('?')[0], left=false;
    function gone(){ left=true; }
    window.addEventListener('blur', gone); document.addEventListener('visibilitychange', gone);
    try{ window.top.location.href=u; }catch(x){ try{ window.location.href=u; }catch(y){} }
    setTimeout(function(){
      window.removeEventListener('blur', gone); document.removeEventListener('visibilitychange', gone);
      if(left) return;
      try{ navigator.clipboard.writeText(addr).catch(function(){}); }catch(z){}
      var t=document.createElement('div'); t.setAttribute('role','status');
      t.textContent=tr('mailCopied','Adresse copiée : {0}',addr);
      t.style.cssText='position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:9999;padding:12px 20px;background:#0d1514;color:#ede6da;border:1px solid rgba(237,230,218,.24);font:400 11px/1.4 Outfit,Inter,sans-serif;letter-spacing:.14em;opacity:0;transition:opacity .3s ease';
      document.body.appendChild(t); requestAnimationFrame(function(){ t.style.opacity='1'; });
      setTimeout(function(){ t.style.opacity='0'; setTimeout(function(){ t.remove(); },320); }, 2600);
    }, 1100);
  });

  function init(){
    apply();
    var b=document.getElementById('langBtn');
    if(b) b.addEventListener('click', function(){ set(lang==='en' ? 'fr' : 'en'); });
  }
  init();   /* le script est chargé en fin de page : tout le contenu est déjà là */
})();
