import {readFileSync,writeFileSync} from 'node:fs';
import {MUSIC_TRACKS} from '../dist/music-tracks.mjs';

// A short comparison reel, in arcade order. The game files remain full loops.
const output=process.argv[2];
if(!output)throw Error('Choose an output WAV path.');
const rate=22050,seconds=8,gap=.45,parts=[];
for(const id of ['snake','flappy','mining','platformer','slingshot','tetris']){
  const wav=readFileSync(new URL('../dist/'+MUSIC_TRACKS[id].src.slice(2),import.meta.url));
  const frames=Math.round(rate*seconds),part=Buffer.alloc(Math.round(rate*(seconds+gap))*2);
  for(let i=0;i<frames;i++){
    const fade=Math.min(1,i/(rate*.06),(frames-1-i)/(rate*.35));
    part.writeInt16LE(Math.round(wav.readInt16LE(44+i*2)*fade),i*2);
  }
  parts.push(part);
}
const pcm=Buffer.concat(parts),header=Buffer.alloc(44);
header.write('RIFF',0);header.writeUInt32LE(pcm.length+36,4);header.write('WAVEfmt ',8);
header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);
header.writeUInt32LE(rate,24);header.writeUInt32LE(rate*2,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);
header.write('data',36);header.writeUInt32LE(pcm.length,40);
writeFileSync(output,Buffer.concat([header,pcm]));
console.log('Saved six-theme preview: '+output);
