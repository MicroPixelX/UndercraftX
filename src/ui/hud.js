/**
 * hud.js: FPS + posição + bioma
 */
export class HUD {
  constructor(){this.el=document.getElementById('hud');this.fps=0;this.fc=0;this.lt=performance.now();}
  update(pos,chunk,biome=''){
    this.fc++;const n=performance.now();
    if(n-this.lt>=1000){this.fps=this.fc;this.fc=0;this.lt=n;}
    this.el.innerHTML=`<div>FPS: ${this.fps}</div><div>X:${Math.floor(pos.x)} Y:${Math.floor(pos.y)} Z:${Math.floor(pos.z)}</div><div>Chunk: ${chunk.x},${chunk.z}</div>${biome?`<div>Bioma: ${biome}</div>`:''}`;
  }
  hide(){this.el.style.display='none';}
  show(){this.el.style.display='block';}
}
