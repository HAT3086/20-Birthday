import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { LANGUAGE_KEY, MESSAGES, PHRASES, readLanguage, writeLanguage, translateMessage as vi } from '../dist/i18n-core.mjs';
import { PageTranslator } from '../dist/i18n.mjs';
import { BLOCKS } from '../dist/i18n-blocks.mjs';
import { inflateSync } from 'node:zlib';

test('language preferences persist independently of game progress and tolerate blocked storage',()=>{
  const saved='{"games":{"snake":{"stars":3}},"wallet":{"coins":30}}';
  const data=new Map([['twenty.arcade.v1',saved]]),storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};
  assert.equal(readLanguage(storage),'en');assert.equal(writeLanguage(storage,'vi'),true);assert.equal(readLanguage(storage),'vi');
  assert.equal(data.get('twenty.arcade.v1'),saved);assert.equal(data.get(LANGUAGE_KEY),'vi');
  assert.equal(writeLanguage(storage,'fr'),true);assert.equal(readLanguage(storage),'en');
  const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
  assert.equal(readLanguage(blocked),'en');assert.equal(writeLanguage(blocked,'vi'),false);
});

test('personal names stay verbatim even when the name is also a translated UI word',()=>{
  assert.equal(vi('Welcome back, Original.','vi'),'Chào mừng Original trở lại!');
  assert.equal(vi('Happy 20th, Music.','vi'),'Mừng sinh nhật tuổi 20, Music!');
  assert.equal(vi('Original wearing Garden Paws · Orange','vi'),'Original mặc Mèo làm vườn · Mèo cam');
  assert.equal(vi('Music, without a costume.','vi'),'Music với bộ lông tự nhiên.');
});

test('rewards, combos, and changing counters use full Vietnamese phrases without confusing them with costume names',()=>{
  assert.equal(vi('✦ +2 stars · +20 coins','vi'),'✦ +2 sao · +20 xu');
  assert.equal(vi('Sweet cascade · ×3','vi'),'Ghép liên hoàn · ×3');
  assert.equal(vi('5 fish: star not yet collected','vi'),'5 cá: chưa nhận sao');
  assert.equal(vi('2 / 15 lines','vi'),'2 / 15 hàng');
  assert.equal(vi(' Buy & equip · 30 coins ','vi'),' Mua và mặc · 30 xu ');
  assert.equal(vi('✦ +2 stars · +20 coins','en'),'✦ +2 stars · +20 coins');
  assert.equal(vi(25,'vi'),25);
  assert.equal(vi('0 / 1,200','vi'),'0 / 1.200');
  assert.equal(vi('1,200 points','vi'),'1.200 điểm');
  assert.equal(vi('Welcome back, 1,200.','vi'),'Chào mừng 1,200 trở lại!');
});

