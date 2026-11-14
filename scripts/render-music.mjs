import {mkdirSync,writeFileSync,readdirSync,unlinkSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {SCORES,scoreEvents} from './music-scores.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),output=path.join(root,'dist','audio');
const sampleRate=22050,tau=Math.PI*2;
mkdirSync(output,{recursive:true});
export function synthesize(score){
  const beatSeconds=60/score.bpm,frames=Math.round(score.melody.length*score.meter*beatSeconds*sampleRate);
  const dry=new Float64Array(frames);let seed=score.bpm*719;
  const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return (seed>>>0)/2147483648-1;};
  for(const event of scoreEvents(score)){
    const start=Math.round(event.beat*beatSeconds*sampleRate),duration=event.length*beatSeconds,release=event.instrument==='pad'?.30:event.instrument==='bell'?.38:.085;
    const length=Math.ceil((duration+release)*sampleRate),frequency=440*2**((event.note-69)/12);
    let previousNoise=0;
    for(let j=0;j<length;j++){
      const t=j/sampleRate,phase=tau*frequency*t,tail=Math.min(1,Math.max(0,(duration+release-t)/release));let wave=0,envelope=1;
      switch(event.instrument){
        case 'bass':wave=(Math.sin(phase)+.22*Math.sin(phase*2))/.99;envelope=Math.min(1,t/.009)*Math.exp(-t*2.6)*tail;break;
        case 'pad':wave=(Math.sin(phase)+.16*Math.sin(phase*2)+.07*Math.sin(phase*3))/1.23;envelope=Math.min(1,t/.11)*tail*.73;break;
        case 'pulse':wave=(Math.sin(phase)+Math.sin(phase*3)/3+Math.sin(phase*5)/5)/1.53;envelope=Math.min(1,t/.008)*(.35+.65*Math.exp(-t*5))*tail;break;
        case 'triangle':wave=(Math.sin(phase)-Math.sin(phase*3)/9+Math.sin(phase*5)/25)/1.15;envelope=Math.min(1,t/.012)*(.4+.6*Math.exp(-t*4))*tail;break;
        case 'flute':wave=Math.sin(phase+.018*Math.sin(tau*5*t))+.12*Math.sin(phase*2);envelope=Math.min(1,t/.025)*(.7+.3*Math.exp(-t*3))*tail;break;
        case 'bell':wave=(Math.sin(phase)+.42*Math.sin(phase*2.002)*Math.exp(-t*7)+.16*Math.sin(phase*3.99)*Math.exp(-t*12))/1.58;envelope=Math.min(1,t/.004)*Math.exp(-t*3.8)*tail;break;
        case 'marimba':wave=(Math.sin(phase)+.4*Math.sin(phase*4.001)*Math.exp(-t*15))/1.4;envelope=Math.min(1,t/.004)*Math.exp(-t*5.6)*tail;break;
        case 'keys':wave=(Math.sin(phase)+.23*Math.sin(phase*2)+.12*Math.sin(phase*3)*Math.exp(-t*4))/1.35;envelope=Math.min(1,t/.008)*Math.exp(-t*2.8)*tail;break;
        case 'pluck':wave=(Math.sin(phase)+.23*Math.sin(phase*2))/1.23;envelope=Math.min(1,t/.006)*Math.exp(-t*9)*tail;break;
        case 'kick':wave=Math.sin(tau*(47*t+83*.035*(1-Math.exp(-t/.035))));envelope=Math.min(1,t/.003)*Math.exp(-t*22)*tail;break;
        case 'hat':{const n=noise();wave=(n-previousNoise)*.55;previousNoise=n;envelope=Math.min(1,t/.001)*Math.exp(-t*110)*tail;break;}
        case 'snare':wave=.75*noise()+.25*Math.sin(tau*185*t);envelope=Math.min(1,t/.002)*Math.exp(-t*29)*tail;break;
        case 'rim':wave=.7*Math.sin(tau*1550*t)+.3*Math.sin(tau*2270*t);envelope=Math.min(1,t/.001)*Math.exp(-t*70)*tail;break;
        default:throw Error(event.instrument);
      }
      dry[(start+j)%frames]+=wave*envelope*event.volume;
    }
  }
  // Circular delay retains the previous phrase's tails at the loop boundary.
  const mixed=new Float64Array(frames),delay=Math.round(beatSeconds*.75*sampleRate),room=Math.round(.071*sampleRate);
  let sum=0;
  for(let i=0;i<frames;i++){const value=dry[i]+.13*dry[(i-delay+frames)%frames]+.07*dry[(i-room+frames)%frames];mixed[i]=value;sum+=value*value;}
  const gain=.105/Math.sqrt(sum/frames),pcm=new Int16Array(frames);let peak=0,power=0;
  for(let i=0;i<frames;i++){const value=.34*Math.tanh(mixed[i]*gain/.34);pcm[i]=Math.round(value*32767);peak=Math.max(peak,Math.abs(value));power+=value*value;}
  const wav=Buffer.alloc(44+frames*2);
  wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(sampleRate,24);wav.writeUInt32LE(sampleRate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(frames*2,40);
  for(let i=0;i<frames;i++)wav.writeInt16LE(pcm[i],44+i*2);
  return {wav,pcm,duration:frames/sampleRate,peak,rms:Math.sqrt(power/frames),seam:Math.abs(pcm[0]-pcm[frames-1])/32768};
}

const catalog={},keep=new Set(),renders=[];
for(const score of SCORES){
  const render=synthesize(score),hash=createHash('sha256').update(render.wav).digest('hex').slice(0,10),file=score.file+'-'+hash+'.wav';
  writeFileSync(path.join(output,file),render.wav);keep.add(file);
  catalog[score.id]={title:score.title,bpm:score.bpm,meter:score.meter,bars:score.melody.length,duration:render.duration,src:'./audio/'+file};
  renders.push({id:score.id,title:score.title,bpm:score.bpm,duration:+render.duration.toFixed(2),peak:+render.peak.toFixed(4),rms:+render.rms.toFixed(4),seam:+render.seam.toFixed(5),bytes:render.wav.length});
}
for(const file of readdirSync(output))if(/^(cake|flappy|fishing|rooftop|candy|catris)-[a-f0-9]{10}\.wav$/.test(file)&&!keep.has(file))unlinkSync(path.join(output,file));
writeFileSync(path.join(root,'dist','music-tracks.mjs'),'// Generated by scripts/render-music.mjs from the original scores.\nexport const MUSIC_TRACKS = Object.freeze('+JSON.stringify(catalog,null,2)+');\n');
writeFileSync(path.join(output,'README.md'),'# Twenty original soundtracks\n\nSix original sixteen-bar loops, composed for this project. No external songs or samples are used. The WAV files contain layered synthesized instruments and circular reverb tails for continuous playback.\n\nEdit `scripts/music-scores.mjs` and run `node scripts/render-music.mjs` to regenerate the tracks and their content-hashed filenames. Music loads only when enabled, one game at a time.\n\n'+renders.map(r=>'- '+r.title+': '+r.bpm+' BPM, '+r.duration+' seconds.').join('\n')+'\n');
console.log(JSON.stringify(renders,null,2));
