import type { Metadata } from "next";
import "./globals.css";
import AppHeader from "@/components/app-header";

export const metadata: Metadata = {
  title: "DavkiNaDelnicah.si — Davčna napoved brez glavobola",
  description: "Davčna napoved za slovenske vlagatelje po pravilih FURS. FIFO izračun, Doh-KDVP in Doh-Div XML izvoz.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
<<<<<<< HEAD
    <html
      lang="sl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header style={{ padding: 12, borderBottom: "1px solid #eee" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <a href="/" style={{ fontWeight: 700, fontSize: 18, textDecoration: "none", color: "inherit" }}>
                Kripto Davki 🇸🇮
              </a>
              <nav style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <a href="/dashboard" style={{ color: "#333", textDecoration: "none" }}>Nadzorna plošča</a>
                <a href="/upload" style={{ color: "#333", textDecoration: "none" }}>Uvoz CSV</a>
                <a href="/transactions" style={{ color: "#333", textDecoration: "none" }}>Transakcije</a>
                <a href="/reports" style={{ color: "#333", textDecoration: "none" }}>Poročila</a>
                <a href="/profile" style={{ color: "#333", textDecoration: "none" }}>Profil</a>
              </nav>
            </div>
            <div>
            </div>
          </div>
        </header>
=======
    <html lang="sl">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700&display=swap"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppHeader />
>>>>>>> claude/elegant-dirac-KCdjI
        {children}
        <script dangerouslySetInnerHTML={{
          __html: `(function(){
            var stored=localStorage.getItem('dnd-theme');
            var sys=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
            var t=stored||sys;
            if(t==='dark')document.documentElement.setAttribute('data-theme','dark');
            function initTheme(){
              document.querySelectorAll('[data-theme-toggle]').forEach(function(btn){
                btn.addEventListener('click',function(){
                  var cur=document.documentElement.getAttribute('data-theme')==='dark'?'dark':'light';
                  var next=cur==='dark'?'light':'dark';
                  if(next==='dark')document.documentElement.setAttribute('data-theme','dark');
                  else document.documentElement.removeAttribute('data-theme');
                  localStorage.setItem('dnd-theme',next);
                });
              });
            }
            function initAppbar(){
              var bar=document.querySelector('.appbar');
              if(!bar)return;
              var on=function(){bar.classList.toggle('scrolled',window.scrollY>4);};
              window.addEventListener('scroll',on,{passive:true});on();
            }
            function initReveal(){
              var els=document.querySelectorAll('.reveal');
              if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in');});return;}
              var io=new IntersectionObserver(function(entries){
                entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});
              },{threshold:0.12,rootMargin:'0px 0px -6% 0px'});
              els.forEach(function(el){io.observe(el);});
            }
            function initFaq(){
              document.querySelectorAll('.faq-item').forEach(function(item){
                var q=item.querySelector('.faq-q');var a=item.querySelector('.faq-a');
                if(!q||!a)return;
                q.addEventListener('click',function(){
                  var open=item.classList.contains('open');
                  document.querySelectorAll('.faq-item').forEach(function(o){
                    o.classList.remove('open');var aa=o.querySelector('.faq-a');if(aa)aa.style.maxHeight=null;
                  });
                  if(!open){item.classList.add('open');a.style.maxHeight=a.scrollHeight+'px';}
                });
              });
            }
            function initChips(){
              document.querySelectorAll('[data-chip-group]').forEach(function(group){
                group.querySelectorAll('.chip').forEach(function(c){
                  c.addEventListener('click',function(){
                    if(group.dataset.chipGroup==='multi')c.classList.toggle('on');
                    else{group.querySelectorAll('.chip').forEach(function(x){x.classList.remove('on');});c.classList.add('on');}
                  });
                });
              });
            }
            if(document.readyState==='loading'){
              document.addEventListener('DOMContentLoaded',function(){initTheme();initAppbar();initReveal();initFaq();initChips();});
            } else {
              initTheme();initAppbar();initReveal();initFaq();initChips();
            }
          })();`
        }} />
      </body>
    </html>
  );
}
