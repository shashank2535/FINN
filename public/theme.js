// Runs before the stylesheet so a saved dark preference does not flash white.
(()=>{
 const key='finn-theme';
 function apply(value,save=true){
  const theme=value==='dark'?'dark':'light';
  document.documentElement.dataset.theme=theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#111416':'#ffffff');
  if(save)try{localStorage.setItem(key,theme)}catch{}
  window.dispatchEvent(new CustomEvent('finn-theme-change',{detail:theme}));
  return theme;
 }
 let initial='light';try{initial=localStorage.getItem(key)||'light'}catch{}
 apply(initial,false);
 window.FinnTheme={current:()=>document.documentElement.dataset.theme||'light',set:apply};
 window.addEventListener('storage',event=>{if(event.key===key)apply(event.newValue,false)});
})();
