export const TREATS = Object.freeze([
  {name:'Coral fish',color:'#c07e67',dark:'#865642',light:'#edc3a2'},
  {name:'Sage paw',color:'#91aa77',dark:'#5c7650',light:'#c9d9ae'},
  {name:'Rose heart',color:'#be8394',dark:'#87576c',light:'#edbeca'},
  {name:'Blue milk',color:'#80a9b5',dark:'#506e83',light:'#bddbe0'},
  {name:'Lavender bow',color:'#a398bc',dark:'#6d628a',light:'#d2c8e3'},
  {name:'Honey bell',color:'#c3a35f',dark:'#8e7340',light:'#ebd399'},
]);

export function drawTreat(context,treat,size=64){
  context.clearRect(0,0,size,size);if(!treat)return;
  context.imageSmoothingEnabled=false;context.save();context.scale(size/20,size/20);
  const p=TREATS[treat.color],rect=(x,y,w,h,color)=>{context.fillStyle=color;context.fillRect(x,y,w,h);};
  if(treat.special==='rainbow'){
    rect(5,2,10,1,'#695e79');rect(3,4,14,12,'#695e79');rect(2,6,16,8,'#695e79');rect(5,17,10,1,'#695e79');
    TREATS.forEach((color,i)=>rect(4+i*2,5,2,10,color.color));rect(6,4,8,2,'#eee4d0');rect(5,6,2,3,'#faf1da');
    rect(9,8,2,5,'#f5e9d2');rect(7,10,6,2,'#f5e9d2');
  }else if(treat.color===0){
    rect(6,5,9,1,p.dark);rect(4,6,13,8,p.dark);rect(6,14,9,1,p.dark);rect(1,5,2,10,p.dark);rect(3,7,2,6,p.dark);
    rect(6,6,9,8,p.color);rect(5,8,11,4,p.color);rect(2,7,2,6,p.color);rect(8,7,4,2,p.light);rect(14,9,1,2,p.dark);rect(9,3,3,3,p.dark);
  }else if(treat.color===1){
    for(const [x,y]of[[3,5],[7,2],[12,2],[16,5]]){rect(x-1,y,3,5,p.dark);rect(x,y,1,3,p.light);}
    rect(6,10,8,7,p.dark);rect(4,12,12,4,p.dark);rect(7,9,6,1,p.dark);rect(6,12,8,4,p.color);rect(8,11,4,1,p.light);
  }else if(treat.color===2){
    for(const [x,y,w]of[[3,4,5],[12,4,5],[2,5,16],[2,6,16],[3,12,14],[5,14,10],[7,16,6],[9,18,2]])rect(x,y,w,y===6?6:2,p.dark);
    rect(4,6,4,6,p.color);rect(12,6,4,6,p.color);rect(8,7,4,9,p.color);rect(6,12,8,2,p.color);rect(4,6,3,2,p.light);rect(5,8,1,2,p.light);
  }else if(treat.color===3){
    rect(6,2,8,2,p.dark);rect(4,4,12,14,p.dark);rect(6,3,7,2,p.light);rect(5,6,10,11,p.color);rect(5,5,10,2,p.light);rect(6,8,8,7,'#e0ded0');
    rect(8,10,4,3,p.color);rect(8,9,1,1,p.color);rect(11,9,1,1,p.color);rect(7,15,6,1,p.light);
  }else if(treat.color===4){
    rect(2,4,4,12,p.dark);rect(6,6,3,8,p.dark);rect(14,4,4,12,p.dark);rect(11,6,3,8,p.dark);rect(8,7,4,6,p.dark);
    rect(3,6,2,8,p.color);rect(5,8,3,4,p.color);rect(15,6,2,8,p.color);rect(12,8,3,4,p.color);rect(9,8,2,4,p.light);rect(3,6,1,3,p.light);rect(15,6,1,3,p.light);
  }else{
    rect(9,2,2,2,p.dark);rect(6,4,8,2,p.dark);rect(5,6,10,8,p.dark);rect(3,13,14,3,p.dark);rect(8,16,4,2,p.dark);
    rect(6,6,8,7,p.color);rect(5,13,10,2,p.color);rect(7,6,2,5,p.light);rect(9,16,2,1,p.light);
  }
  if(treat.special==='row'||treat.special==='column'){
    rect(12,13,7,6,p.dark);rect(13,14,5,4,'#f4ead6');
    if(treat.special==='row'){rect(13,14,5,1,p.color);rect(13,17,5,1,p.color);}else{rect(13,14,1,4,p.color);rect(17,14,1,4,p.color);}
  }else if(treat.special==='wrapped'){
    rect(1,16,5,3,p.dark);rect(2,15,3,5,p.dark);rect(2,16,3,3,p.light);rect(3,15,1,5,p.color);rect(1,17,5,1,p.color);
  }
  context.restore();
}

export function treatLabel(treat){
  if(treat.special==='rainbow')return 'Rainbow treat';
  const special=({row:'Row striped ',column:'Column striped ',wrapped:'Wrapped '})[treat.special]||'';
  return special+TREATS[treat.color].name.toLowerCase();
}