test('every parameterized phrase has the same placeholders and resolves for real game labels',()=>{
  const samples={name:'Original',outfit:'Garden Paws',breed:'Orange',game:'Cake',section:'Garden Roof',label:'star collected',treat:'coral fish',reason:'A gate caught those little wings.',result:'Victory',shape:'T',count:'2',target:'15',coins:'20',stars:'2',row:'3',column:'4'};
  const nested=new Set(['outfit','breed','label','section','reason','treat','result']);
  for(const [source,target] of PHRASES){
    const keys=text=>[...text.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort();
    assert.deepEqual(keys(source),keys(target),source);
    const english=source.replace(/\{(\w+)\}/g,(_,key)=>samples[key]);
    const expected=MESSAGES[english]||target.replace(/\{(\w+)\}/g,(_,key)=>nested.has(key)?vi(samples[key],'vi'):samples[key]);
    assert.equal(vi(english,'vi'),expected,source);
  }
});

// A small DOM fixture checks restoration and changing text on the same element.
class Element {
  constructor(id='',attrs={}){this.id=id;this.nodeType=1;this.children=[];this.attributes=new Map(Object.entries(attrs));}
  append(...nodes){for(const node of nodes){node.parentElement=this;this.children.push(node);}}
  closest(selector){if((this.id&&selector.includes('#'+this.id))||['data-i18n-ignore','data-i18n-active'].some(attr=>this.attributes.has(attr)&&selector.includes('['+attr+']')))return this;return this.parentElement?.closest(selector)||null;}
  hasAttribute(name){return this.attributes.has(name);}
  getAttribute(name){return this.attributes.get(name);}
  setAttribute(name,value){this.attributes.set(name,value);}
  removeAttribute(name){this.attributes.delete(name);}
  querySelectorAll(){return this.children.filter(n=>n.nodeType===1).flatMap(n=>[n,...n.querySelectorAll()]);}
}
const text=data=>({nodeType:3,data});
const mockDocument={createTreeWalker(root){const nodes=[];const collect=node=>{for(const child of node.children||[]){if(child.nodeType===3)nodes.push(child);else collect(child);}};collect(root);let index=0;return {nextNode:()=>nodes[index++]||null};}};

test('switching back restores exact English and picks up live game changes without replacing elements or names',()=>{
  const root=new Element(),label=new Element('',{'aria-label':'Pause game'}),cat=new Element('cat-name'),counter=new Element();
  const copy=text(' Back to the arcade '),name=text('Original'),score=text('0 / 5 fish');
  label.append(copy);cat.append(name);counter.append(score);root.append(label,cat,counter);
  const translator=new PageTranslator(mockDocument);translator.translate(root,'vi');
  assert.equal(copy.data,' Về khu trò chơi ');assert.equal(name.data,'Original');assert.equal(score.data,'0 / 5 cá');
  assert.equal(label.getAttribute('aria-label'),'Tạm dừng trò chơi');
  score.data='3 / 5 fish';translator.translate(counter,'vi');assert.equal(score.data,'3 / 5 cá');
  translator.translate(root,'en');
  assert.equal(copy.data,' Back to the arcade ');assert.equal(score.data,'3 / 5 fish');assert.equal(name.data,'Original');
  assert.equal(root.children[0],label);assert.equal(label.children[0],copy);assert.equal(label.getAttribute('aria-label'),'Pause game');
});

test('every static player-facing phrase and accessible label has a Vietnamese translation',()=>{
  const unchanged=new Set(['Cake','Candy Cat','Catris','Cat Fishing','Flappy Cat','Rooftop Run','Ragdoll','twenty','Space','WASD','Esc','P','A','D','X','Space:','Z:','← / → or A / D','← / → or A / D:','↑ / X:','↓ / S:']);
  const decode=value=>value.replaceAll('&amp;','&').replaceAll('&#39;',"'").replaceAll('&quot;','"').replaceAll('&lt;','<').replaceAll('&gt;','>');
  const missing=[];
  for(const file of readdirSync(new URL('../dist/',import.meta.url)).filter(name=>name.endsWith('.html'))){
    const source=readFileSync(new URL('../dist/'+file,import.meta.url),'utf8');
    assert.match(source,/src="\.\/i18n\.mjs"/,file+' needs the language switch');
    assert.match(source,/href="\.\/i18n\.css"/,file+' needs language layout styles');
    // Complete passages are checked against their English source below. They
    // deliberately translate as a whole, rather than as isolated text fragments.
    const html=source.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/g,'').replace(/<(p|li|h2)\b[^>]*data-i18n-block="[^"]+"[^>]*>[\s\S]*?<\/\1>/g,'');
    const values=[...html.split(/<[^>]*>/),...[...html.matchAll(/(?:aria-label|title|placeholder)="([^"]+)"/g)].map(m=>m[1])];
    for(const raw of values){const value=decode(raw).trim().replace(/\s+/g,' ');if(/[a-z]/i.test(value)&&!unchanged.has(value)&&vi(value,'vi')===value)missing.push(file+': '+value);}
  }
  assert.deepEqual([...new Set(missing)],[]);
});

test('complete passages retain links and emphasis and restore the original English markup exactly',()=>{
  const element=new Element('',{'data-i18n-block':'candy-rewards-p-1'});
  const original='<a href="./shop.html">Visit the costume shop ↗</a>';
  element.innerHTML=original;
  const translator=new PageTranslator(mockDocument);
  translator.translate(element,'vi');
  assert.equal(element.innerHTML,'<a href="./shop.html">Cửa hàng trang phục ↗</a>');
  assert.equal(element.hasAttribute('data-i18n-active'),true);
  translator.translate(element,'en');assert.equal(element.innerHTML,original);
  assert.equal(element.hasAttribute('data-i18n-active'),false);
  translator.translate(element,'vi');assert.match(element.innerHTML,/cửa hàng trang phục/i);
});

test('each complete translation still matches its source instructions and uses only trusted inline markup',()=>{
  const found=new Set(),plain=value=>value.replace(/<[^>]*>/g,'').replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#39;',"'").normalize('NFC').replace(/\s+/g,' ').trim();
  for(const name of readdirSync(new URL('../dist/',import.meta.url)).filter(name=>name.endsWith('.html'))){
    const html=readFileSync(new URL('../dist/'+name,import.meta.url),'utf8');
    for(const [,tag,id,body] of html.matchAll(/<(p|li|h2)\b[^>]*data-i18n-block="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/g)){
      const copy=BLOCKS[id];assert.ok(copy,name+': '+id);assert.equal(plain(body),copy.source,name+': '+id);found.add(id);
      assert.doesNotMatch(copy.html,/<(?:script|iframe|button|input)\b|\bon\w+\s*=|javascript:/i);
      for(const [,href] of copy.html.matchAll(/href="([^"]+)"/g))assert.equal(href,'./shop.html');
    }
  }
  assert.equal(found.size,Object.keys(BLOCKS).length);assert.ok(found.size>0);
  const catris=Object.values(BLOCKS).filter(block=>block.source.includes('soft drop.'));
  assert.equal(catris.length,1);assert.match(catris[0].html,/rơi nhanh hơn/);
});

// Inspect the actual bundled fonts rather than assuming a font-family name
// implies support: Georgia was missing many of these Vietnamese characters.
function fontHas(font,point){
  let cmap;
  for(let i=0;i<font.readUInt16BE(12);i++){
    const index=44+i*20;if(font.toString('ascii',index,index+4)!=='cmap')continue;
    const offset=font.readUInt32BE(index+4),size=font.readUInt32BE(index+8),original=font.readUInt32BE(index+12);
    const table=font.subarray(offset,offset+size);cmap=size<original?inflateSync(table):table;
  }
  assert.ok(cmap,'font needs a character map');
  for(let i=0;i<cmap.readUInt16BE(2);i++){
    const offset=cmap.readUInt32BE(8+i*8),format=cmap.readUInt16BE(offset);
    if(format===12){for(let group=0;group<cmap.readUInt32BE(offset+12);group++){const p=offset+16+group*12;if(point>=cmap.readUInt32BE(p)&&point<=cmap.readUInt32BE(p+4))return cmap.readUInt32BE(p+8)+point-cmap.readUInt32BE(p)>0;}}
    if(format!==4||point>65535)continue;
    const count=cmap.readUInt16BE(offset+6)/2,end=offset+14,start=end+count*2+2,delta=start+count*2,range=delta+count*2;
    for(let segment=0;segment<count;segment++){
      const first=cmap.readUInt16BE(start+segment*2),last=cmap.readUInt16BE(end+segment*2);
      if(point<first||point>last)continue;
      const shift=cmap.readInt16BE(delta+segment*2),distance=cmap.readUInt16BE(range+segment*2);
      let glyph=distance?cmap.readUInt16BE(range+segment*2+distance+(point-first)*2):(point+shift)&65535;
      if(distance&&glyph)glyph=(glyph+shift)&65535;if(glyph)return true;
    }
  }
  return false;
}
test('every bundled text font contains all Vietnamese vowels, tones, and the crossed d',()=>{
  const letters=Array.from(new Set('ĂăÂâĐđÊêÔôƠơƯưÀÁẢÃẠẰẮẲẴẶẦẤẨẪẬÈÉẺẼẸỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌỒỐỔỖỘỜỚỞỠỢÙÚỦŨỤỪỨỬỮỰỲÝỶỸỴàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ'));
  const files=readdirSync(new URL('../dist/fonts/',import.meta.url)).filter(file=>file.endsWith('.woff'));
  const css=readFileSync(new URL('../dist/i18n.css',import.meta.url),'utf8');
  assert.equal(files.length,5);
  for(const file of files){assert.ok(css.includes('./fonts/'+file),'stylesheet must load '+file);const font=readFileSync(new URL('../dist/fonts/'+file,import.meta.url));assert.equal(font.toString('ascii',0,4),'wOFF');for(const letter of letters)assert.ok(fontHas(font,letter.codePointAt(0)),file+' is missing '+letter);}
});
