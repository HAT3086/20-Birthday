import { LANGUAGE_KEY, normalizeLanguage, readLanguage, writeLanguage, translateMessage } from './i18n-core.mjs';
import { BLOCKS } from './i18n-blocks.mjs';

let storage;
try { storage = globalThis.window?.localStorage; } catch {}
let language = readLanguage(storage);
export const t = value => translateMessage(value, language);

const ignored = 'script,style,svg,input,textarea,[data-i18n-ignore],[data-i18n-active],#cat-name,#hub-cat-name,#player-name,#player-initial';
const attributes = ['aria-label','title','placeholder'];
const blockText = html => html.replace(/<[^>]*>/g,'').replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#39;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>').normalize('NFC').replace(/\s+/g,' ').trim();

// Live controls and running game/camera state stay in place. Static passages
// have authored inline markup, with the original English retained for restoration.
export class PageTranslator {
  constructor(document) { this.document=document;this.texts=new WeakMap();this.attributes=new WeakMap();this.blocks=new WeakMap(); }
  block(element, locale) {
    const copy=BLOCKS[element.getAttribute('data-i18n-block')];if(!copy)return;
    const previous=this.blocks.get(element),current=element.innerHTML;
    const source=previous?.last===current?previous.source:current;
    if(blockText(source)!==copy.source){element.removeAttribute('data-i18n-active');return;}
    const html=locale==='vi'?copy.html:source;
    if(html!==current)element.innerHTML=html;
    if(locale==='vi')element.setAttribute('data-i18n-active','');else element.removeAttribute('data-i18n-active');
    this.blocks.set(element,{source,last:element.innerHTML});
  }
  text(node, locale) {
    if(node.parentElement?.closest(ignored))return;
    const previous=this.texts.get(node),current=node.data;
    const source=previous?.last===current?previous.source:current;
    const next=translateMessage(source,locale);
    if(next!==current)node.data=next;
    this.texts.set(node,{source,last:next});
  }
  labels(element, locale) {
    if(element.closest?.('[data-i18n-ignore]'))return;
    let records=this.attributes.get(element);if(!records){records=new Map();this.attributes.set(element,records);}
    for(const name of attributes){
      if(!element.hasAttribute(name))continue;
      const current=element.getAttribute(name),previous=records.get(name);
      const source=previous?.last===current?previous.source:current;
      const next=translateMessage(source,locale);
      if(next!==current)element.setAttribute(name,next);
      records.set(name,{source,last:next});
    }
  }
  translate(root, locale) {
    if(root.nodeType===3){this.text(root,locale);return;}
    if(root.nodeType!==1)return;
    this.block(root,locale);
    for(const element of root.querySelectorAll('[data-i18n-block]'))this.block(element,locale);
    this.labels(root,locale);
    for(const element of root.querySelectorAll('[aria-label],[title],[placeholder]'))this.labels(element,locale);
    const walker=this.document.createTreeWalker(root,4);
    for(let node=walker.nextNode();node;node=walker.nextNode())this.text(node,locale);
  }
}

export function mountLanguageSwitcher(document, window) {
  const translator=new PageTranslator(document),buttons=[];
  let observer,visitOnlyChoice=false;
  const watch=()=>{
    if(language==='vi')observer?.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attributes});
  };
  if(window.MutationObserver)observer=new window.MutationObserver(changes=>{
    observer.disconnect();
    const roots=new Set(),labels=new Set();
    for(const change of changes){
      if(change.type==='attributes')labels.add(change.target);
      else if(change.type==='characterData')roots.add(change.target);
      else for(const node of change.addedNodes)roots.add(node);
    }
    for(const root of roots)if(root.isConnected)translator.translate(root,language);
    for(const element of labels)if(element.isConnected)translator.labels(element,language);
    watch();
  });
  function renderButtons(){
    for(const button of buttons){
      button.setAttribute('data-language',language);
      button.setAttribute('aria-pressed',String(language==='vi'));
      button.setAttribute('aria-label',language==='vi'?'Chuyển sang tiếng Anh':'Switch to Vietnamese');
      button.title=language==='vi'?'Chuyển sang tiếng Anh':'Switch to Vietnamese';
    }
  }
  function select(next,{persist=true}={}){
    observer?.disconnect();language=normalizeLanguage(next);
    if(persist)visitOnlyChoice=!writeLanguage(storage,language);
    document.documentElement.lang=language;
    translator.translate(document.documentElement,language);renderButtons();watch();
    window.dispatchEvent(new window.CustomEvent('languagechange',{detail:{language}}));
  }
  function button(){
    const node=document.createElement('button');node.type='button';node.className='language-switch';
    node.setAttribute('data-i18n-ignore','');
    node.innerHTML='<span class="language-en" lang="en" aria-hidden="true">EN</span><span class="language-divider" aria-hidden="true">/</span><span class="language-vi" lang="vi" aria-hidden="true">VI</span>';
    node.addEventListener('click',()=>select(language==='en'?'vi':'en'));
    node.addEventListener('keydown',event=>{if(event.key===' '||event.key==='Enter')event.stopPropagation();});
    buttons.push(node);return node;
  }
  document.querySelector('header')?.append(button());
  document.querySelector('.laptop-notice')?.append(button());
  window.addEventListener('storage',event=>{if(event.key===LANGUAGE_KEY){visitOnlyChoice=false;if(normalizeLanguage(event.newValue)!==language)select(event.newValue,{persist:false});}});
  window.addEventListener('pageshow',()=>{if(visitOnlyChoice)return;const next=readLanguage(storage);if(next!==language)select(next,{persist:false});});
  select(language,{persist:false});
  return {select,get language(){return language;},stop(){observer?.disconnect();}};
}

if(typeof document!=='undefined'&&typeof window!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>mountLanguageSwitcher(document,window),{once:true});
  else mountLanguageSwitcher(document,window);
}
