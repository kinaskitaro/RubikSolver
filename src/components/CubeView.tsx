import React from 'react';

const colorMap: Record<string,string> = {
  W: '#ffffff', // white
  R: '#ff0000', // red
  G: '#00ff00', // green
  Y: '#ffff00', // yellow
  O: '#ffa500', // orange
  B: '#0000ff', // blue
};

export interface CubeViewProps {
  state: string; // 54-char color string in URFDLB order
}

const faceOrder: string[] = ['U','R','F','D','L','B'];
const FACE_START: Record<string,number> = { U:0,R:9,F:18,D:27,L:36,B:45 };

export const CubeView: React.FC<CubeViewProps> = ({state}) => {
  return (
    <div style={{display:'flex', flexWrap:'wrap', width:'210px'}}>
      {faceOrder.map(face=>{
        const start = FACE_START[face];
        const facelets = state.slice(start,start+9).split('');
        return (
          <div key={face} style={{display:'grid', gridTemplateColumns:'repeat(3,20px)', margin: '2px'}}>
            {facelets.map((c,i)=>(
              <div key={i} style={{width:'20px',height:'20px',backgroundColor:colorMap[c],border:'1px solid #000'}}/>
            ))}
          </div>
        );
      })}
    </div>
  );
};