const TOKEN_KEY='faculdade_perto_token';
const USER_KEY='faculdade_perto_user';
export const getToken=()=>localStorage.getItem(TOKEN_KEY);
export const getStoredUser=()=>{try{return JSON.parse(localStorage.getItem(USER_KEY)||'null')}catch{return null}};
export function saveSession(session){localStorage.setItem(TOKEN_KEY,session.token);localStorage.setItem(USER_KEY,JSON.stringify(session.user));window.dispatchEvent(new Event('faculdade-auth'))}
export function clearSession(){localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(USER_KEY);window.dispatchEvent(new Event('faculdade-auth'))}
