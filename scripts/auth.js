(function(){
'use strict';
const DEFAULT_HASH='732799fc370f62e97587014a95fa7abcbcae608d3a46c2b0f7bff59032a772d1'; // Spirale@2026
const hashKey='spinapp-admin-hash', sessionKey='spinapp-admin-session';
async function sha256(text){const data=new TextEncoder().encode(text);const hash=await crypto.subtle.digest('SHA-256',data);return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('')}
function getHash(){return localStorage.getItem(hashKey)||DEFAULT_HASH}
async function verifyPassword(password){return await sha256(password||'')===getHash()}
function login(){sessionStorage.setItem(sessionKey,JSON.stringify({at:Date.now(),exp:Date.now()+12*60*60*1000}))}
function logout(){sessionStorage.removeItem(sessionKey)}
function isLoggedIn(){try{const s=JSON.parse(sessionStorage.getItem(sessionKey)||'{}');if(s.exp&&s.exp>Date.now())return true;logout();return false}catch(e){return false}}
async function changePassword(oldPassword,newPassword){if(!newPassword||newPassword.length<8)throw new Error('Le nouveau mot de passe doit contenir au moins 8 caractères.');const ok=await verifyPassword(oldPassword);if(!ok)throw new Error('Ancien mot de passe incorrect.');localStorage.setItem(hashKey,await sha256(newPassword));return true}
window.SpinAuth={verifyPassword,login,logout,isLoggedIn,changePassword,sha256,DEFAULT_HASH};
})();
