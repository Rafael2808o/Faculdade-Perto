export const THEME_STORAGE_KEY='faculdade-perto:theme';

export function getPreferredTheme(storage=globalThis.localStorage,media=globalThis.matchMedia){
  try{
    const saved=storage?.getItem(THEME_STORAGE_KEY);
    if(saved==='light'||saved==='dark')return saved;
  }catch{}
  return media?.('(prefers-color-scheme: dark)').matches?'dark':'light';
}

export function applyTheme(theme,documentElement=globalThis.document?.documentElement){
  if(!documentElement)return;
  documentElement.dataset.theme=theme;
  documentElement.style.colorScheme=theme;
}

export function saveTheme(theme,storage=globalThis.localStorage){
  try{storage?.setItem(THEME_STORAGE_KEY,theme)}catch{}
}
