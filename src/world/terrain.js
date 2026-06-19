/**
 * terrain.js: Geração procedural + biomas + árvores
 */
import { BlockID } from '../blocks/Block.js';
import { TreeTypes } from '../trees/index.js';

class SimplexNoise {
  constructor(seed=0){this.p=new Uint8Array(256);for(let i=0;i<256;i++)this.p[i]=i;let n=seed;for(let i=255;i>0;i--){n=(n*1103515245+12345)&0x7fffffff;const j=n%(i+1);[this.p[i],this.p[j]]=[this.p[j],this.p[i]];}this.perm=new Uint8Array(512);for(let i=0;i<512;i++)this.perm[i]=this.p[i&255];}
  noise2D(x,y){const F2=0.5*(Math.sqrt(3)-1),G2=(3-Math.sqrt(3))/6,s=(x+y)*F2,i=Math.floor(x+s),j=Math.floor(y+s),t=(i+j)*G2,x0=x-(i-t),y0=y-(j-t),i1=x0>y0?1:0,j1=x0>y0?0:1,x1=x0-i1+G2,y1=y0-j1+G2,x2=x0-1+2*G2,y2=y0-1+2*G2,ii=i&255,jj=j&255;let n0=0,n1=0,n2=0,t0=0.5-x0*x0-y0*y0;if(t0>=0){t0*=t0;const g=this.perm[ii+this.perm[jj]]%12;n0=t0*t0*this.d(g,x0,y0);}let t1=0.5-x1*x1-y1*y1;if(t1>=0){t1*=t1;const g=this.perm[ii+i1+this.perm[jj+j1]]%12;n1=t1*t1*this.d(g,x1,y1);}let t2=0.5-x2*x2-y2*y2;if(t2>=0){t2*=t2;const g=this.perm[ii+1+this.perm[jj+1]]%12;n2=t2*t2*this.d(g,x2,y2);}return 70*(n0+n1+n2);}
  d(gi,x,y){const g=[[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];return g[gi][0]*x+g[gi][1]*y;}
  fbm(x,y,o=4,l=2,gn=0.5){let v=0,a=1,f=1,m=0;for(let i=0;i<o;i++){v+=this.noise2D(x*f,y*f)*a;m+=a;a*=gn;f*=l;}return v/m;}
}

const BIOME = { PLAINS:0, FOREST:1, DESERT:2, SNOW:3 };

export class TerrainGenerator {
  constructor(seed=42) {
    this.noise = new SimplexNoise(seed);
    this.biomeNoise = new SimplexNoise(seed+1000);
    this.treeNoise = new SimplexNoise(seed+2000);
    this.seaLevel = 32;
    this.heightScale = 24;
  }

  getBiome(wx, wz) {
    const t = this.biomeNoise.fbm(wx*0.003, wz*0.003, 3);
    if (t < -0.3) return BIOME.DESERT;
    if (t > 0.35) return BIOME.SNOW;
    if (t > 0.05) return BIOME.FOREST;
    return BIOME.PLAINS;
  }

  getHeight(wx, wz) {
    const b = this.getBiome(wx, wz);
    const sc = b === BIOME.DESERT ? 0.015 : 0.02;
    const n = this.noise.fbm(wx*sc, wz*sc, 5);
    const h = this.noise.noise2D(wx*0.05, wz*0.05) * 0.3;
    let height = this.seaLevel + (n+h) * this.heightScale;
    if (b === BIOME.SNOW) height += 8;
    if (b === BIOME.DESERT) height = height * 0.7 + 5;
    return Math.floor(height);
  }

  getBlockAt(wx, wy, wz, gh, biome) {
    if (wy === 0) return BlockID.BEDROCK;
    if (wy < gh - 4) return BlockID.STONE;
    if (wy < gh) return BlockID.DIRT;
    if (wy === gh) {
      switch (biome) {
        case BIOME.DESERT: return BlockID.SAND;
        case BIOME.SNOW: return BlockID.SNOW;
        default: return wy <= this.seaLevel + 1 ? BlockID.SAND : BlockID.GRASS;
      }
    }
    if (wy <= this.seaLevel && wy > gh) return BlockID.WATER;
    return BlockID.AIR;
  }

  generateChunk(chunk) {
    const bx = chunk.chunkX * 16, bz = chunk.chunkZ * 16;
    for (let lx=0;lx<16;lx++) for (let lz=0;lz<16;lz++) {
      const wx=bx+lx, wz=bz+lz, h=this.getHeight(wx,wz), b=this.getBiome(wx,wz);
      for (let y=0;y<256;y++) { const bl=this.getBlockAt(wx,y,wz,h,b); if(bl!==BlockID.AIR) chunk.setBlock(lx,y,lz,bl); }
    }
    // Árvores
    for (let lx=2;lx<14;lx++) for (let lz=2;lz<14;lz++) {
      const wx=bx+lx, wz=bz+lz, h=this.getHeight(wx,wz), b=this.getBiome(wx,wz);
      if (h <= this.seaLevel+1) continue;
      let types = [];
      switch(b){
        case BIOME.DESERT: types=[TreeTypes[4]]; break;
        case BIOME.SNOW: types=[TreeTypes[1]]; break;
        case BIOME.FOREST: types=[TreeTypes[0],TreeTypes[1],TreeTypes[2]]; break;
        default: types=[TreeTypes[0],TreeTypes[3]]; break;
      }
      for (const T of types) {
        const ts = this.treeNoise.noise2D(wx*0.7, wz*0.7);
        if (((ts+1)/2) < T.chance && h >= T.minGround) { T.place(chunk, lx, h+1, lz); break; }
      }
    }
  }
}

export { BIOME };
