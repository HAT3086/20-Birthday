// Translation matching and preferences. Edit copy in i18n-vi.mjs / i18n-blocks.mjs.
import { MESSAGES, PHRASES } from './i18n-vi.mjs';
export { MESSAGES, PHRASES } from './i18n-vi.mjs';
export const LANGUAGE_KEY = 'twenty.language.v1';
export const normalizeLanguage = value => value === 'vi' ? 'vi' : 'en';
export function readLanguage(storage) { try { return normalizeLanguage(storage?.getItem(LANGUAGE_KEY)); } catch { return 'en'; } }
export function writeLanguage(storage, language) {
  try { storage.setItem(LANGUAGE_KEY, normalizeLanguage(language)); return true; } catch { return false; }
}

const nested = new Set(['outfit','breed','label','section','reason','treat','result']);
const numeric = new Set(['count','target','coins','stars','row','column']);
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const choices={
  outfit:['Original','Garden Paws','Little Sailor','Bumble Cat','Moon Wizard','Space Mochi','Birthday Cat'],
  breed:['Original','British Shorthair','Siamese','Orange','Ragdoll'],
  game:['Cake','Flappy Cat','Rooftop Run','Cat Fishing','Candy Cat','Catris'],
  section:['Garden Roof','Lantern Lane','Home Stretch'],
};
const patterns = PHRASES.map(([source,target]) => {
  const names=[];let cursor=0,regex='';
  for(const match of source.matchAll(/\{(\w+)\}/g)) {
    const name=match[1];
    regex+=escape(source.slice(cursor,match.index))+(numeric.has(name)?'([\\d,.]+)':choices[name]?'('+choices[name].map(escape).join('|')+')':'(.+?)');
    names.push(match[1]);cursor=match.index+match[0].length;
  }
  return {regex:new RegExp('^'+regex+escape(source.slice(cursor))+'$'),names,target};
});
const cache=new Map();
export function translateMessage(value, language='en', depth=0) {
  if(language!=='vi'||typeof value!=='string')return value;
  if(!/[A-Za-z]/.test(value))return value.replace(/\b\d{1,3}(?:,\d{3})+\b/g,number=>number.replaceAll(',','.'));
  const cacheKey=value;if(depth===0&&cache.has(cacheKey))return cache.get(cacheKey);
  const key=value.trim().replace(/\s+/g,' ');let translated=MESSAGES[key];
  if(!translated&&depth<5)for(const {regex,names,target} of patterns){
    const match=key.match(regex);if(!match)continue;
    const values=Object.fromEntries(names.map((name,index)=>[name,nested.has(name)?translateMessage(match[index+1],'vi',depth+1):numeric.has(name)?match[index+1].replaceAll(',','.'):match[index+1]]));
    translated=target.replace(/\{(\w+)\}/g,(_,name)=>values[name]);break;
  }
  const result=translated?value.match(/^\s*/)[0]+translated+value.match(/\s*$/)[0]:value;
  if(depth===0){if(cache.size>2048)cache.clear();cache.set(cacheKey,result);}return result;
}
