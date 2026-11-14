// Original compositions for Twenty. Each string is one bar: note:beats, R = rest.
// These scores are rendered locally; no samples or third-party music are used.
export const SCORES = [
  {
    id:'snake', file:'cake', title:'Whisker Waltz', bpm:110, meter:3, lead:'marimba', groove:'waltz',
    chords:['C4 E4 G4','A3 C4 E4','F3 A3 C4','G3 B3 D4','C4 E4 G4','A3 C4 E4','D4 F4 A4','G3 B3 D4','F3 A3 C4','G3 B3 D4','E4 G4 B4','A3 C4 E4','F3 A3 C4','C4 E4 G4','G3 B3 D4','G3 B3 D4'],
    melody:[
      'E5:.5 G5:.5 C6:.75 B5:.25 G5:.5 E5:.5','A5:.5 G5:.5 E5:1 D5:.5 C5:.5',
      'A4:.5 C5:.5 F5:1 E5:.5 C5:.5','D5:.5 G5:.5 B5:.5 A5:.5 G5:1',
      'G5:.5 E5:.5 C5:.5 E5:.5 G5:.5 C6:.5','B5:.5 A5:.5 G5:.5 E5:.5 C5:1',
      'D5:.5 F5:.5 A5:.75 G5:.25 F5:.5 D5:.5','B4:.5 D5:.5 G5:1 R:.5 D5:.5',
      'C6:1 A5:.5 G5:.5 F5:.5 A5:.5','B5:.5 A5:.5 G5:1 D5:1',
      'G5:.5 B5:.5 E6:.5 D6:.5 B5:.5 G5:.5','A5:1 E5:.5 G5:.5 A5:.5 C6:.5',
      'A5:.5 F5:.5 C5:.5 F5:.5 A5:1','G5:.5 E5:.5 C5:1 E5:.5 G5:.5',
      'A5:.5 G5:.5 F5:.5 D5:.5 B4:.5 D5:.5','G5:1 D5:.5 B4:.5 R:1',
    ],
  },
  {
    id:'flappy', file:'flappy', title:'Cloud Paws', bpm:122, meter:4, lead:'flute', groove:'air',
    chords:['D4 F#4 A4','B3 D4 F#4','G3 B3 D4','A3 C#4 E4','D4 F#4 A4','B3 D4 F#4','G3 B3 D4','A3 C#4 E4','G3 B3 D4','D4 F#4 A4','E4 G4 B4','A3 C#4 E4','B3 D4 F#4','G3 B3 D4','A3 C#4 E4','A3 C#4 E4'],
    melody:[
      'F#5:1 A5:.5 B5:.5 A5:1 R:.5 F#5:.5','D5:.5 F#5:.5 B5:1 A5:.5 F#5:.5 D5:1',
      'G5:1 B5:.5 A5:.5 G5:.5 F#5:.5 D5:1','E5:.5 A5:.5 C#6:1 B5:.5 A5:.5 E5:1',
      'A5:.5 F#5:.5 D5:.5 F#5:.5 A5:1 D6:1','C#6:.5 B5:.5 F#5:1 A5:.5 F#5:.5 D5:1',
      'B5:1 A5:.5 G5:.5 F#5:1 E5:.5 D5:.5','C#5:.5 E5:.5 A5:1 R:1 E5:1',
      'D6:1 B5:.5 A5:.5 G5:1 B5:1','A5:.5 F#5:.5 E5:.5 D5:.5 F#5:1 A5:1',
      'G5:.5 B5:.5 E6:1 D6:.5 B5:.5 G5:1','C#6:1 B5:.5 A5:.5 E5:1 R:1',
      'F#5:.5 B5:.5 D6:1 C#6:.5 B5:.5 A5:1','G5:1 D5:.5 G5:.5 B5:.5 A5:.5 G5:1',
      'E5:.5 A5:.5 B5:.5 C#6:.5 B5:.5 A5:.5 E5:1','C#5:1 E5:1 A5:1 R:1',
    ],
  },
  {
    id:'mining', file:'fishing', title:'Moonlit Pond', bpm:78, meter:4, lead:'keys', groove:'pond',
    chords:['G3 B3 D4 F#4','E4 G4 B4 D5','A3 C4 E4 G4','D4 F#4 A4 C5','G3 B3 D4 F#4','E4 G4 B4 D5','C4 E4 G4 B4','D4 F#4 A4 C5','B3 D4 F#4 A4','E4 G4 B4 D5','A3 C4 E4 G4','D4 F#4 A4 C5','C4 E4 G4 B4','G3 B3 D4 F#4','A3 C4 E4 G4','D4 F#4 A4 C5'],
    melody:[
      'R:.5 B4:1 A4:.5 G4:1 D5:1','B4:1 G4:.5 E4:.5 R:.5 G4:.5 B4:1',
      'C5:1 B4:.5 A4:.5 G4:1 E4:1','F#4:.5 A4:.5 C5:1 A4:1 R:1',
      'D5:1 B4:.5 A4:.5 G4:1 R:.5 A4:.5','B4:.5 D5:.5 E5:1 D5:.5 B4:.5 G4:1',
      'E5:1 D5:.5 B4:.5 G4:1 E4:1','F#4:1 A4:.5 C5:.5 D5:1 R:1',
      'F#5:1 D5:.5 B4:.5 A4:1 F#4:1','G4:.5 B4:.5 D5:1 E5:1 R:1',
      'E5:1 C5:.5 B4:.5 A4:1 G4:1','F#4:.5 A4:.5 D5:1 C5:.5 A4:.5 F#4:1',
      'E4:1 G4:.5 B4:.5 D5:1 C5:1','B4:1 A4:.5 G4:.5 D5:1 B4:1',
      'A4:1 C5:.5 B4:.5 G4:1 E4:1','F#4:1 A4:1 R:2',
    ],
  },
  {
    id:'platformer', file:'rooftop', title:'Lantern Rooftops', bpm:128, meter:4, lead:'pulse', groove:'run',
    chords:['A3 C4 E4','F3 A3 C4','C4 E4 G4','G3 B3 D4','A3 C4 E4','F3 A3 C4','D4 F4 A4','E4 G#4 B4','F3 A3 C4','G3 B3 D4','A3 C4 E4','A3 C4 E4','F3 A3 C4','C4 E4 G4','G3 B3 D4','E4 G#4 B4'],
    melody:[
      'A4:.5 C5:.5 E5:.5 A5:.5 G5:.5 E5:.5 C5:1','F5:.5 E5:.5 C5:.5 A4:.5 C5:1 F5:1',
      'E5:.5 G5:.5 C6:1 B5:.5 G5:.5 E5:1','D5:.5 G5:.5 B5:.5 A5:.5 G5:1 R:1',
      'A5:.75 E5:.25 C5:.5 E5:.5 G5:.5 A5:.5 C6:1','A5:.5 G5:.5 F5:.5 E5:.5 C5:.5 A4:.5 F4:1',
      'D5:.5 F5:.5 A5:.5 C6:.5 A5:1 F5:1','G#5:.5 E5:.5 B4:.5 E5:.5 G#5:.5 B5:.5 E6:1',
      'C6:.5 A5:.5 F5:1 A5:.5 C6:.5 A5:1','B5:.5 A5:.5 G5:.5 D5:.5 G5:1 B5:1',
      'C6:1 B5:.5 A5:.5 G5:.5 E5:.5 C5:1','A4:.5 C5:.5 E5:.5 G5:.5 A5:1 R:1',
      'F5:.5 A5:.5 C6:.5 A5:.5 G5:.5 F5:.5 E5:1','G5:.5 E5:.5 C5:.5 G4:.5 C5:1 E5:1',
      'D5:.5 G5:.5 B5:1 A5:.5 G5:.5 D5:1','B4:.5 E5:.5 G#5:1 E5:1 R:1',
    ],
  },
  {
    id:'slingshot', file:'candy', title:'Sugar Paw Parade', bpm:106, meter:4, lead:'bell', groove:'sweet',
    chords:['F4 A4 C5','D4 F4 A4','G3 Bb3 D4','C4 E4 G4','F4 A4 C5','D4 F4 A4','Bb3 D4 F4','C4 E4 G4','A3 C4 E4','D4 F4 A4','G3 Bb3 D4','C4 E4 G4','Bb3 D4 F4','F4 A4 C5','G3 Bb3 D4','C4 E4 G4'],
    melody:[
      'A5:.5 C6:.5 A5:.5 G5:.5 F5:1 R:1','F5:.5 A5:.5 D6:1 C6:.5 A5:.5 F5:1',
      'G5:.5 Bb5:.5 A5:.5 G5:.5 F5:.5 D5:.5 G5:1','E5:.5 G5:.5 C6:1 Bb5:.5 G5:.5 E5:1',
      'C6:.5 A5:.5 F5:.5 A5:.5 C6:.5 D6:.5 C6:1','A5:1 F5:.5 E5:.5 D5:1 R:1',
      'D5:.5 F5:.5 Bb5:1 A5:.5 F5:.5 D5:1','E5:.5 G5:.5 Bb5:.5 C6:.5 G5:1 R:1',
      'E5:.5 A5:.5 C6:1 B5:.5 A5:.5 E5:1','F5:.5 A5:.5 D6:.75 C6:.25 A5:1 F5:1',
      'Bb5:1 A5:.5 G5:.5 F5:.5 D5:.5 G5:1','G5:.5 E5:.5 C5:.5 E5:.5 G5:1 C6:1',
      'D6:.5 C6:.5 Bb5:1 A5:.5 F5:.5 D5:1','C6:.5 A5:.5 F5:1 G5:.5 A5:.5 C6:1',
      'Bb5:.5 A5:.5 G5:.5 F5:.5 D5:1 G5:1','E5:1 G5:1 C6:1 R:1',
    ],
  },
  {
    id:'tetris', file:'catris', title:'Neon Yarn', bpm:116, meter:4, lead:'triangle', groove:'stack',
    chords:['D4 F4 A4','Bb3 D4 F4','G3 Bb3 D4','A3 C4 E4','D4 F4 A4','C4 E4 G4','Bb3 D4 F4','A3 C#4 E4','F4 A4 C5','C4 E4 G4','G3 Bb3 D4','A3 C#4 E4','Bb3 D4 F4','G3 Bb3 D4','A3 C#4 E4','A3 C#4 E4'],
    melody:[
      'D5:.5 A5:.5 F5:.5 E5:.5 D5:1 R:1','F5:.5 D5:.5 Bb4:1 D5:.5 F5:.5 A5:1',
      'G5:1 D5:.5 F5:.5 Bb5:.5 A5:.5 G5:1','E5:.5 A5:.5 C6:.5 B5:.5 A5:1 R:1',
      'F5:.5 A5:.5 D6:1 C6:.5 A5:.5 F5:1','E5:.5 G5:.5 C6:.5 G5:.5 E5:1 D5:1',
      'D5:.5 F5:.5 Bb5:1 A5:.5 F5:.5 D5:1','C#5:.5 E5:.5 A5:1 G5:.5 E5:.5 C#5:1',
      'A5:1 C6:.5 A5:.5 F5:.5 E5:.5 F5:1','G5:.5 E5:.5 C5:.5 E5:.5 G5:1 C6:1',
      'Bb5:.5 A5:.5 G5:1 D5:.5 F5:.5 G5:1','A5:1 G5:.5 E5:.5 C#5:1 R:1',
      'F5:.5 D5:.5 Bb4:.5 D5:.5 F5:1 Bb5:1','G5:.5 F5:.5 D5:.5 Bb4:.5 D5:1 G5:1',
      'E5:.5 A5:.5 C#6:1 B5:.5 A5:.5 G5:1','E5:1 C#5:1 A4:1 R:1',
    ],
  },
];

