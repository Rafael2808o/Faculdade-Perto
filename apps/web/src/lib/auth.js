const USER_KEY='faculdade_perto_user';
export const getStoredUser=()=>{try{return JSON.parse(localStorage.getItem(USER_KEY)||'null')}catch{return null}};
export const hasSession=()=>Boolean(getStoredUser());
export function saveSession(session){localStorage.removeItem('faculdade_perto_token');localStorage.setItem(USER_KEY,JSON.stringify(session.user));window.dispatchEvent(new Event('faculdade-auth'))}
export function clearSession(){localStorage.removeItem('faculdade_perto_token');localStorage.removeItem(USER_KEY);window.dispatchEvent(new Event('faculdade-auth'))}
