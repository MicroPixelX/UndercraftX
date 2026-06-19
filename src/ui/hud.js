/**
 * hud.js: FPS + posição + bioma + seed
 */
export class HUD {
  constructor(){this.el=document.getElementById('hud');this.fps=0;this.fc=0;this.lt=performance.now();this.seed=0;}
  setSeed(s){this.seed=s;}
  update(pos,chunk,biome=''){
    this.fc++;const n=performance.now();
    if(n-this.lt>=1000){this.fps=this.fc;this.fc=0;this.lt=n;}
    this.el.innerHTML=`<div>FPS: ${this.fps}</div><div>X:${Math.floor(pos.x)} Y:${Math.floor(pos.y)} Z:${Math.floor(pos.z)}</div><div>Chunk: ${chunk.x},${chunk.z}</div>${biome?`<div>Bioma: ${biome}</div>`:''}<div>Seed: ${this.seed}</div>`;
  }
  hide(){this.el.style.display='none';}
  show(){this.el.style.display='block';}
}