const pitch={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
export function midi(note){const match=note.match(/^([A-G])([#b]?)(\d)$/);if(!match)throw Error('Invalid note: '+note);return (Number(match[3])+1)*12+pitch[match[1]]+(match[2]==='#'?1:match[2]==='b'?-1:0);}
export function scoreEvents(score){
  const events=[],add=(beat,length,note,instrument,volume)=>events.push({beat,length,note:typeof note==='string'?midi(note):note,instrument,volume});
  score.melody.forEach((bar,index)=>{
    let beat=index*score.meter;
    for(const token of bar.split(' ')){const [note,duration]=token.split(':'),length=Number(duration);if(note!=='R')add(beat,length*.86,note,score.lead,score.lead==='pulse'?.043:.064);beat+=length;}
    if(Math.abs(beat-(index+1)*score.meter)>.001)throw Error(score.id+' bar '+(index+1)+' has the wrong length');
    const chord=score.chords[index].split(' ').map(midi),root=chord[0]-12,base=index*score.meter;
    if(score.groove==='waltz'){
      add(base,.8,root,'bass',.075);
      for(const at of [1,2]){for(const note of chord)add(base+at,.40,note,'pluck',.014);add(base+at,.08,0,'rim',.017);}
    }else{
      const slow=score.groove==='pond';
      for(const note of chord)add(base+.03,score.meter-.25,note,'pad',slow?.017:.011);
      for(const at of slow?[0,2.5]:[0,1.5,2,3.5])add(base+at,slow?1:.43,at===1.5||at===3.5?chord[2]-12:root,'bass',slow?.06:.073);
      const arp=score.groove==='stack'?[0,.5,1,1.5,2,2.5,3,3.5]:slow?[.5,2.5]:[.5,1.5,2.5,3.5];
      arp.forEach((at,i)=>add(base+at,.28,chord[(i+(index%2))%chord.length]+(slow?0:12),'pluck',slow?.012:.018));
      for(const at of slow?[0]:[0,2])add(base+at,.22,0,'kick',slow?.035:.065);
      for(const at of [1,3])add(base+at,.13,0,score.groove==='run'?'snare':'rim',score.groove==='run'?.038:.023);
      for(let step=0;step<8;step++)add(base+step*.5+(slow&&step%2?.06:0),.045,0,'hat',slow?.007:.012);
    }
  });
  return events;
}
