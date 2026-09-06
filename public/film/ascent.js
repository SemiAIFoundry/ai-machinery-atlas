
function buildAscentEarly(K){
  const {T,C}=K, tau=Math.PI*2;
  const wave=(r,c,s=1)=>Math.sin(r*1.37+c*.83+s)*Math.cos(c*.61-r*.23+s);
  const txt=(g,s,p,size=.65,col=C.ice)=>K.text(g,s,p,{size,color:col});
  const residual=(g,a,b)=>K.flow(g,[a,[a[0],a[1]+3,a[2]],[b[0],b[1]+3,b[2]],b],{color:C.violet,count:3,speed:.1});
  const flow=(g,points,n=3,color=C.amber,speed=.13)=>K.flow(g,points,{color,count:n,speed,radius:.025,phase:K.rand()});
  const bracket=(g,p,w,h,color=C.dim)=>K.line(g,[[p[0]-w/2,p[1]+h/2,p[2]],[p[0]-w/2-.3,p[1]+h/2,p[2]],[p[0]-w/2-.3,p[1]-h/2,p[2]],[p[0]-w/2,p[1]-h/2,p[2]]],color,.8);

  // Corpus fragments become token IDs; a shared embedding table maps IDs to vectors.
  {
    const g=K.chapter(0), corpus=new T.Group();g.add(corpus);
    const fragments=[];
    for(let page=0;page<52;page++){
      const x=(page%13-6)*4.4,y=(Math.floor(page/13)-1.5)*10.2,z=-17-K.rand(0,26);
      for(let row=0;row<17;row++)for(let word=0;word<6;word++){
        const len=K.rand(.22,.63);
        fragments.push({p:[x+word*.57-1.45,y-row*.33+2.8,z],s:[len,.105,.075],c:row===page%17?C.cyan:C.dim});
      }
    }
    K.instances(corpus,fragments,C.dim,.8);
    const tok=['The','answer','begins','with','a','…'],ids=[1,7,13,19,25,31];
    for(let i=0;i<6;i++){
      txt(g,tok[i],[-15+i*4.7,10.4,12],1.05,i===5?C.amber:C.ice);
      txt(g,String(ids[i]),[-15+i*4.7,8.6,12],.5,C.cyan);
      flow(g,[[-15+i*4.7,7.8,12],[-15+i*4.7,5,8],[-9+i*.95,3.2,4]],2,C.amber,.075);
    }
    txt(g,'ILLUSTRATIVE TOKEN IDS',[-3.2,13,12],.63,C.cyan);
    const table=K.matrix(g,{rows:38,cols:16,pos:[16,0,-4],cell:.51,depth:.32,signed:true,values:(r,c)=>wave(r,c,2)});
    txt(g,'EMBEDDING TABLE',[16,11,-4],.8,C.ice);
    txt(g,'vocabulary × hidden width',[16,-10.8,-4],.6,C.cyan);
    const emb=K.matrix(g,{rows:6,cols:8,pos:[-6,0,4],cell:1.12,depth:.35,signed:true,values:(r,c)=>wave(ids[r]%38,c,2)});
    txt(g,'ONE VECTOR PER TOKEN',[-6,-4.6,4],.72,C.ice);
    txt(g,'6 × 8 sampled coordinates',[-6,-6,4],.55,C.cyan);
    for(let i=0;i<6;i++){
      const row=ids[i]%38, yy=-(row-18.5)*.51;
      K.line(g,[[11.8,yy,-3.5],[20.2,yy,-3.5]],C.amber,.48);
      flow(g,[[11.7,yy,-3.6],[5,yy*.35,2],[-1.6,(2.5-i)*1.12,4]],3,C.amber,.075+i*.01);
    }
    // A training stream is represented by thousands of discrete tokens, not an orb.
    const stream=[];
    for(let i=0;i<1500;i++){
      const t=i/1500,x=-31+62*t,y=-15+2*Math.sin(t*9),z=-3+8*Math.cos(t*5);
      stream.push({p:[x+K.rand(-.12,.12),y+K.rand(-1.5,1.5),z+K.rand(-1.7,1.7)],s:[.09,.12,.22],c:i%9===0?C.amber:C.cyan});
    }
    K.instances(g,stream,C.cyan,.72);
    txt(g,'REPEATED NEXT-TOKEN EXAMPLES',[0,-18,-1],.7,C.ice);
    K.label(g,'Text → token IDs → embedding vectors',[-4,3,6],{from:0,to:.34});
    K.label(g,'A lookup selects learned numerical coordinates',[16,1,-2],{from:.34,to:.66});
    K.label(g,'A small sample of an enormous training stream',[0,-11,0],{from:.66,to:1});
    K.poses(0,[{eye:[-7,8,38],target:[-3,2,3]},{eye:[26,6,24],target:[9,0,-1]},{eye:[33,24,52],target:[0,-1,-10]}]);
  }

  // Complete toy attention calculation, with explicit shapes and value transport.
  {
    const g=K.chapter(1), X=[];for(let r=0;r<6;r++)for(let c=0;c<8;c++)X.push(wave(r,c,.2));
    const W=[0,1,2].map(h=>Array.from({length:32},(_,i)=>wave(Math.floor(i/4),i%4,h+2)*.5));
    const projected=W.map(w=>Array.from({length:24},(_,i)=>{const r=Math.floor(i/4),c=i%4;let s=0;for(let k=0;k<8;k++)s+=X[r*8+k]*w[k*4+c];return s;}));
    const scores=Array.from({length:36},(_,i)=>{const r=Math.floor(i/6),c=i%6;let s=0;for(let k=0;k<4;k++)s+=projected[0][r*4+k]*projected[1][c*4+k];return s/2;});
    const weights=[];for(let r=0;r<6;r++){const max=Math.max(...scores.slice(r*6,r*6+r+1));let den=0;for(let j=0;j<=r;j++)den+=Math.exp(scores[r*6+j]-max);for(let j=0;j<6;j++)weights.push(j>r?0:Math.exp(scores[r*6+j]-max)/den);}
    const out=Array.from({length:24},(_,i)=>{const r=Math.floor(i/4),c=i%4;let s=0;for(let j=0;j<6;j++)s+=weights[r*6+j]*projected[2][j*4+c];return s;});
    K.matrix(g,{rows:6,cols:8,pos:[-20,0,5],cell:.66,depth:.22,signed:true,values:X});
    txt(g,'X',[-20,3.2,5],1.2);txt(g,'6 tokens × 8 coordinates',[-20,-3.6,5],.54,C.cyan);
    const qkvY=[9,1,-7];
    for(let h=0;h<3;h++){
      K.matrix(g,{rows:8,cols:4,pos:[-11,qkvY[h],0],cell:.58,depth:.28,signed:true,values:W[h]});
      txt(g,['WQ','WK','WV'][h],[-11,qkvY[h]+3,0],.8,C.violet);
      txt(g,'8 × 4',[-11,qkvY[h]-3,0],.48,C.violet);
      K.matrix(g,{rows:6,cols:4,pos:[-3,qkvY[h],0],cell:.75,depth:.28,signed:true,values:projected[h]});
      txt(g,['Q · queries','K · keys','V · values'][h],[-3,qkvY[h]+3,0],.72,C.ice);
      txt(g,'6 × 4',[-3,qkvY[h]-3,0],.48,C.cyan);
      flow(g,[[-17,0,5],[-15,qkvY[h],3],[-12.5,qkvY[h],0]],3,C.amber,.1);
      flow(g,[[-9.7,qkvY[h],0],[-7.6,qkvY[h],0],[-4.8,qkvY[h],0]],2,C.amber,.14);
      txt(g,'×',[-14,qkvY[h],1],.75);txt(g,'=',[-7,qkvY[h],1],.75);
    }
    txt(g,'LEARNED PROJECTIONS',[-11,14,0],.68,C.violet);
    const raw=K.matrix(g,{rows:6,cols:6,pos:[7,7,-4],cell:.72,depth:.32,signed:true,values:scores});
    txt(g,'QKᵀ / √4',[7,10.5,-4],.85,C.ice);
    const att=K.matrix(g,{rows:6,cols:6,pos:[16,7,-4],cell:.72,depth:.36,values:weights,color:C.cyan});
    txt(g,'row softmax',[16,10.5,-4],.82,C.ice);
    txt(g,'causal mask →',[11.2,12.5,-4],.68,C.amber);
    for(let r=0;r<6;r++)for(let c=r+1;c<6;c++){
      const x=16+(c-2.5)*.72,y=7-(r-2.5)*.72;
      K.box(g,[x,y,-3.64],[.6,.6,.08],C.dark,.98);
      K.segments(g,[[x-.16,y-.16,-3.56],[x+.16,y+.16,-3.56],[x-.16,y+.16,-3.56],[x+.16,y-.16,-3.56]],C.dim,.8);
    }
    flow(g,[[-1.4,9,0],[2,11,-2],[4.5,8,-4]],3,C.amber,.1);
    flow(g,[[-1.4,1,0],[3,2,-3],[6,4.5,-4]],3,C.amber,.1);
    flow(g,[[9.4,7,-4],[11.5,7,-4],[13.7,7,-4]],3,C.amber,.14);
    K.matrix(g,{rows:6,cols:4,pos:[19,-5,-1],cell:.85,depth:.32,signed:true,values:out});
    txt(g,'A · V',[19,-.9,-1],1,C.ice);txt(g,'contextual output · 6 × 4',[19,-9.2,-1],.62,C.cyan);
    const select=new T.Group();g.add(select);
    // Every contribution starts at a source VALUE, ending at the selected query's output.
    const contrib=[];
    for(let j=0;j<5;j++){
      const y=-7-(j-2.5)*.75, oy=-5-(4-2.5)*.85;
      const f=flow(select,[[-1.35,y,.5],[4+j*.25,-10-j*.45,3],[11,-11+j*.6,2],[17.2,oy,-.5]],2,C.amber,.11+j*.018);contrib.push(f);
      txt(select,weights[4*6+j].toFixed(2),[8+j*1.15,-12+j*.2,2],.43,C.amber);
    }
    const rowY=7-(4-2.5)*.72;
    K.line(g,[[13.65,rowY+.39,-3.4],[18.35,rowY+.39,-3.4],[18.35,rowY-.39,-3.4],[13.65,rowY-.39,-3.4],[13.65,rowY+.39,-3.4]],C.amber,1);
    txt(g,'query 5 mixes values 1–5',[9,-14,1],.68,C.amber);
    txt(g,'Future values contribute 0',[17,3.5,-4],.5,C.dim);
    // A second head has different projections; output features are concatenated.
    const W2=[0,1,2].map(h=>Array.from({length:32},(_,i)=>wave(Math.floor(i/4),i%4,h+6)*.5));
    const P2=W2.map(w=>Array.from({length:24},(_,i)=>{let v=0;for(let k=0;k<8;k++)v+=X[Math.floor(i/4)*8+k]*w[k*4+i%4];return v;}));
    const A2=[];for(let r=0;r<6;r++){const row=[];for(let j=0;j<=r;j++){let s=0;for(let k=0;k<4;k++)s+=P2[0][r*4+k]*P2[1][j*4+k];row.push(s/2);}const mx=Math.max(...row),den=row.reduce((s,v)=>s+Math.exp(v-mx),0);for(let j=0;j<6;j++)A2.push(j>r?0:Math.exp(row[j]-mx)/den);}
    const O2=Array.from({length:24},(_,i)=>{let v=0;for(let j=0;j<6;j++)v+=A2[Math.floor(i/4)*6+j]*P2[2][j*4+i%4];return v;});
    K.matrix(g,{rows:6,cols:4,pos:[24,-5,-5],cell:.62,depth:.25,signed:true,values:O2});
    txt(g,'head 2',[24,-1.8,-5],.59,C.violet);
    const concat=K.matrix(g,{rows:6,cols:8,pos:[27,-5,-14],cell:.62,depth:.26,signed:true,values:(r,c)=>c<4?out[r*4+c]:O2[r*4+c-4]});
    txt(g,'concatenate · 6 × 8',[27,-9,-14],.59,C.ice);
    flow(g,[[20,-5,-2],[22,-5,-7],[25,-5,-13]],2,C.amber,.12);
    flow(g,[[24,-5,-6],[24,-5,-10],[29,-5,-13]],2,C.violet,.12);
    K.label(g,'Shared weights project every token into Q, K and V',[-10,5,1],{from:0,to:.27});
    K.label(g,'Mask future positions, then normalize each row',[13,7,-3],{from:.27,to:.56});
    K.label(g,'Attention weights mix source values into each output',[11,-7,1],{from:.56,to:1});
    K.poses(1,[{eye:[-14,8,32],target:[-10,2,1]},{eye:[19,17,24],target:[11,5,-3]},{eye:[34,19,45],target:[4,0,-4]}]);
  }

  // Three real layer counts, with a magnified block showing attention and a 4x FFN.
  {
    const g=K.chapter(2), models=[{x:-26,n:12,w:12,step:1.38,name:'GPT',dims:'12 blocks · width 768',p:'≈117M parameters',ff:'FFN 3,072'},{x:0,n:48,w:16,step:.49,name:'GPT-2',dims:'48 blocks · width 1,600',p:'≈1.5B parameters',ff:'FFN 6,400'},{x:28,n:96,w:22,step:.31,name:'GPT-3',dims:'96 blocks · width 12,288',p:'175B parameters',ff:'FFN 49,152'}];
    const pulses=[],gradients=[];
    for(let m=0;m<3;m++){
      const d=models[m], cells=[], edge=[], depth=d.n*d.step;
      for(let l=0;l<d.n;l++){
        const z=-8-l*d.step;
        // A sampled causal attention map and a parallel channel transform per block.
        for(let r=0;r<6;r++)for(let c=0;c<6;c++){
          const dense=m<2||l%2===0, active=c<=r&&(dense||c>=r-2);
          if(active)cells.push({p:[d.x+(c-2.5)*d.w/6,3.4-r*.76,z],s:[d.w/6*.78,.57,.09],c:active?(wave(r,c,l)>0?C.cyan:C.amber):C.dark});
        }
        for(let j=0;j<20;j++)cells.push({p:[d.x+(j-9.5)*d.w/20,-3.2,z-.12],s:[d.w/20*.69,1.6+.2*Math.sin(j*1.6+l),.07],c:j%7===0?C.amber:C.dim});
        edge.push([d.x-d.w*.56,4.3,z],[d.x-d.w*.56,-4.6,z]);
        if(l%Math.max(1,Math.round(d.n/8))===0)txt(g,String(l+1),[d.x-d.w*.61,4.4,z],.46,C.dim);
      }
      K.instances(g,cells,C.cyan,.86);K.segments(g,edge,C.dim,.45);
      txt(g,d.name,[d.x,9,-5],1.2,C.ice);txt(g,d.dims,[d.x,7.1,-5],.64,C.cyan);txt(g,d.p,[d.x,5.5,-5],.57,C.ice);txt(g,d.ff,[d.x,-7,-8],.56,C.dim);
      const pulse=K.box(g,[d.x,0,-8],[d.w*1.03,9,.1],C.amber,.07);pulses.push({pulse,d});
      flow(g,[[d.x,-5.6,-7],[d.x,-5.6,-8-depth*.48],[d.x,-5.6,-8-depth]],7,C.amber,.035);
      const back=flow(g,[[d.x+d.w*.6,1,-8-depth],[d.x+d.w*.6,1,-8-depth*.5],[d.x+d.w*.6,1,-6]],7,C.violet,.035);gradients.push(back.object);
    }
    txt(g,'GPT-3 alternates dense and locally banded attention',[27,-9,-22],.57,C.ice);
    txt(g,'Each visible slice is one decoder block',[0,12,-18],.76,C.ice);
    const detail=new T.Group();detail.position.set(0,0,17);g.add(detail);
    K.matrix(detail,{rows:6,cols:8,pos:[-16,0,0],cell:.61,depth:.24,signed:true,values:(r,c)=>wave(r,c,2)});
    K.matrix(detail,{rows:6,cols:8,pos:[-6,0,0],cell:.61,depth:.24,signed:true,values:(r,c)=>wave(r,c,3)});
    const ffn=K.matrix(detail,{rows:6,cols:32,pos:[8,0,0],cell:.42,depth:.3,signed:true,values:(r,c)=>wave(r,c,4)});
    K.matrix(detail,{rows:6,cols:8,pos:[22,0,0],cell:.61,depth:.24,signed:true,values:(r,c)=>wave(r,c,5)});
    txt(detail,'token states',[-16,4.3,0],.68);txt(detail,'causal attention',[-6,4.3,0],.68);txt(detail,'shared FFN: 8 → 32 → 8',[8,4.3,0],.68);txt(detail,'residual stream',[22,4.3,0],.68);
    txt(detail,'GPT-2-STYLE BLOCK · SAMPLED TOY WIDTHS',[3,15,0],.75,C.ice);
    const up=K.matrix(detail,{rows:8,cols:32,pos:[7,9,-3],cell:.27,depth:.24,signed:true,values:(r,c)=>wave(r,c,8)*.5});
    txt(detail,'W↑ · 8 × 32 learned weights',[7,11.5,-3],.6,C.violet);
    K.matrix(detail,{rows:32,cols:8,pos:[15,9,-3],cell:.14,depth:.22,signed:true,values:(r,c)=>wave(r,c,9)*.5});
    txt(detail,'W↓ · 32 × 8',[16,12,-3],.54,C.violet);
    K.line(detail,[[7,7.8,-3],[7,3.4,-1]],C.violet,.55);
    txt(detail,'Different tokens, the same learned channel transform',[7,-5.2,0],.58,C.cyan);
    for(let r=0;r<6;r++){
      const y=(2.5-r)*.61;flow(detail,[[-13.3,y,0],[-10.5,y,.6],[-8.7,y,0]],2,C.amber,.12);flow(detail,[[-3.3,y,0],[-1,y,.5],[1,y,0]],2,C.amber,.12);flow(detail,[[15,y*.69,0],[17,y,.5],[19.3,y,0]],2,C.amber,.12);
    }
    residual(detail,[-18.7,2.1,0],[-3.3,2.1,0]);residual(detail,[-3.3,2.1,0],[24.7,2.1,0]);
    const loss=K.matrix(detail,{rows:1,cols:8,pos:[29,0,0],cell:.57,depth:.4,values:[.02,.03,.11,.06,.05,.41,.23,.09],color:C.cyan});
    txt(detail,'next-token probabilities',[29,3,0],.62);txt(detail,'logit gradient: p − target',[28,-4.5,0],.65,C.violet);
    flow(detail,[[24.7,0,0],[26,0,0],[26.5,0,0]],2,C.amber,.13);
    const detailGradient=flow(detail,[[29,-2,0],[21,-7,2],[5,-7,2],[-15,-5,0]],6,C.violet,.045);gradients.push(detailGradient.object);
    const initial=up.values.slice();let updateStep=-1;
    K.animate(g,(t,p)=>{
      for(const {pulse,d} of pulses)pulse.position.z=-8-((t*.08)%1)*d.n*d.step;
      // Explicit optimizer update only during the narrated training chapter.
      const step=Math.floor(K.clamp((p-.05)/.22)*5);
      if(step!==updateStep){updateStep=step;up.set(initial.map((v,i)=>v-step*.014*Math.sin(i*.53)));}
      detail.visible=p<.49;
      for(const gradient of gradients)gradient.visible=p<.7;
    });
    K.label(g,'Forward activations → loss → backward gradients',[5,-2,19],{from:0,to:.34});
    K.label(g,'Depth, width and feed-forward capacity all grow',[20,0,-15],{from:.34,to:.7});
    K.label(g,'At inference, prompt examples change activations; weights stay fixed',[0,7,-5],{from:.7,to:1});
    K.poses(2,[{eye:[15,20,58],target:[5,5,17]},{eye:[40,12,8],target:[24,0,-18]},{eye:[60,40,65],target:[2,0,-15]}]);
  }

  // An explicitly quantitative power-law surface, not a mountain of 'intelligence'.
  {
    const g=K.chapter(3), n=29, vertices=[],indices=[],colors=[], min=-18,max=18;
    const height=(u,v)=>-7+20*(.5*Math.pow(10,-.1*u)+.5*Math.pow(10,-.1*v));
    for(let r=0;r<n;r++)for(let c=0;c<n;c++){
      const u=3*c/(n-1),v=3*r/(n-1),y=height(u,v);vertices.push(min+12*u,y,17-12*v);
      const col=new T.Color(C.cyan).lerp(new T.Color(C.violet),v/3*.65).multiplyScalar(.42+.5*(1-y/16));colors.push(col.r,col.g,col.b);
      if(r<n-1&&c<n-1){const a=r*n+c;indices.push(a,a+n,a+1,a+1,a+n,a+n+1);}
    }
    const geo=K.track(new T.BufferGeometry());geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();
    const mat=K.track(new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.58,metalness:.14,transparent:true,opacity:.57}));g.add(new T.Mesh(geo,mat));
    for(let k=0;k<=12;k++){
      const u=k/4,pts1=[],pts2=[];for(let s=0;s<=48;s++){const v=s/16;pts1.push([min+12*u,height(u,v)+.04,17-12*v]);pts2.push([min+12*v,height(v,u)+.05,17-12*u]);}K.line(g,pts1,C.cyan,k%4===0?.78:.26);K.line(g,pts2,C.cyan,k%4===0?.78:.26);
    }
    // Axes are logarithmic in resources, linear in the remaining reducible loss.
    K.line(g,[[-18,-8,-20],[-18,-8,18],[20,-8,18]],C.ice,.75);K.line(g,[[-18,-8,18],[-18,15,18]],C.ice,.75);
    for(let k=0;k<=3;k++){
      txt(g,['1×','10×','100×','1000×'][k],[-18+12*k,-10.1,19],.67,C.ice);
      txt(g,['1×','10×','100×','1000×'][k],[-21,-9,17-12*k],.6,C.ice);
    }
    txt(g,'MODEL PARAMETERS N  ·  log scale',[1,-13,20],.8,C.cyan);txt(g,'TRAINING DATA D  ·  log scale',[-24,-4,-5],.7,C.cyan);
    txt(g,'reducible prediction loss',[-18,17,17],.72,C.ice);txt(g,'ILLUSTRATIVE N–D RESPONSE SURFACE',[1,18,-8],.79,C.ice);
    txt(g,'More resources → smaller errors',[2,15.8,-8],.67,C.amber);
    const iso=[];for(let i=0;i<=60;i++){const u=3*i/60,v=3-u;iso.push([-18+12*u,height(u,v)+.18,17-12*v]);}K.line(g,iso,C.amber,.95);flow(g,iso,6,C.amber,.033);
    txt(g,'same N × D',[1,8,-3],.65,C.amber);
    // The compute-law curve has calibrated points: 1,.794,.631,.501.
    const cp=[];for(let i=0;i<=80;i++){const x=i/80*3;cp.push([-17+12*x,-19+10*Math.pow(10,-.1*x),28]);}K.line(g,cp,C.amber,1);
    for(let k=0;k<4;k++){
      const y=-19+10*Math.pow(10,-.1*k);K.box(g,[-17+12*k,y,28],[.35,.35,.35],C.amber,1);txt(g,Math.pow(10,-.1*k).toFixed(2),[-17+12*k,y+1.35,28],.65,C.amber);
      K.line(g,[[-17+12*k,-20,28],[-17+12*k,y,28]],C.dim,.65);
    }
    txt(g,'L − L∞ ∝ C⁻⁰·¹  ·  illustrative exponent',[1,-23,28],.82,C.ice);
    txt(g,'1×                 10×                100×              1000× compute',[1,-21,28],.64,C.cyan);
    const marker=K.box(g,[-17,-9,28],[.5,.5,.5],C.ice,1);
    K.animate(g,(t,p)=>{const q=K.clamp((p-.25)/.55)*3;marker.position.set(-17+12*q,-19+10*Math.pow(10,-.1*q),28);});
    K.label(g,'The axes count resources; height measures prediction error',[0,7,4],{from:0,to:.35});
    K.label(g,'A 10× investment removes a fraction of remaining error',[0,-11,28],{from:.35,to:.69});
    K.label(g,'A resource law does not supply an AGI timeline',[1,6,-9],{from:.69,to:1});
    K.poses(3,[{eye:[40,55,62],target:[0,1,8]},{eye:[0,27,58],target:[0,-6,15]},{eye:[43,42,65],target:[0,0,5]}]);
  }

  // Fixed N*D volumes make allocation inspectable in three dimensions.
  {
    const g=K.chapter(4), groups=[];
    const configs=[{x:-19,w:20,d:5,nx:24,nz:6,name:'GOPHER',params:'280B parameters',data:'1× training tokens',color:C.violet},{x:17,w:5,d:20,nx:6,nz:24,name:'CHINCHILLA',params:'70B parameters',data:'~4× training tokens',color:C.cyan}];
    for(let m=0;m<2;m++){
      const d=configs[m], cells=[], slices=[];
      for(let z=0;z<d.nz;z++)for(let x=0;x<d.nx;x++)for(let y=0;y<8;y++){
        const px=d.x+(x-(d.nx-1)/2)*d.w/d.nx,pz=8-z*d.d/d.nz,py=-3+y*.75;
        cells.push({p:[px,py,pz],s:[d.w/d.nx*.77,.54,d.d/d.nz*.69],c:(x+y*3+z*2)%17===0?C.amber:d.color});
      }
      K.instances(g,cells,d.color,.75);
      txt(g,d.name,[d.x,11,7],1.3,C.ice);txt(g,d.params,[d.x,8.8,7],.85,d.color);txt(g,d.data,[d.x,-8,7-d.d*.45],.75,C.amber);
      txt(g,'N',[d.x,6.3,10],.7,d.color);txt(g,'D',[d.x+d.w*.5+2,-1,7-d.d*.5],.7,C.amber);
      // A parameter sheet remains fixed as successive token batches visit it.
      const weight=K.matrix(g,{rows:10,cols:m===0?24:6,pos:[d.x,-.3,11],cell:.76,depth:.24,signed:true,values:(r,c)=>wave(r,c,m+2)});
      txt(g,'sampled parameter sheet',[d.x,-5.7,11],.58,C.ice);
      const total=m===0?4:16;
      for(let j=0;j<total;j++){
        const yy=-15+(j%4)*.68, zz=-7-Math.floor(j/4)*4.8, tokenItems=[];
        for(let r=0;r<3;r++)for(let c=0;c<12;c++)tokenItems.push({p:[d.x+(c-5.5)*.39,yy+r*.17,zz],s:[.31,.1,.15],c:C.amber});
        K.instances(g,tokenItems,C.amber,.74);
        flow(g,[[d.x,yy,zz],[d.x+Math.sin(j)*2,-8,3],[d.x,-3.8,10.8]],2,C.amber,.06+(j%4)*.01);
      }
      const e=[d.x-d.w/2,-4,8.5],w=d.w,dep=d.d;
      K.line(g,[e,[e[0]+w,e[1],e[2]],[e[0]+w,e[1],e[2]-dep],[e[0],e[1],e[2]-dep],e],d.color,.9);
      const pulse=K.box(g,[d.x,0,8],[d.w,7,.15],C.amber,.12);groups.push({pulse,d});
    }
    txt(g,'SAME TRAINING COMPUTE',[0,16,0],1.05,C.ice);
    txt(g,'N × D is held approximately constant',[0,13.8,0],.72,C.amber);
    txt(g,'More parameters',[configs[0].x,-20,-1],.7,C.violet);txt(g,'A longer training stream',[configs[1].x,-20,-1],.7,C.cyan);
    // Allocation curve connects equal-area rectangles in log coordinates.
    const curve=[];for(let j=0;j<=40;j++){const a=j/40;curve.push([-12+24*a,8+3*Math.sin(a*Math.PI),-19]);}K.line(g,curve,C.amber,.7);
    txt(g,'BETTER ALLOCATION → LOWER EVALUATED LOSS',[0,-24,0],.83,C.ice);
    K.animate(g,(t,p)=>{for(const {pulse,d} of groups)pulse.position.z=8-((t*.09)%1)*d.d;});
    K.label(g,'Width represents model capacity; depth represents training data',[-4,2,8],{from:0,to:.35});
    K.label(g,'Less capacity, many more tokens, the same compute budget',[15,1,-2],{from:.35,to:.7});
    K.label(g,'Chinchilla outperformed the larger Gopher in the paper’s evaluations',[0,7,1],{from:.7,to:1});
    K.poses(4,[{eye:[-25,20,44],target:[-12,0,3]},{eye:[35,15,32],target:[15,-1,-2]},{eye:[39,33,54],target:[0,-3,-3]}]);
  }
}

function buildAscentLate(K){
  const {T,C}=K, clamp=K.clamp;
  const mix=(a,b,f)=>new T.Color(a).lerp(new T.Color(b),f);
  const sample=(r,c,s=0)=>Math.sin(r*1.71+c*2.39+s)*.73+Math.cos(r*.43-c*.71+s)*.25;
  const txt=(g,s,p,size=.8,color=C.ice)=>K.text(g,s,p,{size,color});
  const arr=(g,p,rows,cols,cell=.55,signed=true,seed=0)=>K.matrix(g,{rows,cols,pos:p,cell,depth:.14,signed,values:(r,c)=>sample(r,c,seed)});
  function ribbon(g,p,n=16,color=C.cyan,rows=3,step=.43){
    const a=[];
    for(let r=0;r<rows;r++)for(let i=0;i<n;i++)a.push({p:[p[0]+i*step,p[1]-r*.45,p[2]],s:[step*.72,.19,.14+.1*Math.abs(sample(r,i))],c:mix(C.dark,color,.3+.55*Math.abs(sample(r,i)))});
    return K.instances(g,a,color,.95);
  }
  function logits(g,p,vals,label){
    K.instances(g,vals.map((v,i)=>({p:[p[0]+i*.48,p[1]+v*2,p[2]],s:[.31,v*4,.32],c:i===vals.indexOf(Math.max(...vals))?C.amber:C.cyan})),C.cyan);
    if(label)txt(g,label,[p[0]+vals.length*.2,p[1]-.8,p[2]],.7);
  }
  function ticks(g,p,axis,n,step,color=C.dim){
    const points=[];
    for(let i=0;i<=n;i++){const q=p.slice();q[axis]+=i*step;const e=q.slice();e[(axis+1)%3]+=.18;points.push(q,e);}
    K.segments(g,points,color,.6);
  }

  // 5. Three different learning operations: demonstration loss, reward learning,
  // then policy optimization. All numbers are illustrative samples.
  {
    const g=K.chapter(5), layers=[], bases=[];
    for(let k=0;k<7;k++){
      const m=arr(g,[-13,0,7-k*1.55],12,12,.53,true,k+.7);
      layers.push(m);bases.push(m.values.slice());
      if(k<6)for(let r=0;r<6;r++)K.line(g,[[-15.8+r*.92,3,7-k*1.55],[-15.8+r*.92,3,5.45-k*1.55]],C.dim,.35);
    }
    txt(g,'POLICY WEIGHTS',[-13,5.5,2],1.05);
    txt(g,'sampled parameters · updated in training',[-13,-5,3],.64,C.cyan);
    const demo=ribbon(g,[-22,10,10],23,C.ice,3,.37);
    txt(g,'Human demonstration',[-17.5,12,10],.95);
    txt(g,'Prompt + useful target response',[-17.5,8,10],.65);
    K.flow(g,[[-18,7.5,10],[-20,4,7],[-16,2,7]],{color:C.amber,count:4,speed:.08});
    logits(g,[-7,9,5],[.2,.35,.18,.77,.13,.08,.24,.1],'predict next target token');
    txt(g,'target',[-5.55,13,5],.65,C.amber);
    K.flow(g,[[-10,2,7],[-7,3,8],[-5,9,5]],{color:C.amber,count:4,speed:.1});
    K.flow(g,[[-4,9,5],[-3,5,0],[-9,0,-4]],{color:C.violet,count:4,speed:.085});
    txt(g,'supervised loss',[-3,6,0],.74,C.violet);
    txt(g,'−log P(target)',[-3,4.8,0],.63,C.violet);

    const answers=['A  concise + correct','B  fluent, but wrong','C  incomplete'];
    for(let n=0;n<3;n++){
      const y=3.5-n*4.1,z=8-n*1.1;
      ribbon(g,[-2,y,z],18,n===0?C.cyan:n===1?C.amber:C.violet,4,.42);
      txt(g,answers[n],[1.5,y+1.15,z],.65,n===0?C.cyan:n===1?C.amber:C.violet);
      K.flow(g,[[-9,1-n*.6,3],[-6,y,9],[0,y,z]],{color:C.amber,count:2,speed:.07,phase:n*.2});
      K.flow(g,[[5.5,y,z],[9,y,6],[12,-4+n*.35,1]],{color:n===0?C.cyan:C.violet,count:2,speed:.09});
    }
    txt(g,'PEOPLE RANK CANDIDATE ANSWERS',[2,7,8],.84);
    txt(g,'A ≻ C ≻ B  (toy ranking)',[3,-10,6],.69,C.ice);
    for(let i=0;i<5;i++)arr(g,[13,-4,2-i*1.4],8,9,.49,true,3+i);
    txt(g,'REWARD MODEL',[13,0,0],.96);
    txt(g,'learns preference comparisons',[13,-8,0],.63);
    txt(g,'r = +0.81',[16,-3,-8],1.1,C.amber);
    txt(g,'illustrative scalar',[16,-4.5,-8],.62);
    K.flow(g,[[13,-4,-4],[16,-4,-7],[16,-2,-10]],{color:C.amber,count:3,speed:.1});
    const policyLoop=K.flow(g,[[16,-2,-10],[15,-12,-9],[-4,-13,-5],[-16,-8,-4],[-13,-1,-4]],{color:C.violet,count:7,speed:.055});
    txt(g,'POLICY OPTIMIZER',[-3,-12,-5],.9,C.violet);
    txt(g,'reward guides a weight update',[-3,-14,-5],.7,C.violet);
    txt(g,'preference ≠ factual verification',[11,9,-3],.74,C.amber);
    let last=-1;
    K.animate(g,(t,p)=>{
      const step=Math.floor(clamp((p-.03)/.82)*12);
      if(step!==last){last=step;layers.forEach((m,i)=>m.set(bases[i].map((v,j)=>clamp(v+.12*Math.sin(j*.83+i)*step/12,-1,1))));}
      demo.position.y=Math.sin(t*.35)*.08;
      policyLoop.object.visible=p>.3;
    });
    K.label(g,'Demonstrations supervise the desired next token',[-10,7,6],{from:0,to:.31});
    K.label(g,'Rankings train a separate reward model',[6,1,6],{from:.3,to:.66});
    K.label(g,'A reward signal changes the policy during training',[-2,-6,-1],{from:.65,to:1});
    K.poses(5,[{eye:[-19,6,33],target:[-12,3,3]},{eye:[18,5,33],target:[5,-1,2]},{eye:[9,12,52],target:[-1,-1,0]}]);
  }

  // 6. Preserve the native axes of each modality before showing correspondence.
  // The image and spectrogram are generated examples, not measured model inputs.
  {
    const g=K.chapter(6), imageTiles=[],patches=[];
    for(let y=0;y<24;y++)for(let x=0;x<24;x++){
      const mountain=13+4*Math.sin(x*.17)+2*Math.sin(x*.46),sun=(x-17)**2+(y-6)**2<10;
      let color=sun?0xffd29b:y>mountain?mix(0x153b53,0x548090,(y-mountain)/13):mix(0x4e88b3,0x173c60,y/24);
      if(y>18)color=mix(0x235b7b,0x68b2c1,(y-18)/9);
      const px=Math.floor(x/4),py=Math.floor(y/4),lift=.11*Math.sin(px*1.8+py*.9);
      imageTiles.push({p:[-17+(x-11.5)*.45+px*.11,7-(y-11.5)*.45-py*.11,5+lift],s:[.41,.41,.22],c:color});
    }
    K.instances(g,imageTiles,C.cyan);
    for(let y=0;y<6;y++)for(let x=0;x<6;x++){
      const pos=[-17+(x-2.5)*1.91,7-(y-2.5)*1.91,5];
      patches.push(pos);
      K.line(g,[[pos[0]-.86,pos[1]-.86,5.22],[pos[0]+.86,pos[1]-.86,5.22],[pos[0]+.86,pos[1]+.86,5.22],[pos[0]-.86,pos[1]+.86,5.22],[pos[0]-.86,pos[1]-.86,5.22]],C.ice,.23);
    }
    txt(g,'IMAGE → SPATIAL PATCHES',[-16,14,5],1.02);
    txt(g,'x',[-9,1,5],.65);txt(g,'y',[-23,10,5],.65);
    txt(g,'example image · patch grid is schematic',[-16,0,5],.62);
    const spectral=[];const freq=16,frames=38;
    for(let f=0;f<freq;f++)for(let n=0;n<frames;n++){
      const harmonic=Math.exp(-((f-(4+1.5*Math.sin(n*.17)))**2)/1.7)+.55*Math.exp(-((f-(10+Math.sin(n*.15)))**2)/2.2);
      const amp=(.18+harmonic*.82)*(.42+.58*Math.sin(n*.24)**2);
      spectral.push({p:[-24+n*.42,-11+amp*2.8,9-f*.42],s:[.33,.2+amp*5.5,.32],c:mix(C.dim,C.amber,clamp(amp))});
    }
    K.instances(g,spectral,C.amber);
    const wave=[];for(let i=0;i<190;i++)wave.push([-24+i*.083,-13+Math.sin(i*.36)*(.15+.45*Math.sin(i*.048)**2),12]);
    K.line(g,wave,C.amber,.9);
    txt(g,'AUDIO → TIME × FREQUENCY',[-16,-4.8,9],.88,C.amber);
    txt(g,'time →',[-16,-14.5,12],.72,C.amber);
    txt(g,'frequency',[-25,-9,4],.63,C.amber);
    txt(g,'height = example spectral energy',[-16,-16,9],.61);
    ticks(g,[-24,-13,12],0,38,.42,C.amber);

    for(let i=0;i<4;i++)arr(g,[8,1,-6-i*1.8],15,15,.63,true,i+7);
    txt(g,'RELATED REPRESENTATIONS',[8,8,-6],.98);
    txt(g,'schematic · not GPT-4o internals',[8,-7,-6],.64);
    txt(g,'channels →',[8,-5,-4],.65,C.cyan);
    const labelWords=['What','is','reflected','in','the','water','?'];
    labelWords.forEach((s,i)=>{K.box(g,[1+i*2.5,12,8],[2.2,.8,.4],C.dark,.9);txt(g,s,[1+i*2.5,12.1,8.3],.48,C.ice);});
    txt(g,'TEXT → TOKEN VECTORS',[9,14,8],.96);
    for(let i=0;i<7;i++){
      const m=arr(g,[1+i*2.5,9,6.5],6,1,.39,true,i);
      K.flow(g,[[1+i*2.5,7.7,6.5],[i*1.5+1,5,1],[4+i*.7,4,-6]],{color:C.cyan,count:2,speed:.06,phase:i*.1});
    }
    for(let i=0;i<9;i++){
      const pos=patches[20+i%6+(i>5?6:0)];
      K.flow(g,[pos,[-4,6-(i%6)*.8,3],[4+(i%5)*1.3,3-Math.floor(i/5)*2,-6]],{color:C.cyan,count:3,speed:.048,phase:i*.09});
      K.flow(g,[[-19+i*1.2,-9,6],[-5,-5+i*.17,1],[4+i*.6,-2,-6]],{color:C.amber,count:3,speed:.05,phase:i*.12});
    }
    const cross=[];
    for(let r=0;r<7;r++)for(let c=0;c<7;c++)cross.push({p:[19+c*.35,5-r*.35,1],s:[.26,.26,.08+Math.abs(sample(r,c))*1.15],c:mix(C.dim,C.violet,.25+.65*Math.abs(sample(r,c)))});
    K.instances(g,cross,C.violet);
    txt(g,'correspondence',[20,7,1],.72,C.violet);
    K.flow(g,[[13,3,-6],[18,3,-2],[20,3,1]],{color:C.violet,count:3,speed:.07});
    txt(g,'“water” ↔ image region',[17,-4,5],.75,C.cyan);
    K.flow(g,[[13.5,12,8],[24,9,8],[21,1,1],[-11,2,5]],{color:C.violet,count:5,speed:.036});
    K.label(g,'Pixels preserve space; audio preserves time and frequency',[-16,0,7],{from:0,to:.32});
    K.label(g,'A shared task can connect text, image regions, and sound',[7,2,-2],{from:.32,to:.67});
    K.label(g,'Different signals become representations the system can relate',[1,-1,0],{from:.67,to:1});
    K.poses(6,[{eye:[-27,12,54],target:[-15,-2,4]},{eye:[25,8,32],target:[9,2,-4]},{eye:[8,16,52],target:[-2,1,0]}]);
  }

  // 7. Additional computation at use time: append tokens, reuse past keys and
  // values, and consult external evidence. No hidden chain of thought is shown.
  {
    const g=K.chapter(7),cacheItems=[],cacheBase=[];
    for(let kind=0;kind<2;kind++)for(let t=0;t<24;t++)for(let h=0;h<4;h++)for(let d=0;d<8;d++){
      const item={p:[-14+t*.6,5-kind*7+h*.42,-4-d*.47],s:[.46,.3,.34],c:mix(C.dim,kind?C.violet:C.cyan,.2+.73*Math.abs(sample(t,d,h+kind)))};
      cacheBase.push({item,t});cacheItems.push(item);
    }
    const caches=K.instances(g,cacheItems,C.cyan),dummy=new T.Object3D();
    txt(g,'PAST KEYS',[-7,8,-5],.97,C.cyan);
    txt(g,'PAST VALUES',[-7,-.8,-5],.97,C.violet);
    txt(g,'token positions →',[-7,-4,-4],.68);
    txt(g,'heads / channels sampled',[-7,-5.3,-4],.61);
    const prefix=[];for(let t=0;t<24;t++)prefix.push({p:[-14+t*.6,11,4],s:[.46,.44,.4],c:mix(C.dim,C.ice,.4+.3*Math.abs(sample(t,1)))});
    K.instances(g,prefix,C.ice);txt(g,'CONTEXT + GENERATED TOKENS',[-7,13,4],.91);
    for(let j=0;j<4;j++)arr(g,[-19,2,4-j*1.5],10,6,.52,true,18+j);
    txt(g,'weights stay fixed',[-19,-2.5,2],.72,C.ice);
    const query=arr(g,[6,5,1],4,8,.54,true,8);
    txt(g,'NEW QUERY',[6,8,1],.9,C.amber);
    K.flow(g,[[-18,4,4],[-14,10,3],[0,10,4],[6,6,1]],{color:C.amber,count:7,speed:.035});
    const queryFlows=[];
    for(let i=0;i<12;i++)queryFlows.push(K.flow(g,[[6,5,1],[3,6,-3],[-14+i*1.2,5,-4]],{color:C.amber,count:1,speed:.09,phase:i/12}));
    const normalizedAttention=n=>{const raw=Array.from({length:24},(_,c)=>c<n?Math.exp(-((c-(n-3))**2)/20):0),sum=raw.reduce((a,b)=>a+b,0);return raw.map(v=>v/sum);};
    const scores=K.matrix(g,{rows:1,cols:24,pos:[-7,2.2,1],cell:.6,depth:.3,values:normalizedAttention(8),color:C.cyan});
    txt(g,'attention over cached positions · one head',[-7,3.2,1],.64,C.cyan);
    K.flow(g,[[-14,-1,-4],[2,-1,-1],[6,0,2]],{color:C.violet,count:4,speed:.075});
    const output=arr(g,[6,-.4,2],4,8,.54,true,11);
    txt(g,'weighted values',[6,-2.4,2],.67,C.violet);
    logits(g,[11,3,5],[.09,.12,.25,.15,.82,.19,.1,.07,.24,.08],'next-token logits → softmax');
    K.flow(g,[[8,0,2],[13,0,4],[13,4,5]],{color:C.amber,count:3,speed:.11});
    const current=K.box(g,[13,10,4],[1,.7,.55],C.amber);txt(g,'append',[13,12,4],.72,C.amber);
    K.flow(g,[[13,10,4],[6,14,2],[-1,12,4]],{color:C.amber,count:3,speed:.085});
    arr(g,[6,4,-7],4,8,.35,true,13);txt(g,'new K',[6,6,-7],.64,C.cyan);
    arr(g,[6,-4,-7],4,8,.35,true,14);txt(g,'new V',[6,-6,-7],.64,C.violet);
    K.flow(g,[[-17,3,4],[-18,9,-12],[5,9,-12],[6,4,-7]],{color:C.cyan,count:4,speed:.04});
    K.flow(g,[[-17,3,4],[-18,-8,-12],[5,-8,-12],[6,-4,-7]],{color:C.violet,count:4,speed:.04});
    const appendK=K.flow(g,[[6,4,-7],[2,8,-8],[-9.2,6,-6]],{color:C.cyan,count:3,speed:.05});
    const appendV=K.flow(g,[[6,-4,-7],[2,-6,-7],[-9.2,-1,-6]],{color:C.violet,count:3,speed:.05});
    txt(g,'append current-token K / V projections',[1,-9,-6],.65);

    const code=[];
    for(let r=0;r<11;r++)for(let c=0;c<18;c++)if(c<8+(r*7)%11)code.push({p:[9+c*.4,-8-r*.34,5],s:[.26,.17,.18],c:r%3===0?C.violet:C.ice});
    K.instances(g,code,C.ice);txt(g,'EXTERNAL TOOL EXECUTION',[12,-6,5],.81);
    txt(g,'calculate / search / run a test',[12,-13,5],.65);
    const results=[];for(let i=0;i<7;i++)for(let j=0;j<5;j++)results.push({p:[18+j*.39,-7-i*.43,-5],s:[.28,.3,.22],c:i===3?C.amber:C.cyan});
    K.instances(g,results,C.cyan);txt(g,'test evidence',[19,-5,-5],.72);
    txt(g,'one failed case',[19,-11,-5],.65,C.amber);
    K.flow(g,[[14,3,5],[19,1,6],[14,-8,5]],{color:C.amber,count:3,speed:.07});
    K.flow(g,[[15,-9,5],[21,-10,1],[19,-8,-5]],{color:C.cyan,count:3,speed:.09});
    K.flow(g,[[19,-8,-5],[15,-15,-7],[-6,-13,-4],[-17,-5,3],[-17,3,4]],{color:C.violet,count:7,speed:.034});
    txt(g,'observation returns to context',[0,-14,-4],.74,C.violet);
    txt(g,'generic autoregressive decoding + tool workflow',[-1,16,-2],.64);
    let last=-1;
    K.animate(g,(time,p)=>{
      const n=Math.floor(8+clamp(p/.75)*16);
      if(n!==last){last=n;cacheBase.forEach(({item,t},i)=>{dummy.position.fromArray(item.p);dummy.scale.fromArray(item.s);if(t>=n)dummy.scale.multiplyScalar(.18);dummy.updateMatrix();caches.setMatrixAt(i,dummy.matrix);});caches.instanceMatrix.needsUpdate=true;current.position.x=-14+(n-1)*.6;scores.set(normalizedAttention(n));queryFlows.forEach((f,i)=>f.object.visible=i*2<n);
        for(const f of [appendK,appendV]){f.curve.points.at(-1).x=-14+(n-1)*.6;const a=f.object.geometry.attributes.position,pts=f.curve.getPoints(a.count-1);pts.forEach((v,i)=>a.setXYZ(i,v.x,v.y,v.z));a.needsUpdate=true;f.object.geometry.computeBoundingSphere();}
      }
    });
    K.label(g,'Inference reuses past keys and values; model weights stay fixed',[-5,4,0],{from:0,to:.34});
    K.label(g,'Calculations, searches and tests add external evidence',[7,5,3],{from:.34,to:.65});
    K.label(g,'External tests provide evidence for the next attempt',[7,-4,2],{from:.65,to:1});
    K.poses(7,[{eye:[-19,10,31],target:[-8,3,-3]},{eye:[27,4,36],target:[10,-5,1]},{eye:[12,18,53],target:[-1,-2,0]}]);
  }

  // 8. Astra is a documented system interface, never an invented inner network.
  // Context records, tool requests, environmental state, and observations have
  // visibly different structures and a complete round trip.
  {
    const g=K.chapter(8),context=[];
    const sourceColors=[C.cyan,C.ice,C.violet,C.amber];
    for(let record=0;record<20;record++)for(let c=0;c<20;c++)for(let r=0;r<3;r++){
      if(c>9+(record*7+r*3)%11)continue;
      context.push({p:[-19+c*.43,8-r*.3-record*.68,8-record*.47],s:[.3,.19,.18],c:mix(C.dark,sourceColors[record%4],.35+.5*Math.abs(sample(record,c,r)))});
    }
    K.instances(g,context,C.ice);
    txt(g,'CONTEXT: A GROWING RECORD',[-14,11,5],1.0);
    txt(g,'request · files · actions · observations',[-14,9.7,5],.65);
    txt(g,'time / token positions',[-14,-8,0],.64);
    for(let i=0;i<5;i++)K.line(g,[[-20,8-i*2.6,8-i*1.8],[-9,8-i*2.6,8-i*1.8]],C.dim,.4);
    const core=K.box(g,[-1,2,-1],[6,8,5],C.dark,.98);
    const face=[];for(let r=0;r<23;r++)for(let c=0;c<17;c++)face.push({p:[-3.7+c*.335,5.7-r*.335,1.54],s:[.2,.19,.07],c:mix(C.dark,C.cyan,.18+.18*Math.sin(c*.41+r*.37)**2)});
    K.instances(g,face,C.cyan);
    txt(g,'GPT-6 ASTRA',[-1,2.8,1.8],.92);
    txt(g,'MODEL INTERFACE',[-1,1.25,1.8],.65,C.cyan);
    txt(g,'architecture undisclosed',[-1,-.4,1.8],.56,C.ice);
    K.flow(g,[[-10,4,5],[-7,4,4],[-4,3,1]],{color:C.amber,count:6,speed:.055});
    txt(g,'read context',[-6,6,4],.67,C.amber);
    const busY=[10,0,-10];
    for(let i=0;i<3;i++){
      K.flow(g,[[2,3-i,1],[7,3-i,3],[8,busY[i],3],[11,busY[i],2]],{color:sourceColors[i],count:4,speed:.055,phase:i*.2});
    }
    txt(g,'structured tool requests',[7,6.3,3],.64);

    // Code is a nested syntax structure and executable statements.
    const code=[];for(let r=0;r<12;r++)for(let c=0;c<18;c++)if(c<(8+(r*7)%10))code.push({p:[12+c*.35+(r%4)*.3,13-r*.34,2],s:[.25,.16,.18],c:r%3===0?C.violet:C.cyan});
    K.instances(g,code,C.cyan);
    const ast=[[[15,8,1],[13,6,-1]],[[15,8,1],[18,6,-1]],[[13,6,-1],[12,5,-3]],[[13,6,-1],[15,5,-3]],[[18,6,-1],[19,5,-3]]];
    ast.forEach(p=>{K.line(g,p,C.violet,.65);K.box(g,p[1],[.55,.34,.38],C.violet);});
    txt(g,'CODE + EXECUTION',[16,15,2],.83,C.cyan);

    // Computer use is a spatial interface: image region plus selectable fields.
    const ui=[];
    for(let r=0;r<9;r++)for(let c=0;c<18;c++){
      const shade=c<7?mix(C.dark,C.violet,.35+.45*Math.sin(c*.5+r*.3)**2):mix(C.dark,C.ice,r%2?.2:.65);
      ui.push({p:[12+c*.37,1.3-r*.35,2],s:[.29,.24,.18],c:shade});
    }
    K.instances(g,ui,C.violet);K.box(g,[17,-2.7,2.1],[2.1,.45,.21],C.amber);
    txt(g,'COMPUTER + RESEARCH',[16,3.4,2],.83,C.violet);

    // Documents are structured pages, not an undifferentiated output glow.
    for(let page=0;page<4;page++){
      const letters=[];
      for(let r=0;r<13;r++)for(let c=0;c<15;c++)if(c<8+(r*3+page)%8)letters.push({p:[12+c*.29+page*.7,-8-r*.29+page*.35,2-page*.9],s:[.22,r===0?.24:.13,.1],c:r<2?C.amber:C.ice});
      K.instances(g,letters,C.ice);
      K.line(g,[[11.7+page*.7,-7.6+page*.35,2-page*.9],[16.6+page*.7,-7.6+page*.35,2-page*.9],[16.6+page*.7,-12.2+page*.35,2-page*.9]],C.dim,.5);
    }
    txt(g,'DOCUMENTS + ARTIFACTS',[16,-5.8,2],.82,C.ice);
    txt(g,'EXTERNAL ENVIRONMENT',[15,-14.2,0],.7,C.ice);
    const obs=[];
    for(let r=0;r<12;r++)for(let c=0;c<27;c++)obs.push({p:[-2+c*.42,-10-r*.28,-7],s:[.29,.18,.18],c:mix(C.dark,sourceColors[r%4],.4+.4*Math.abs(sample(r,c)))});
    K.instances(g,obs,C.cyan);txt(g,'OBSERVATIONS + CHECKS',[4,-8,-7],.88);
    for(let i=0;i<3;i++)K.flow(g,[[19,busY[i],0],[23,busY[i]-3,-5],[12,-11,-7],[8-i*3,-11,-7]],{color:sourceColors[i],count:4,speed:.046});
    K.flow(g,[[0,-11,-7],[-8,-14,-6],[-21,-9,0],[-21,6,6],[-16,7,7]],{color:C.amber,count:8,speed:.033});
    txt(g,'append evidence; decide again',[-13,-12,-4],.77,C.amber);
    const check=[];for(let r=0;r<5;r++)for(let c=0;c<5;c++)check.push({p:[4+c*.48,10-r*.48,-4],s:[.3,.3,.18],c:r===4&&c>2?C.amber:C.cyan});
    K.instances(g,check,C.cyan);txt(g,'task checks',[5,12,-4],.7);
    K.flow(g,[[0,6,-1],[2,9,-3],[4,9,-4]],{color:C.cyan,count:3,speed:.065});
    K.label(g,'A task builds a context record across many actions',[-12,3,5],{from:0,to:.33});
    K.label(g,'The model selects a tool; the environment supplies evidence',[7,2,1],{from:.33,to:.67});
    K.label(g,'Observed results return to context and guide the next action',[0,-5,-3],{from:.67,to:1});
    K.poses(8,[{eye:[-22,9,33],target:[-12,1,3]},{eye:[25,8,34],target:[7,1,0]},{eye:[6,20,55],target:[0,0,-1]}]);
  }

  // 9. Evaluation has axes, repetitions, failures, and untested cells. It has no
  // invented AGI completion meter: the empty region is a question, not a score.
  {
    const g=K.chapter(9),records=[],empty=[];
    for(let family=0;family<6;family++)for(let condition=0;condition<9;condition++)for(let trial=0;trial<20;trial++){
      const x=-17+family*5.6+(trial%5)*.56,z=10-condition*2.5,y=-4+Math.floor(trial/5)*.57;
      const unknown=condition>4||(family===5&&condition>2);
      if(unknown){if(trial===0)empty.push([[x-.26,y-.28,z],[x+2.5,y-.28,z],[x+2.5,y+2,z],[x-.26,y+2,z],[x-.26,y-.28,z]]);continue;}
      const fail=(family*11+condition*7+trial*3)%23<2+condition;
      records.push({p:[x,y,z],s:[.4,.4,.25],c:fail?C.amber:C.cyan});
    }
    K.instances(g,records,C.cyan);
    empty.forEach(p=>K.line(g,p,C.dim,.65));
    const axis=[];
    for(let x=-18;x<=17;x+=5.6){axis.push([x,-5,12],[x,-5,-21]);}
    for(let z=12;z>=-21;z-=2.5){axis.push([-18,-5,z],[17,-5,z]);}
    K.segments(g,axis,C.dim,.35);
    txt(g,'EVALUATION IS A VOLUME OF EVIDENCE',[0,5,9],1.12);
    txt(g,'toy test records · not benchmark results',[0,3.3,9],.69);
    const domains=['language','code','science','perception','action','adaptation'];
    domains.forEach((s,i)=>txt(g,s,[-16+i*5.6,-6.7,12],.61));
    txt(g,'TASK FAMILIES →',[0,-8.5,12],.8);
    txt(g,'repeat trials',[-21,-1,10],.72);
    txt(g,'conditions become less familiar',[-22,-5,-4],.69);
    txt(g,'observed success',[19,-1,9],.68,C.cyan);
    txt(g,'observed failure',[19,-3,9],.68,C.amber);
    txt(g,'not yet demonstrated',[1,-1,-13],.9,C.ice);
    K.line(g,[[-20,-5,11],[-20,1,11]],C.ice,.6);
    K.line(g,[[-19,-5,12],[-19,-5,-22]],C.ice,.5);
    K.line(g,[[-18,-5,14],[18,-5,14]],C.ice,.5);

    // Empty capability/condition combinations extend into depth. The volume's
    // axes encode what must be tested rather than asserting future abilities.
    const horizon=[];
    for(let iz=0;iz<15;iz++)for(let ix=0;ix<29;ix++){
      const x=(ix-14)*1.8,z=-23-iz*2.5,y=-4+.022*x*x+.045*iz*iz;
      if(ix<28)horizon.push([x,y,z],[x+1.8,-4+.022*(x+1.8)**2+.045*iz*iz,z]);
      if(iz<14)horizon.push([x,y,z],[x,-4+.022*x*x+.045*(iz+1)**2,z-2.5]);
    }
    K.segments(g,horizon,C.cyan,.17);
    const clouds=[];
    for(let i=0;i<700;i++){
      const a=i*2.399963,r=5+Math.sqrt(i)*.8,x=Math.cos(a)*r,y=7+Math.sin(a)*r*.35,z=-20-i*.045;
      clouds.push({p:[x,y,z],s:[.07,.07,.13],c:mix(C.cyan,C.violet,(i%17)/17)});
    }
    K.instances(g,clouds,C.cyan,.65);
    txt(g,'GENERALIZATION',[-16,10,-25],1.15,C.cyan);
    txt(g,'unfamiliar tasks and combinations',[-16,8,-25],.67);
    txt(g,'RELIABILITY',[13,10,-30],1.15,C.ice);
    txt(g,'repeatable performance under change',[13,8,-30],.67);
    txt(g,'HUMAN DIRECTION',[0,17,-42],1.15,C.amber);
    txt(g,'correction, oversight, and adaptation',[0,15,-42],.67);
    txt(g,'AGI: AN OPEN QUESTION',[0,6,-52],1.75,C.ice);
    txt(g,'The next chapter must be demonstrated.',[0,3.5,-52],.83,C.cyan);
    K.label(g,'Capabilities must hold across tasks, conditions, and repeated trials',[-1,0,4],{from:0,to:.36});
    K.label(g,'Unseen combinations remain empty until there is evidence',[0,0,-16],{from:.36,to:.68});
    K.label(g,'No single glowing horizon establishes AGI',[0,6,-38],{from:.68,to:1});
    K.poses(9,[{eye:[-22,18,36],target:[-2,-1,1]},{eye:[19,18,20],target:[0,0,-13]},{eye:[2,19,18],target:[0,6,-34]}]);
  }
}

/* THE ASCENT / computational anatomy. Sampled tensors; continuous camera. */
function createAscentScene(canvas,options={}){
 const T=THREE,C={cyan:0x67dce8,amber:0xffb96b,violet:0xa49aff,ice:0xc5e6ed,dim:0x255368,dark:0x091e2c};
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),lerp=(a,b,t)=>a+(b-a)*t,v=(...p)=>new T.Vector3(...p);
 let seed=20170612;const rand=(a=0,b=1)=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return a+(b-a)*seed/4294967296;};
 const resources=new Set(),track=o=>(resources.add(o),o),mats=new Map(),groups=[],motions=[],flows=[],labels=[],posesByChapter=[],textSprites=[];
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:!!options.preserveDrawingBuffer});
 renderer.setPixelRatio(Math.min(options.pixelRatio||window.devicePixelRatio||1,1.6));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NoToneMapping;
 const scene=new T.Scene();scene.background=new T.Color(0x030810);scene.fog=new T.FogExp2(0x050d18,.01);
 const camera=new T.PerspectiveCamera(55,1,.12,440),cube=track(new T.BoxGeometry(1,1,1));
 const origins=[[0,0,0],[20,8,-112],[65,22,-230],[0,44,-358],[-63,20,-478],[-25,-5,-594],[55,22,-712],[88,45,-844],[6,62,-976],[-63,91,-1118]];
 const origin=i=>v(...origins[i]);
 function material(color,opacity=1){const c=new T.Color(color),key=c.getHexString()+':'+opacity;if(mats.has(key))return mats.get(key);const m=track(new T.MeshStandardMaterial({color:c,metalness:.23,roughness:.48,emissive:c.getHex()===0xffffff?0x000000:c,emissiveIntensity:.12,transparent:opacity<1,opacity,depthWrite:opacity>.75}));mats.set(key,m);return m;}
 const box=(g,pos,size,color=C.cyan,opacity=1)=>{const o=new T.Mesh(cube,material(color,opacity));o.position.set(...pos);o.scale.set(...size);g.add(o);return o;};
 function instances(g,items,color=C.cyan,opacity=1){const o=new T.InstancedMesh(cube,material(items.some(it=>it.c!==undefined)?0xffffff:color,opacity),Math.max(1,items.length)),d=new T.Object3D();o.count=items.length;items.forEach((it,i)=>{d.position.set(...it.p);d.scale.set(...(it.s||[1,1,1]));d.rotation.set(...(it.r||[0,0,0]));d.updateMatrix();o.setMatrixAt(i,d.matrix);if(it.c!==undefined)o.setColorAt(i,new T.Color(it.c));});o.instanceMatrix.needsUpdate=true;o.computeBoundingSphere();g.add(o);track(o);return o;}
 function stroke(g,points,color=C.dim,opacity=.5,isSegments=false){const geo=track(new T.BufferGeometry().setFromPoints(points.map(p=>Array.isArray(p)?v(...p):p))),mat=track(new T.LineBasicMaterial({color,opacity,transparent:opacity<1,depthWrite:false})),o=isSegments?new T.LineSegments(geo,mat):new T.Line(geo,mat);g.add(o);return o;}
 const line=(g,p,c,o)=>stroke(g,p,c,o),segments=(g,p,c,o)=>stroke(g,p,c,o,true);
 function chapter(i){if(groups[i])return groups[i];const g=new T.Group();g.position.copy(origin(i));g.userData.chapter=i;scene.add(g);groups[i]=g;return g;}
 function owner(g){let a=g;while(a&&a.userData.chapter===undefined)a=a.parent;return a?a.userData.chapter:-1;}
 function flow(g,points,o={}){const curve=new T.CatmullRomCurve3(points.map(p=>Array.isArray(p)?v(...p):p),false,'catmullrom',.3),color=o.color===undefined?C.cyan:o.color,r=o.radius||.04;let object;
  if(r>.075){object=new T.Mesh(track(new T.TubeGeometry(curve,Math.max(12,points.length*7),r,4,false)),material(color,.65));g.add(object);}else object=line(g,curve.getPoints(Math.max(16,points.length*9)),color,.46);
  const packets=Array.from({length:o.count===undefined?3:o.count},()=>{const p=new T.Object3D();p.scale.setScalar(Math.max(.12,r*3.2));return p;});
  const f={g,curve,object,packets,speed:o.speed===undefined?.1:o.speed,phase:o.phase===undefined?rand():o.phase,color};flows.push(f);return f;}
 function matrix(g,o){const rows=o.rows,cols=o.cols,cell=o.cell||.65,dep=o.depth||.18,gg=new T.Group();gg.position.set(...(o.pos||[0,0,0]));g.add(gg);
  const vals=[],dummy=new T.Object3D(),mesh=new T.InstancedMesh(cube,material(0xffffff,o.opacity===undefined?1:o.opacity),rows*cols);track(mesh);gg.add(mesh);
  const cc=document.createElement('canvas');cc.width=Math.min(2048,cols*72);cc.height=Math.min(2048,rows*54);const ctx=cc.getContext('2d');
  const tex=track(new T.CanvasTexture(cc));tex.colorSpace=T.SRGBColorSpace;const tm=track(new T.MeshBasicMaterial({map:tex,transparent:true,opacity:(o.opacity===undefined?1:o.opacity)*.79,depthWrite:false,side:T.DoubleSide}));
  const overlay=new T.Mesh(track(new T.PlaneGeometry(cols*cell,rows*cell)),tm);overlay.position.z=dep*1.025+.016;gg.add(overlay);
  function set(values){ctx.clearRect(0,0,cc.width,cc.height);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='400 '+Math.max(9,Math.floor(cc.height/rows*.37))+'px ui-monospace, monospace';
   for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const i=row*cols+col;let value=typeof values==='function'?values(row,col):values&&values[i];if(!Number.isFinite(value))value=rand(-1,1);vals[i]=value;const mag=clamp(Math.abs(value));dummy.position.set((col-(cols-1)/2)*cell,((rows-1)/2-row)*cell,0);dummy.scale.set(cell*.84,cell*.84,dep*(.3+mag*1.7));dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);const bright=new T.Color(o.signed?(value<0?C.amber:C.cyan):(o.color===undefined?C.cyan:o.color)),dark=new T.Color(C.dark);dark.lerp(bright,.1+mag*.77);mesh.setColorAt(i,dark);ctx.fillStyle=mag<.005?'rgba(156,193,211,.28)':'rgba(225,245,248,.94)';ctx.fillText((value>=0?'+':'')+value.toFixed(2),(col+.5)*cc.width/cols,(row+.5)*cc.height/rows);}
   mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();tex.needsUpdate=true;}
  set(o.values);return {group:gg,mesh,values:vals,set};}
 function text(g,string,pos,o={}){const size=o.size||1,c=document.createElement('canvas'),ctx=c.getContext('2d');ctx.font='500 48px ui-monospace, SFMono-Regular, monospace';const tw=ctx.measureText(string).width;c.width=Math.min(2048,Math.max(64,Math.ceil(tw+28)));c.height=80;ctx.font='500 48px ui-monospace, SFMono-Regular, monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#'+new T.Color(o.color===undefined?C.ice:o.color===C.dim?0x8eb0bf:o.color).getHexString();ctx.shadowColor='rgba(0,4,12,.95)';ctx.shadowBlur=6;ctx.fillText(string,c.width/2,40,c.width-20);const tex=track(new T.CanvasTexture(c));tex.colorSpace=T.SRGBColorSpace;const mat=track(new T.SpriteMaterial({map:tex,transparent:true,depthWrite:false,sizeAttenuation:true}));const s=new T.Sprite(mat);s.position.set(...pos);s.scale.set(o.width||size*c.width/80,size,1);s.userData.baseWidth=s.scale.x;s.userData.baseHeight=size;textSprites.push({g,s});g.add(s);return s;}
 function label(g,string,pos,o={}){const a=new T.Object3D();a.position.set(...pos);g.add(a);labels.push({g,a,text:string,from:o.from||0,to:o.to===undefined?1:o.to,kind:o.kind||'concept'});}
 const animate=(g,fn)=>motions.push({g,fn}),poses=(i,ps)=>{if(ps.length!==3)throw Error('Three camera poses required');posesByChapter[i]=ps;};
 const K={T,C,clamp,lerp,rand,chapter,box,instances,line,segments,flow,matrix,text,label,animate,poses,track};
 buildAscentEarly(K);buildAscentLate(K);

 // Every chapter has a different spatial composition. One differentiable path
 // passes among them; the camera never resets or cuts to a replacement object.
 const eyePoints=[],lookPoints=[];
 for(let i=0;i<10;i++){const ps=posesByChapter[i]||[{eye:[20,15,50],target:[0,0,0]},{eye:[-12,8,32],target:[0,0,0]},{eye:[0,30,62],target:[0,0,0]}];for(const p of ps){eyePoints.push(v(...p.eye).add(origin(i)));lookPoints.push(v(...p.target).add(origin(i)));}}
 eyePoints.push(eyePoints.at(-1).clone().add(v(0,18,45)));lookPoints.push(lookPoints.at(-1).clone().add(v(0,0,-15)));
 const eyeCurve=new T.CatmullRomCurve3(eyePoints,false,'catmullrom',.22),lookCurve=new T.CatmullRomCurve3(lookPoints,false,'catmullrom',.22);
 // Interchapter sequences preserve token order. Each strip is a sampled tensor
 // row extending from one computation into the next, not an architectural rail.
 for(let i=0;i<9;i++){const g=chapter(i);for(let lane=0;lane<6;lane++){const dest=origin(i+1).sub(origin(i));const pts=[[lane*1.5-3.75,-9,-28],[lane*1.6-3.75,-13,-49],[dest.x+lane*1.6-3.75,dest.y-10,dest.z+42],[dest.x+lane*1.5-3.75,dest.y-8,dest.z+27]];flow(g,pts,{color:lane===3?C.amber:C.dim,count:5,speed:.017+lane*.001,radius:.035,phase:lane/7});}}
 const packetCount=flows.reduce((a,f)=>a+f.packets.length,0),packetMesh=new T.InstancedMesh(cube,material(C.amber),Math.max(1,packetCount));packetMesh.frustumCulled=false;track(packetMesh);scene.add(packetMesh);
 const packetDummy=new T.Object3D(),packetWorld=new T.Vector3();
 // Very distant data points establish parallax without substituting for anatomy.
 const dustPos=new Float32Array(4300*3),dustColors=new Float32Array(4300*3);for(let i=0;i<4300;i++){const z=rand(-1280,80),base=clamp(-z/120,0,9),oi=origins[Math.round(base)];dustPos[i*3]=oi[0]+rand(-120,120);dustPos[i*3+1]=oi[1]+rand(-65,95);dustPos[i*3+2]=z;const c=new T.Color(i%11===0?C.amber:C.cyan).multiplyScalar(rand(.12,.4));dustColors.set([c.r,c.g,c.b],i*3);}
 const dustGeo=track(new T.BufferGeometry());dustGeo.setAttribute('position',new T.BufferAttribute(dustPos,3));dustGeo.setAttribute('color',new T.BufferAttribute(dustColors,3));scene.add(new T.Points(dustGeo,track(new T.PointsMaterial({size:.095,vertexColors:true,transparent:true,opacity:.45,depthWrite:false}))));
 scene.add(new T.HemisphereLight(0xbedde9,0x162331,1.8));const key=new T.DirectionalLight(0xdcf4ff,2.5),rim=new T.DirectionalLight(0xffc992,1.15);scene.add(key,key.target,rim,rim.target);
 const fill=new T.PointLight(0x76dfff,95,85,2);scene.add(fill);
 const target=track(new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,depthBuffer:true,stencilBuffer:false})),postScene=new T.Scene(),postCamera=new T.OrthographicCamera(-1,1,1,-1,0,1);
 const postMat=track(new T.ShaderMaterial({uniforms:{frame:{value:target.texture},resolution:{value:new T.Vector2(1,1)},time:{value:0}},vertexShader:'varying vec2 uv0;void main(){uv0=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`uniform sampler2D frame;uniform vec2 resolution;uniform float time;varying vec2 uv0;
 vec3 hi(vec2 uv){vec3 c=texture2D(frame,uv).rgb;float m=max(max(c.r,c.g),c.b);return c*max(0.,m-.86)/(m+.001);}
 vec3 aces(vec3 c){return clamp(c*(2.51*c+.03)/(c*(2.43*c+.59)+.14),0.,1.);}
 void main(){vec2 px=1./resolution;vec3 c=texture2D(frame,uv0).rgb;vec3 bloom=vec3(0.);for(int i=0;i<8;i++){float a=float(i)*.785398;vec2 d=vec2(cos(a),sin(a));bloom+=hi(uv0+d*px*4.)*.044+hi(uv0+d*px*13.)*.022;}c=aces(c*.98+bloom*.28);c*=1.-.22*pow(length((uv0-.5)*vec2(1.,.9)),1.7);c=pow(c,vec3(1./2.2));float n=fract(sin(dot(uv0*resolution+mod(time,60.),vec2(12.9898,78.233)))*43758.5453);gl_FragColor=vec4(c+(n-.5)*.004,1.);}`,depthTest:false,depthWrite:false,toneMapped:false}));
 postScene.add(new T.Mesh(track(new T.PlaneGeometry(2,2)),postMat));
 let width=1,height=1,disposed=false,screenLabels=[],active=0;const pointer={x:0,y:0};
 function resize(w,h){width=Math.max(1,w);height=Math.max(1,h);renderer.setSize(width,height,false);camera.aspect=width/height;camera.fov=width<520?69:55;camera.updateProjectionMatrix();const r=renderer.getPixelRatio();target.setSize(Math.round(width*r),Math.round(height*r));postMat.uniforms.resolution.value.set(width*r,height*r);}
 function render(index,p,time){if(disposed)return;active=clamp(Math.floor(Number(index)||0),0,9);p=clamp(Number(p)||0);const t=Number(time)||0,q=(active+p)/10,eye=eyeCurve.getPoint(q),look=lookCurve.getPoint(q);
  if(width<520)eye.sub(look).multiplyScalar(1.26).add(look);eye.x+=pointer.x*.28;eye.y+=pointer.y*.2;camera.position.copy(eye);camera.lookAt(look);camera.rotateZ(Math.sin(q*19)*.009);
  key.position.copy(eye).add(v(-28,48,20));key.target.position.copy(look);rim.position.copy(look).add(v(38,12,-28));rim.target.position.copy(look);fill.position.copy(eye).add(v(8,6,-12));
  groups.forEach((g,i)=>g.visible=Math.abs(i-active)<=1);motions.forEach(a=>{const i=owner(a.g);if(Math.abs(i-active)<=1)a.fn(t,clamp(active+p-i));});
  scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  const textWorld=new T.Vector3(),textCamera=new T.Vector3(),frustumHeight=2*Math.tan(camera.fov*Math.PI/360),occupied=[];
  for(const {g,s} of [...textSprites].sort((a,b)=>b.s.userData.baseHeight-a.s.userData.baseHeight)){s.visible=owner(g)===active;if(!s.visible)continue;s.getWorldPosition(textWorld);textCamera.copy(textWorld).applyMatrix4(camera.matrixWorldInverse);const dist=-textCamera.z,base=s.userData.baseHeight;const factor=Math.max(1.45,Math.min(2.8,10.5*dist*frustumHeight/(height*base*.6)));s.scale.set(s.userData.baseWidth*factor,base*factor,1);textWorld.project(camera);const x=(textWorld.x*.5+.5)*width,y=(.5-textWorld.y*.5)*height,hh=s.scale.y*height/(dist*frustumHeight)*.43,hw=s.scale.x*height/(dist*frustumHeight)*.5;
   const rect={l:x-hw,r:x+hw,t:y-hh,b:y+hh};if(dist<0||rect.l<10||rect.r>width-10||rect.t<height*.22||rect.b>height*.79||occupied.some(b=>rect.l<b.r+4&&rect.r>b.l-4&&rect.t<b.b+3&&rect.b>b.t-3)){s.visible=false;continue;}occupied.push(rect);
  }scene.updateMatrixWorld(true);
  let pi=0;for(const f of flows){if(Math.abs(owner(f.g)-active)>1||!f.object.visible)continue;let visible=true;for(let a=f.g;a&&a!==scene;a=a.parent)if(!a.visible)visible=false;if(!visible)continue;f.packets.forEach((pk,j)=>{if(!pk.visible)return;const u=((t*f.speed+f.phase+j/f.packets.length)%1+1)%1;pk.position.copy(f.curve.getPoint(u));packetWorld.copy(pk.position).applyMatrix4(f.g.matrixWorld);packetDummy.position.copy(packetWorld);packetDummy.scale.copy(pk.scale);packetDummy.rotation.set(t*.24+j,t*.3,0);packetDummy.updateMatrix();packetMesh.setMatrixAt(pi,packetDummy.matrix);packetMesh.setColorAt(pi,new T.Color(f.color===C.violet?C.violet:C.amber));pi++;});}packetMesh.count=pi;packetMesh.instanceMatrix.needsUpdate=true;if(packetMesh.instanceColor)packetMesh.instanceColor.needsUpdate=true;
  screenLabels=labels.filter(l=>owner(l.g)===active&&p>=l.from&&p<=l.to).slice(0,1).map(l=>({text:l.text,x:.5,y:width<520?.70:.73,visible:true,kind:l.kind}));
  renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.setRenderTarget(null);postMat.uniforms.time.value=t;renderer.render(postScene,postCamera);
 }
 function dispose(){if(disposed)return;disposed=true;resources.forEach(r=>r.dispose&&r.dispose());resources.clear();mats.clear();scene.clear();postScene.clear();motions.length=flows.length=labels.length=0;screenLabels=[];renderer.dispose();}
 resize(canvas.clientWidth||736,canvas.clientHeight||570);
 return {render,resize,setPointer:(x,y)=>{pointer.x=clamp(Number(x)||0,-1,1);pointer.y=clamp(Number(y)||0,-1,1);},getLabels:()=>screenLabels.map(l=>({...l})),dispose,renderer};
}

/* Original procedural score for AI Ascent. No samples or network requests. */
function createAscentScore() {
  'use strict';

  // Each chapter keeps D as a harmonic home; the horizon remains unresolved.
  const scenes = [
    { notes: [50, 57, 60, 64, 69], bass: 26, pace: 1.85, glow: 0.20, air: 0.30 },
    { notes: [50, 57, 62, 65, 69], bass: 26, pace: 1.34, glow: 0.31, air: 0.36 },
    { notes: [46, 53, 60, 62, 65], bass: 22, pace: 1.13, glow: 0.38, air: 0.42 },
    { notes: [50, 57, 60, 65, 69], bass: 26, pace: 0.87, glow: 0.54, air: 0.52 },
    { notes: [48, 55, 62, 64, 69], bass: 24, pace: 1.05, glow: 0.46, air: 0.40 },
    { notes: [46, 53, 60, 65, 69], bass: 22, pace: 1.22, glow: 0.41, air: 0.35 },
    { notes: [50, 57, 64, 65, 72], bass: 26, pace: 0.91, glow: 0.64, air: 0.58 },
    { notes: [48, 55, 62, 65, 69], bass: 24, pace: 0.74, glow: 0.69, air: 0.51 },
    { notes: [50, 57, 62, 64, 69], bass: 26, pace: 0.64, glow: 0.81, air: 0.68 },
    { notes: [50, 57, 64, 69, 76], bass: 26, pace: 1.65, glow: 0.70, air: 0.77 }
  ];
  const pattern = [0, 2, 4, 1, 3, 2, 4, 0, 3, 1, 4, 2];
  const frequency = midi => 440 * Math.pow(2, (midi - 69) / 12);
  let ctx, master, mix, send, delay, delayGain, padFilter, airGain, sub;
  let chapter = 0, muted = false, playing = false, disposed = false;
  let timer = null, suspendTimer = null, nextNote = 0, step = 0;
  let transportVersion = 0;
  const pads = [], perpetual = [], liveNotes = new Set();

  function glide(param, value, seconds = 1.8) {
    const now = ctx.currentTime;
    if (typeof param.cancelAndHoldAtTime === 'function') param.cancelAndHoldAtTime(now);
    else {
      const present = param.value;
      param.cancelScheduledValues(now);
      param.setValueAtTime(present, now);
    }
    param.setTargetAtTime(value, now, Math.max(0.015, seconds / 3));
  }

  function reverbBuffer() {
    const duration = 3.2;
    const buffer = ctx.createBuffer(2, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
    // Deterministic, independently seeded channels create a broad diffuse room.
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let seed = channel ? 846721 : 296113;
      let smooth = 0;
      for (let i = 0; i < data.length; i++) {
        seed = (1664525 * seed + 1013904223) >>> 0;
        smooth = smooth * 0.68 + ((seed / 4294967296) * 2 - 1) * 0.32;
        const t = i / ctx.sampleRate;
        data[i] = smooth * Math.exp(-t * 2.05) * Math.min(1, t / 0.022);
      }
    }
    return buffer;
  }

  function initialize() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    ctx = new AudioContextClass({ latencyHint: 'playback' });

    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -19;
    limiter.knee.value = 18;
    limiter.ratio.value = 3;
    limiter.attack.value = 0.02;
    limiter.release.value = 0.35;
    master = ctx.createGain();
    master.gain.value = 0;
    mix = ctx.createGain();
    mix.gain.value = 0.72;
    mix.connect(limiter);
    limiter.connect(master);
    master.connect(ctx.destination);

    const room = ctx.createConvolver();
    room.buffer = reverbBuffer();
    const roomTone = ctx.createBiquadFilter();
    roomTone.type = 'lowpass';
    roomTone.frequency.value = 3800;
    send = ctx.createGain();
    send.gain.value = 0.48;
    send.connect(room);
    room.connect(roomTone);
    roomTone.connect(mix);

    delay = ctx.createDelay(1);
    delay.delayTime.value = 0.57;
    const echoTone = ctx.createBiquadFilter();
    echoTone.type = 'lowpass';
    echoTone.frequency.value = 2100;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.26;
    delayGain = ctx.createGain();
    delayGain.gain.value = 0.20;
    delay.connect(echoTone);
    echoTone.connect(feedback);
    feedback.connect(delay);
    echoTone.connect(delayGain);
    delayGain.connect(mix);
    delayGain.connect(send);

    padFilter = ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 900;
    padFilter.Q.value = 0.25;
    padFilter.connect(mix);
    padFilter.connect(send);

    for (let i = 0; i < 5; i++) {
      const amp = ctx.createGain();
      amp.gain.value = 0.017;
      const pan = ctx.createStereoPanner();
      pan.pan.value = (i - 2) * 0.30;
      amp.connect(pan);
      pan.connect(padFilter);
      const pair = [];
      for (let j = 0; j < 2; j++) {
        const osc = ctx.createOscillator();
        osc.type = j ? 'triangle' : 'sine';
        osc.frequency.value = frequency(scenes[chapter].notes[i]);
        osc.detune.value = (j ? 1 : -1) * (3 + i * 0.65);
        const level = ctx.createGain();
        level.gain.value = j ? 0.42 : 0.82;
        osc.connect(level);
        level.connect(amp);
        osc.start();
        perpetual.push(osc);
        pair.push(osc);
      }
      const tide = ctx.createOscillator();
      tide.frequency.value = 0.027 + i * 0.0067;
      const tideDepth = ctx.createGain();
      tideDepth.gain.value = 0.004;
      tide.connect(tideDepth);
      tideDepth.connect(amp.gain);
      tide.start();
      perpetual.push(tide);
      pads.push({ pair, amp });
    }

    sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = frequency(scenes[chapter].bass);
    const subGain = ctx.createGain();
    subGain.gain.value = 0.068;
    sub.connect(subGain);
    subGain.connect(mix);
    sub.start();
    perpetual.push(sub);

    const airBuffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const air = airBuffer.getChannelData(0);
    let smooth = 0, seed = 827;
    for (let i = 0; i < air.length; i++) {
      seed = (1664525 * seed + 1013904223) >>> 0;
      smooth = smooth * 0.96 + ((seed / 4294967296) * 2 - 1) * 0.04;
      // Window the loop boundary so the atmosphere has no clicks.
      air[i] = smooth * Math.min(1, i / 1600, (air.length - i - 1) / 1600);
    }
    const breeze = ctx.createBufferSource();
    breeze.buffer = airBuffer;
    breeze.loop = true;
    const airBand = ctx.createBiquadFilter();
    airBand.type = 'bandpass';
    airBand.frequency.value = 1300;
    airBand.Q.value = 0.45;
    airGain = ctx.createGain();
    airGain.gain.value = 0.023;
    breeze.connect(airBand);
    airBand.connect(airGain);
    airGain.connect(send);
    breeze.start();
    perpetual.push(breeze);
    applyScene();
    return true;
  }

  function applyScene() {
    if (!ctx || disposed) return;
    const scene = scenes[chapter];
    pads.forEach(({ pair, amp }, i) => {
      pair.forEach(osc => glide(osc.frequency, frequency(scene.notes[i]), 3.8));
      glide(amp.gain, 0.014 + scene.glow * 0.008 + (i === 0 ? 0.003 : 0), 4);
    });
    glide(sub.frequency, frequency(scene.bass), 3.5);
    glide(padFilter.frequency, 700 + scene.glow * 1350, 5);
    glide(airGain.gain, 0.018 + scene.air * 0.026, 4);
    glide(delayGain.gain, 0.14 + scene.glow * 0.12, 3);
  }

  function pluck(at, midi, strength, panValue) {
    const fundamental = ctx.createOscillator();
    const overtone = ctx.createOscillator();
    const amp = ctx.createGain();
    const harmonic = ctx.createGain();
    const pan = ctx.createStereoPanner();
    fundamental.type = 'sine';
    overtone.type = 'sine';
    fundamental.frequency.value = frequency(midi);
    overtone.frequency.value = frequency(midi) * 2;
    overtone.detune.value = 2.5;
    harmonic.gain.value = 0.12;
    fundamental.connect(amp);
    overtone.connect(harmonic);
    harmonic.connect(amp);
    amp.connect(pan);
    pan.pan.value = panValue;
    pan.connect(mix);
    pan.connect(send);
    pan.connect(delay);
    amp.gain.setValueAtTime(0, at);
    amp.gain.linearRampToValueAtTime(strength, at + 0.023);
    amp.gain.exponentialRampToValueAtTime(0.0001, at + 3.4);
    amp.gain.linearRampToValueAtTime(0, at + 3.65);
    fundamental.start(at);
    overtone.start(at);
    fundamental.stop(at + 3.7);
    overtone.stop(at + 3.7);
    const nodes = [fundamental, overtone, harmonic, amp, pan];
    liveNotes.add(nodes);
    fundamental.onended = () => {
      nodes.forEach(node => node.disconnect());
      liveNotes.delete(nodes);
    };
  }

  function schedule() {
    if (!playing || !ctx || disposed || ctx.state !== 'running') return;
    const scene = scenes[chapter];
    const now = ctx.currentTime;
    if (nextNote < now) nextNote = now + 0.06;
    while (nextNote < now + 0.24) {
      const index = pattern[step % pattern.length];
      // Occasional rests and register changes keep the figure from feeling mechanical.
      if (step % 7 !== 5 && !(chapter === 9 && step % 3 === 1)) {
        const octave = step % 8 === 6 ? 24 : 12;
        const strength = (0.031 + scene.glow * 0.019) * (step % 4 === 0 ? 1 : 0.70);
        pluck(nextNote, scene.notes[index] + octave, strength, Math.sin(step * 1.71) * 0.68);
      }
      const breathing = 1 + 0.07 * Math.sin(step * 0.61);
      nextNote += scene.pace * breathing;
      step++;
    }
  }

  async function start() {
    if (disposed) return false;
    const version = ++transportVersion;
    if (suspendTimer !== null) clearTimeout(suspendTimer);
    suspendTimer = null;
    try {
      if (!ctx && !initialize()) return false;
      playing = true;
      await ctx.resume();
      if (disposed || !playing || version !== transportVersion) return false;
      glide(master.gain, muted ? 0 : 0.56, 1.5);
      if (timer === null) {
        nextNote = ctx.currentTime + 0.18;
        schedule();
        timer = setInterval(schedule, 120);
      }
      return true;
    } catch (_) {
      if (version === transportVersion) playing = false;
      return false;
    }
  }

  function pause() {
    playing = false;
    const version = ++transportVersion;
    if (timer !== null) clearInterval(timer);
    timer = null;
    if (suspendTimer !== null) clearTimeout(suspendTimer);
    if (!ctx || disposed) return;
    glide(master.gain, 0, 0.22);
    suspendTimer = setTimeout(() => {
      suspendTimer = null;
      if (!disposed && !playing && version === transportVersion) ctx.suspend().catch(() => {});
    }, 300);
  }

  function setChapter(index) {
    if (disposed || !Number.isFinite(Number(index))) return;
    const next = Math.max(0, Math.min(9, Math.floor(Number(index))));
    if (chapter === next) return;
    chapter = next;
    step = 0;
    if (ctx) {
      applyScene();
      nextNote = ctx.currentTime + 0.65;
    }
  }

  function setMuted(value) {
    muted = Boolean(value);
    if (ctx && !disposed) glide(master.gain, playing && !muted ? 0.56 : 0, 0.30);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    playing = false;
    transportVersion++;
    if (timer !== null) clearInterval(timer);
    if (suspendTimer !== null) clearTimeout(suspendTimer);
    timer = suspendTimer = null;
    if (!ctx) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.value = 0;
    perpetual.forEach(node => { try { node.stop(); } catch (_) {} });
    liveNotes.forEach(nodes => nodes.forEach(node => {
      if (typeof node.stop === 'function') { try { node.stop(); } catch (_) {} }
      node.disconnect();
    }));
    liveNotes.clear();
    ctx.close().catch(() => {});
  }

  return { start, pause, setChapter, setMuted, dispose };
}

window.createAscentScore = createAscentScore;

(function () {
  'use strict';
  const css = `
    .ascent-concept{font:14px/1.55 system-ui,sans-serif;color:inherit;--ac-line:color-mix(in srgb,currentColor 18%,transparent);--ac-fill:color-mix(in srgb,currentColor 5%,transparent);--ac-accent:var(--viz-series-1);max-width:1120px;margin:auto}
    .ascent-concept *{box-sizing:border-box}.ascent-concept h3{font-size:22px;font-weight:500;line-height:1.25;margin:0 0 10px}.ascent-concept p{margin:0 0 12px}.ascent-concept .ac-copy{max-width:850px;opacity:.88}.ascent-concept .ac-instruction{font-size:13px;opacity:.66;margin:4px 0 20px}.ascent-concept .ac-controls{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:14px 0}.ascent-concept .ac-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.ascent-concept .ac-wide{grid-column:1/-1}.ascent-concept .ac-note{font-size:12px;opacity:.66;margin-top:13px}.ascent-concept .ac-big{font-size:30px;line-height:1.2;font-weight:500;font-variant-numeric:tabular-nums;letter-spacing:-.035em}.ascent-concept .ac-muted{opacity:.62;font-size:12px}.ascent-concept .ac-label{font-size:12px;letter-spacing:.06em;text-transform:uppercase;opacity:.68;margin-bottom:6px}.ascent-concept .ac-track{height:10px;border-radius:9px;background:var(--ac-fill);overflow:hidden;flex:1;min-width:45px}.ascent-concept .ac-bar{height:100%;background:var(--ac-accent);border-radius:9px}.ascent-concept .ac-strip{display:flex;align-items:center;gap:12px;margin:10px 0;font-size:13px}.ascent-concept .ac-strip>span:first-child{width:105px;flex-shrink:0}.ascent-concept .ac-num{width:48px;text-align:right;font-variant-numeric:tabular-nums}.ascent-concept .ac-steps{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.ascent-concept .ac-flow{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.ascent-concept .ac-node{border:1px solid var(--ac-line);border-radius:8px;padding:12px;flex:1;min-width:100px;text-align:center}.ascent-concept .ac-node.is-active{border-color:var(--ac-accent);background:color-mix(in srgb,var(--ac-accent) 12%,transparent)}.ascent-concept .ac-arrow{opacity:.5}.ascent-concept .ac-table-wrap{overflow:auto}.ascent-concept table{border-collapse:separate;border-spacing:4px;width:100%;font-size:12px;text-align:center;table-layout:fixed;min-width:380px}.ascent-concept th{font-weight:500;padding:2px}.ascent-concept td{height:40px;border-radius:5px;font-variant-numeric:tabular-nums}.ascent-concept tr.is-query td{outline:1px solid color-mix(in srgb,var(--ac-accent) 65%,transparent)}.ascent-concept .ac-mask{opacity:.35;background:repeating-linear-gradient(135deg,transparent,transparent 4px,var(--ac-fill) 4px,var(--ac-fill) 6px)}.ascent-concept .ac-rank{display:flex;gap:14px;align-items:center;padding:13px 0;border-bottom:1px solid var(--ac-line)}.ascent-concept .ac-rank:last-child{border-bottom:0}.ascent-concept .ac-rank-copy{flex:1}.ascent-concept .ac-rank-controls{display:flex;gap:5px}.ascent-concept .ac-log{padding-left:21px;margin:8px 0}.ascent-concept .ac-log li{padding:5px 0}.ascent-concept .ac-done{opacity:.6}.ascent-concept output{font-variant-numeric:tabular-nums}.ascent-concept .ac-result{border-left:2px solid var(--ac-accent);padding:9px 0 9px 16px;margin-top:15px}.ascent-concept .ac-code{font:13px/1.7 ui-monospace,SFMono-Regular,monospace;white-space:pre-wrap}.ascent-concept .ac-pills{display:flex;gap:6px;flex-wrap:wrap}.ascent-concept .ac-pill{font-size:12px;padding:5px 9px;border:1px solid var(--ac-line);border-radius:30px}.ascent-concept .ac-icon{font-size:28px;margin:5px 0}.ascent-concept .ac-stat-pair{display:flex;justify-content:space-between;gap:15px;margin-top:10px}@media(max-width:660px){.ascent-concept .ac-grid{grid-template-columns:1fr}.ascent-concept .ac-rank{gap:8px}.ascent-concept .ac-big{font-size:26px}.ascent-concept .ac-flow .ac-node{min-width:80px}.ascent-concept .ac-rank-controls{flex-direction:column}.ascent-concept .ac-controls{align-items:flex-start}}
  `;
  function node(tag, cls, txt) { const e=document.createElement(tag); if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e; }
  function softmax(a){const m=Math.max(...a),exp=a.map(v=>Math.exp(v-m)),sum=exp.reduce((s,v)=>s+v,0);return exp.map(v=>v/sum);}
  window.mountAscentConcept=function(container,chapterIndex){
    const root=node('div','ascent-concept'),listeners=[];const style=node('style');style.textContent=css;root.append(style);container.replaceChildren(root);
    function on(el,type,fn){el.addEventListener(type,fn);listeners.push(()=>el.removeEventListener(type,fn));return el;}
    function button(text,fn){const b=node('button','btn',text);b.type='button';return on(b,'click',fn);}
    function panel(title){const p=node('div','card ac-panel');if(title)p.append(node('div','ac-label',title));return p;}
    function intro(title,copy,instruction){root.append(node('h3','',title),node('p','ac-copy',copy),node('p','ac-instruction',instruction));}
    function select(label,options,change){const l=node('label','form-label',label),s=node('select','form-select');options.forEach((o,i)=>{const op=node('option','',o);op.value=i;s.append(op);});on(s,'change',()=>change(Number(s.value)));l.append(s);return {el:l,input:s};}
    function check(label,value,change){const l=node('label','form-check'),s=node('input','form-check-input');s.type='checkbox';s.checked=value;on(s,'change',()=>change(s.checked));l.append(s,node('span','form-check-label',label));return l;}
    function range(label,min,max,value,change){const l=node('label','form-label',label),s=node('input','form-range');s.type='range';s.min=min;s.max=max;s.step=1;s.value=value;s.setAttribute('aria-label',label);on(s,'input',()=>change(Number(s.value)));l.append(s);return {el:l,input:s};}
    function strip(parent,label,fraction,value){const row=node('div','ac-strip'),track=node('div','ac-track'),bar=node('div','ac-bar');bar.style.width=Math.max(0,Math.min(100,fraction*100))+'%';track.append(bar);row.append(node('span','',label),track,node('span','ac-num',value));parent.append(row);}
    function steps(labels,current,change){const box=node('div','ac-steps');labels.forEach((label,i)=>{const b=button(label,()=>change(i));b.setAttribute('aria-pressed',String(i===current));box.append(b);});return box;}
    function note(text){root.append(node('p','ac-note',text));}

    if(chapterIndex===0){
      intro('Six ideas, one evolving system','The arc is cumulative: architecture determines how information moves; training shapes what the model can do; tools connect its output to the world. Each advance changes a different part of the system.','Select an idea to see what it contributes and what it cannot establish on its own.');
      const data=[['Attention','Context-sensitive connections','Tokens exchange weighted information. The same word can acquire different representations in different sentences.','Attention supplies a mechanism; its useful behavior must be learned.'],['Pretraining','Reusable statistical structure','Prediction errors adjust parameters across many examples, producing patterns that transfer to later tasks.','A good prediction can still contain a false statement.'],['Scale + data','More effective training','Greater resources and better allocation can lower prediction loss within the regimes researchers measure.','Loss curves do not specify a date for AGI.'],['Human feedback','A more useful assistant','Demonstrations and preferences change which responses training rewards.','Preference and factual correctness are different signals.'],['Reasoning effort','More work per answer','Additional inference compute and external checks can help on difficult tasks.','Extra effort does not guarantee a correct result.'],['Tools + context','Work across an environment','A model can request actions, inspect observations, and carry state across a workflow.','Completion must be checked against the actual request.']];
      const area=node('div');root.append(area);let selected=0;
      function render(){area.replaceChildren(steps(data.map(d=>d[0]),selected,i=>{selected=i;render();}));const p=panel(data[selected][0]);p.append(node('h3','',data[selected][1]),node('p','',data[selected][2]),node('div','ac-result',data[selected][3]));area.append(p);}render();
    } else if(chapterIndex===1){
      intro('Attention is a weighted conversation','Each token projects its representation into a query, a key, and a value. A scaled dot product scores query–key matches; softmax normalizes those scores; the output is a weighted sum of value vectors.','Choose a query token or a different head. Compare GPT’s causal mask with unrestricted attention.');
      const words=['The','robot','moved','the','crate'],values=[[.2,.8],[.8,.3],[.6,.6],[.1,.9],[.9,.1]];
      const qs=[[[.3,.8],[1,.2],[.9,.9],[.2,1],[.6,.9]],[[1,.2],[.8,.6],[.4,1],[.2,.9],[.9,.4]]];
      const ks=[[[.1,.9],[1,.4],[.8,.7],[.2,1],[.9,.6]],[[.7,.1],[1,.5],[.2,.8],[.1,1],[.9,.2]]];
      let query=2,head=0,unmasked=false;const controls=node('div','viz-controls ac-controls'),area=node('div','ac-grid');
      const q=select('Query token',words,i=>{query=i;render();});q.input.value=query;
      controls.append(q.el,select('Attention head',['Head A','Head B'],i=>{head=i;render();}).el,check('Compare unrestricted attention',false,v=>{unmasked=v;render();}));root.append(controls,area);
      function scores(row){return ks[head].map(k=>(qs[head][row][0]*k[0]+qs[head][row][1]*k[1])/Math.sqrt(2));}
      function weights(row){const a=scores(row).map((s,i)=>!unmasked&&i>row?-Infinity:s);return softmax(a);}
      function render(){q.input.value=query;area.replaceChildren();const p=panel('Attention weights · each row sums to 100%'),wrap=node('div','ac-table-wrap'),table=node('table');table.setAttribute('aria-label','Illustrative attention weights, query tokens in rows and key tokens in columns');const thead=node('thead'),hr=node('tr');hr.append(node('th','','Query / key'));words.forEach((w,i)=>hr.append(node('th','',w+' '+(i+1))));thead.append(hr);table.append(thead);const body=node('tbody');
        words.forEach((w,r)=>{const tr=node('tr',r===query?'is-query':''),th=node('th'),b=button(w,()=>{query=r;render();});b.setAttribute('aria-label','Select query '+w+', position '+(r+1));b.setAttribute('aria-pressed',String(r===query));th.append(b);tr.append(th);weights(r).forEach((v,col)=>{const blocked=!unmasked&&col>r,td=node('td',blocked?'ac-mask':'',blocked?'—':(v*100).toFixed(0)+'%');td.title=blocked?'Future position masked':w+' → '+words[col]+': '+(v*100).toFixed(2)+'%';if(!blocked)td.style.background='color-mix(in srgb,var(--ac-accent) '+Math.round(6+v*74)+'%,transparent)';tr.append(td);});body.append(tr);});table.append(body);wrap.append(table);p.append(wrap,node('p','ac-note',unmasked?'Unrestricted comparison: every key is visible. This is not GPT’s causal pattern.':'Causal mask: future keys are blocked before softmax. Displayed percentages are rounded.'));area.append(p);
        const result=panel('Selected query: '+words[query]+' · position '+(query+1)),w=weights(query),sc=scores(query);result.append(node('p','ac-code','q = ['+qs[head][query].join(', ')+']\nscore = dot(q, key) / √2'));words.forEach((word,i)=>strip(result,word+' · '+(i+1),w[i],(w[i]*100).toFixed(1)+'%'));const mix=values[0].map((_,d)=>w.reduce((sum,v,i)=>sum+v*values[i][d],0));result.append(node('div','ac-result','Weighted value blend = ['+mix.map(n=>n.toFixed(3)).join(', ')+']'));strip(result,'Value feature 1',mix[0],mix[0].toFixed(2));strip(result,'Value feature 2',mix[1],mix[1].toFixed(2));const details=node('details'),summary=node('summary','','Inspect scores and values');details.append(summary);sc.forEach((v,i)=>details.append(node('div','ac-code',words[i]+' '+(i+1)+': score '+v.toFixed(3)+' · value ['+values[i].join(', ')+']'+(!unmasked&&i>query?' · masked':''))));result.append(details);area.append(result);
      }render();note('All vectors are invented two-dimensional examples. Actual heads use learned projections, and their functions are not restricted to fixed linguistic roles. Multiple heads are combined and transformed by later layers.');
    } else if(chapterIndex===2){
      intro('Changing weights is different from changing context','Training uses prediction error to update parameters. During ordinary generation, the prompt instead changes the activations flowing through fixed parameters. This small model makes that distinction visible.','Apply a training update, then switch to context mode and change the instruction. Watch the weights.');
      let mode=0,context=0,count=0,w=[.5,0,-.3];const area=node('div');root.append(area);const words=['blue','azure','green'];
      function render(){area.replaceChildren(steps(['Training · weights can change','In context · weights are frozen'],mode,i=>{mode=i;render();}));const grid=node('div','ac-grid'),left=panel(mode===0?'Training example':'Prompt context'),right=panel('Toy next-token distribution');left.append(node('p','ac-code','The sky is …'));
        if(mode===0){left.append(node('p','','Observed next token: blue'),button('Apply one training update',()=>{const p=softmax(w);w=w.map((v,i)=>v-.6*(p[i]-(i===0?1:0)));count++;render();}),node('div','ac-result',count+' gradient update'+(count===1?'':'s')+' applied.'));}else{const s=select('Instruction',['No extra style instruction','Prefer the poetic word “azure”'],i=>{context=i;render();});s.input.value=context;left.append(s.el,node('div','ac-result','Parameters stay fixed. The instruction supplies a context-dependent bias in this toy example.'));}
        left.append(node('div','ac-code','Stored weights: ['+w.map(v=>v.toFixed(3)).join(', ')+']'));const p=softmax(w.map((v,i)=>v+(mode===1&&context===1&&i===1?2.4:0)));words.forEach((word,i)=>strip(right,word,p[i],(100*p[i]).toFixed(1)+'%'));right.append(node('p','ac-note','Training loss for target “blue”: '+(-Math.log(p[0])).toFixed(3)+' nats'));grid.append(left,right);area.append(grid);const b=button('Reset demonstration',()=>{w=[.5,0,-.3];count=0;context=0;render();});const controls=node('div','viz-controls ac-controls');controls.append(b);area.append(controls);}render();note('An illustrative three-logit model uses softmax and cross-entropy gradients, with learning rate 0.6. Context adds a hand-authored logit bias; a real Transformer computes context effects through its learned layers.');
    } else if(chapterIndex===3){
      intro('A power law removes a fraction of error','A simple scaling model is L = L∞ + A·C⁻ᵅ, where C is compute and L∞ is a floor. Here α is set to an illustrative 0.10. Increasing compute tenfold leaves about 79% of the previous reducible loss.','Move the compute slider. Compare the selected investment with a further tenfold increase.');
      const controls=node('div','viz-controls ac-controls'),out=node('output'),r=range('Training compute · logarithmic scale',0,60,0,render);r.el.insertBefore(out,r.input);controls.append(r.el);root.append(controls);const chart=node('div'),stat=node('div','ac-result');chart.setAttribute('role','img');stat.setAttribute('aria-live','polite');root.append(chart,stat);
      const format=C=>C.toLocaleString('en-US',{maximumFractionDigits:1})+'×';
      function render(value=0){const C=10**(value/10),remaining=C**-.1,next=(C*10)**-.1;out.textContent=format(C);r.input.setAttribute('aria-valuetext',format(C)+' training compute');chart.replaceChildren(node('div','ac-label','Relative reducible loss · baseline = 100%'));
        [[1,1,'Baseline'],[C,remaining,'Selected'],[C*10,next,'A further 10×']].forEach(([compute,loss,label])=>{const row=node('div');row.append(node('div','ac-muted',label+' · '+format(compute)+' compute'));strip(row,'Loss remaining',loss,(loss*100).toFixed(1)+'%');chart.append(row);});chart.setAttribute('aria-label','Illustrative reducible loss: baseline 100%; at '+format(C)+' compute, '+(remaining*100).toFixed(1)+'%; at '+format(C*10)+' compute, '+(next*100).toFixed(1)+'%.');stat.textContent='A further 10× compute removes '+((remaining-next)*100).toFixed(1)+' percentage points of baseline loss: about 21% of the reducible loss left at your selection.';
      }render();note('Illustrative curve only, not fitted data or a capability forecast. Every bar shares the 0–100% baseline scale. The loss floor L∞ is excluded. Real scaling depends on model size, data, optimization, and the measured regime.');
    } else if(chapterIndex===4){
      intro('A fixed compute budget forces a tradeoff','Training compute is roughly proportional to parameters times training tokens, C ∝ N·D. Increasing one while keeping compute fixed means reducing the other. Chinchilla showed that many large models had too little data for their size.','Move the allocation slider to trade model capacity against training tokens.');
      const controls=node('div','viz-controls ac-controls'),r=range('Relative model allocation at fixed training compute',0,100,50,render);controls.append(node('span','','More data'),r.el,node('span','','Larger model'));root.append(controls);const area=node('div','ac-grid');root.append(area);
      function render(v=50){const N=2**((v-50)/25),D=1/N,E=(N**-.5+D**-.5)/2;area.replaceChildren();const left=panel('Fixed training compute: N × D = 1'),right=panel('Illustrative allocation penalty');strip(left,'Parameters N',N/4,N.toFixed(2)+'×');strip(left,'Tokens D',D/4,D.toFixed(2)+'×');left.append(node('div','ac-code',N.toFixed(2)+' × '+D.toFixed(2)+' ≈ 1.00'));right.append(node('div','ac-big',(E*100).toFixed(1)),node('div','ac-muted','Toy error index · 100 is the minimum'),node('div','ac-result',v===50?'Balanced allocation in this symmetric example.':v>50?'More capacity, fewer examples: the model becomes undertrained in this toy regime.':'More examples, less capacity: the smaller model limits this toy regime.'));area.append(left,right);r.input.setAttribute('aria-valuetext',N.toFixed(2)+' times parameters and '+D.toFixed(2)+' times training tokens');}render();const historical=panel('The historical experiment');historical.style.marginTop='16px';historical.append(node('p','','Gopher: 280B parameters. Chinchilla: 70B parameters and 4× the training data, at the same training compute.'),node('p','ac-muted','Chinchilla performed better across the paper’s evaluations.'));root.append(historical);note('The toy objective is E = (N⁻⁰·⁵ + D⁻⁰·⁵)/2. Its symmetric optimum explains allocation; it does not reproduce Chinchilla’s fitted law. Optimal choices also depend on inference costs, data quality, and the objective.');
    } else if(chapterIndex===5){
      intro('Preference is a teaching signal, not a truth test','People rank candidate answers, and a reward model learns to predict those preferences. Reinforcement learning can then favor higher-scoring responses. A preference ranking can reflect clarity or style while missing a factual error.','Rank these fictional answers with the arrows, then reveal a separate correctness check.');
      const answers=['323. Calculate 17 × (20 − 1) = 340 − 17.','Certainly! The answer is 343.','323.'];let order=[1,2,0],reveal=false;const area=panel('Prompt: What is 17 × 19?');root.append(area);
      function render(){area.replaceChildren(node('div','ac-label','Prompt: What is 17 × 19?'));order.forEach((id,pos)=>{const row=node('div','ac-rank'),copy=node('div','ac-rank-copy'),buttons=node('div','ac-rank-controls');copy.append(node('div','',answers[id]),node('div','ac-muted','Preference position '+(pos+1)+(reveal?' · '+(id===1?'Incorrect: 17 × 19 = 323':'Correct arithmetic'):'')));const up=button('↑',()=>{[order[pos-1],order[pos]]=[order[pos],order[pos-1]];render();}),down=button('↓',()=>{[order[pos+1],order[pos]]=[order[pos],order[pos+1]];render();});up.disabled=pos===0;down.disabled=pos===2;up.setAttribute('aria-label','Rank answer '+(id+1)+' higher');down.setAttribute('aria-label','Rank answer '+(id+1)+' lower');buttons.append(up,down);row.append(node('strong','ac-big',String(pos+1)),copy,buttons);area.append(row);});const controls=node('div','viz-controls ac-controls');controls.append(button(reveal?'Hide correctness check':'Reveal correctness check',()=>{reveal=!reveal;render();}));area.append(controls,node('div','ac-result',reveal?'Independent check: 17 × 19 = 323. Ranking an answer first does not change whether its arithmetic is correct.':'Your ordering represents preference labels. A real reward model generalizes from many such comparisons.'));}render();note('This is an authored ranking exercise, not a trained reward model or a factuality benchmark. Supervised demonstrations typically precede preference optimization in the InstructGPT pipeline.');
    } else if(chapterIndex===6){
      intro('Different signals can constrain the same question','Text, images, and audio enter through different representations. Joint training lets a model relate them in context. More channels can resolve ambiguity, but they can also be incomplete, noisy, or misleading.','Toggle the illustrative image and audio evidence. See what becomes supportable and what remains uncertain.');
      let vision=false,audio=false;const controls=node('div','viz-controls ac-controls'),area=node('div');controls.append(check('Include image evidence',false,v=>{vision=v;render();}),check('Include audio evidence',false,v=>{audio=v;render();}));root.append(controls,area);
      function render(){area.replaceChildren();const flow=node('div','ac-flow');[['Text','“What is being played?”',true],['Image','String instrument + bow',vision],['Audio','Sustained string tone',audio]].forEach(([label,detail,active])=>{const box=node('div','ac-node'+(active?' is-active':''));box.append(node('div','ac-label',label),node('div','',active?detail:'Channel unavailable'),node('div','ac-muted',active?'Encoded representation':'No evidence from this channel'));flow.append(box);});const p=panel('Contextual interpretation');p.style.marginTop='16px';let response=vision&&audio?'Both channels are consistent with a bowed string instrument. These clues alone may not distinguish a violin from a viola.':vision?'The pictured bow and instrument suggest a bowed string instrument. The image alone does not establish what sound is being produced.':audio?'A sustained string tone suggests a string instrument, but the sound description alone does not uniquely identify it.':'The text supplies a question, but no identifying evidence. An instrument name would be a guess.';p.append(node('div','ac-result',response),node('p','ac-note','Remaining uncertainty: instrument identity, performance context, and whether the signals were interpreted correctly.'));area.append(flow,p);}render();note('The channel evidence is supplied as plain-language stand-ins for image and audio representations. No actual image recognition or audio inference runs here. Joint training does not imply that every modality has identical encodings.');
    } else if(chapterIndex===7){
      intro('An external check can change the answer','Additional inference compute can improve reasoning performance on some tasks. Tool outputs can also provide evidence that a model can inspect. This authored workflow makes verification visible without claiming to reveal internal reasoning.','Step through a deliberately flawed draft, its calculator check, and the corrected result.');
      let stage=0;const area=node('div');root.append(area);const labels=['1 · Draft','2 · Check','3 · Revise'];
      function render(){area.replaceChildren(steps(labels,stage,i=>{stage=i;render();}));const p=panel('Task: Calculate 17 × 19'),flow=node('div','ac-flow');labels.forEach((l,i)=>flow.append(node('div','ac-node'+(i===stage?' is-active':''),l)));p.append(flow);const log=node('ol','ac-log');log.append(node('li','','Authored candidate answer: 343.'));if(stage>=1)log.append(node('li','','Local arithmetic check: 17 × 19 = '+(17*19)+'. The candidate disagrees.'));if(stage>=2)log.append(node('li','','Revise the answer to 323 using the calculator evidence.'));p.append(log,node('div','ac-result',stage===0?'A fluent draft is still an unverified candidate.':stage===1?'Evidence reveals an error. Running a check is useful only if its result is inspected.':'Final answer: 323. The narrow arithmetic claim is now verified.'));area.append(p);const controls=node('div','viz-controls ac-controls'),prev=button('Previous step',()=>{stage--;render();}),next=button(stage===2?'Replay example':'Next step',()=>{stage=(stage+1)%3;render();});prev.disabled=stage===0;controls.append(prev,next);area.append(controls);}render();note('The calculator result is computed locally in JavaScript. The candidate and workflow are scripted. This is not an actual model response, recovered chain of thought, or evidence that more inference effort always improves reliability.');
    } else if(chapterIndex===8){
      intro('The model works inside a larger system','Astra’s documented scope includes reasoning, coding, computer use, research, and documents. A tool-using assistant can request an action, inspect the returned observation, and choose what to do next. Successful work also depends on context, permissions, and verification.','Choose a sample request and advance through an authored workflow. Each step shows the tool’s role and the observation it returns.');
      const scenarios=[{name:'Analyze a dataset',request:'Compare monthly sales and prepare a summary.',steps:[['Files','Read the provided table.','Column names and missing values are visible.'],['Code','Calculate monthly totals.','A month is missing; do not treat it as zero.'],['Reasoning','Revise the comparison.','Compare available months and disclose the gap.'],['Documents','Create the summary.','The draft includes totals, method, and the missing-data note.'],['Verification','Compare the draft to the source.','Numbers and caveat are checked before delivery.']]},{name:'Build a page',request:'Make a small event page from this brief.',steps:[['Files','Read the brief and existing project.','Required text and project conventions are identified.'],['Code','Implement the page.','The page is ready to preview.'],['Browser','Inspect the rendered page.','A heading wraps poorly on a narrow screen.'],['Code','Adjust the layout.','The heading and controls fit the viewport.'],['Verification','Check the result against the brief.','Required content and interactions are present.']]},{name:'Prepare a brief',request:'Research a topic and produce a sourced brief.',steps:[['Research','Find relevant primary sources.','Evidence and publication dates are collected.'],['Reasoning','Compare source claims.','A material disagreement needs to be preserved.'],['Documents','Draft a concise brief.','Claims link to evidence and uncertainty is explicit.'],['Research','Check the cited passages.','One unsupported sentence is removed.'],['Verification','Review the final document.','The brief is checked for accuracy and completeness.']]}];
      let selected=0,stage=0;const controls=node('div','viz-controls ac-controls'),area=node('div');controls.append(select('Request',scenarios.map(s=>s.name),i=>{selected=i;stage=0;render();}).el);root.append(controls,area);
      function render(){const s=scenarios[selected];area.replaceChildren();const p=panel(s.request),flow=node('div','ac-pills');s.steps.forEach((step,i)=>{const pill=node('span','ac-pill',i<stage?'✓ '+step[0]:step[0]);if(i===stage)pill.style.borderColor='var(--ac-accent)';flow.append(pill);});p.append(flow);const current=s.steps[stage];p.append(node('div','ac-result',current[0]+': '+current[1]),node('p','','Observation: '+current[2]));const log=node('ol','ac-log');s.steps.slice(0,stage).forEach(st=>log.append(node('li','ac-done',st[0]+' · '+st[2])));p.append(log);area.append(p);const transport=node('div','viz-controls ac-controls'),back=button('Previous action',()=>{stage--;render();});back.disabled=stage===0;transport.append(back,button(stage===s.steps.length-1?'Replay workflow':'Advance work',()=>{stage=(stage+1)%s.steps.length;render();}));area.append(transport);}render();note('These are illustrative workflows, not a recording of Astra’s hidden process or a live tool execution. Documentation establishes the capability categories; specific outcomes must be verified in actual use.');
    } else {
      intro('Broader intelligence must survive harder tests','There is no universally accepted AGI finish line. Capability on a familiar benchmark is only part of the evidence. Generalization, reliability, adaptation, and human direction ask different questions about a system.','Select a dimension and compare a familiar task with a more demanding test. No score or percentage of AGI is implied.');
      const data=[['Generalization','Sort a familiar list of integers.','Infer a new ordering rule from a few examples, then apply it to cases that differ from those examples.','Look for consistent transfer to withheld situations, not success on examples already encountered.'],['Reliability','Produce one correct answer.','Repeat the task under paraphrases, ambiguous inputs, missing evidence, and conflicting sources.','Measure failures and uncertainty across conditions. A single success does not establish dependability.'],['Adaptation','Reuse a known procedure.','Learn a new procedure from feedback, retain it, and avoid breaking previously useful behavior.','Separate temporary help from a prompt from persistent learning, and test whether improvements transfer.'],['Human direction','Carry out a fully specified plan.','Handle an ambiguous instruction, identify the missing decision, and respect the resulting human constraint.','Check whether the system remains steerable and appropriately seeks input when decisions require it.']];let selected=0,hard=false;const area=node('div');root.append(area);
      function render(){area.replaceChildren(steps(data.map(d=>d[0]),selected,i=>{selected=i;render();}),steps(['Familiar task','More demanding test'],hard?1:0,i=>{hard=!!i;render();}));const p=panel(data[selected][0]);p.append(node('h3','',data[selected][hard?2:1]),node('div','ac-result',data[selected][3]));area.append(p);}render();note('These are evaluation prompts for thinking about the open horizon, not a proposed universal definition or claim that existing systems pass the tests.');
    }
    return {dispose(){listeners.forEach(off=>off());if(root.isConnected)root.remove();}};
  };
})();

(function(){
  'use strict';
  const root=document.getElementById('ascent-v2');
  const $=id=>root.querySelector('#av-'+id);
  const chapters=[{"name":"Prologue","year":"2017—2026","kicker":"A JOURNEY THROUGH MODERN AI","title":"A prediction becomes a system","deck":"From attention to GPT-6 Astra","key":"Architecture · data · compute · feedback · reasoning · tools","captions":["Begin with a sentence, unfinished. A machine tries to guess what comes next. One prediction seems small. Billions of them become a training signal.","What follows is a meeting of ideas: a new architecture, expanding resources, better teaching, and more time to work through a problem.","We will travel inside those ideas. The glowing structures are visual metaphors. The mechanisms behind them explain how a language model becomes a working system."],"fact":"An original conceptual reconstruction of selected milestones. Geometry, brightness, and particle counts do not measure intelligence or reveal actual model internals.","source":"https://arxiv.org/abs/1706.03762","sourceName":"Vaswani et al. · Attention Is All You Need"},{"name":"Attention","year":"2017","kicker":"01 / CONNECTIONS THAT DEPEND ON CONTEXT","title":"Words look toward one another","deck":"The Transformer · Attention Is All You Need","key":"Query × key → softmax → weighted values","captions":["In a Transformer, each token creates a query, a key, and a value. Think of a question, a matching label, and information to share.","A query meets the keys through a dot product. Softmax turns those scores into weights. The weights decide how much each value contributes.","The result is a blend shaped by context. Multiple heads learn different ways to connect tokens, and successive layers refine their representations.","For GPT, a causal mask blocks future positions. During training, each position learns to predict its next token using only what came before."],"fact":"Scaled dot-product attention computes softmax(QKᵀ/√dₖ)V. GPT uses causal attention. The interactive example uses invented scores and two-dimensional values, not measured attention.","source":"https://arxiv.org/abs/1706.03762","sourceName":"Vaswani et al. · 2017"},{"name":"GPT to GPT-3","year":"2018—2020","kicker":"02 / LEARNING FROM PREDICTION","title":"Small errors reshape the network","deck":"GPT · GPT-2 · GPT-3","key":"Training changes weights · examples in context guide behavior","captions":["Training compares a prediction with the token that actually follows. Gradients carry that error backward, and an optimizer adjusts the model's numerical parameters.","Repeated across enormous collections of text, this process builds useful patterns. The largest GPT-3 has 175 billion parameters, up from roughly 117 million in GPT.","At use time, examples inside a prompt can steer the answer. That is in-context learning. In ordinary generation, those examples do not rewrite the weights."],"fact":"Largest reported models: GPT ≈117M, GPT-2 ≈1.5B, GPT-3 175B parameters. Parameter count measures model size, not intelligence. Ordinary in-context learning leaves weights unchanged.","source":"https://arxiv.org/abs/2005.14165","sourceName":"Brown et al. · GPT-3 · 2020"},{"name":"Scaling laws","year":"2020","kicker":"03 / A PATTERN IN THE EXPERIMENTS","title":"More resources, smaller errors","deck":"Kaplan et al. · empirical power laws","key":"Prediction loss ≠ intelligence · a trend is not a destiny","captions":["Researchers find regular curves. Across tested ranges, prediction loss improves with more parameters, more data, and more training compute, when other constraints permit.","These are power laws. Multiplying resources tends to remove a fraction of the remaining reducible error. Equal gains usually demand increasingly large investments.","If resources grow exponentially, this relationship can sustain rapid progress. It does not establish exponential intelligence, predict every capability, or give a date for AGI."],"fact":"The explorer uses L = L∞ + A·C⁻ᵅ with an illustrative α = 0.10. It displays relative reducible loss, not measured performance, total loss, or an AGI forecast.","source":"https://arxiv.org/abs/2001.08361","sourceName":"Kaplan et al. · 2020"},{"name":"Data balance","year":"2022","kicker":"04 / SPENDING COMPUTE WELL","title":"Capacity needs experience","deck":"Chinchilla · compute-optimal training","key":"A fixed budget must support both model size and training data","captions":["Imagine a vast library with too few books. A large model can also be undertrained. Capacity matters, but so does enough experience to use it.","Chinchilla tests a different balance: 70 billion parameters, four times Gopher's training data, and the same training compute. It performs better across the paper's evaluations.","The lesson is allocation. In this training regime, model size and training tokens should rise together. Bigger alone is not the most effective investment."],"fact":"Chinchilla used 70B parameters against Gopher's 280B, with four times the data at the same training compute. Compute-optimal allocation depends on the regime and objective.","source":"https://arxiv.org/abs/2203.15556","sourceName":"Hoffmann et al. · 2022"},{"name":"Human feedback","year":"2022","kicker":"05 / FROM CONTINUATION TO ASSISTANCE","title":"Learning what people prefer","deck":"Instruction tuning · InstructGPT · ChatGPT","key":"Demonstrations → ranked answers → a learned reward signal","captions":["Predicting plausible text is not the same as helping someone. Human demonstrations first show the model how a useful response should look.","People then rank candidate answers. A reward model learns those preferences, and reinforcement learning nudges the assistant toward responses that score better.","This makes conversation more useful and responsive. But preference is an imperfect teaching signal. A polished answer can still be wrong, and needs checking."],"fact":"InstructGPT combined supervised demonstrations, human preference rankings, and reinforcement learning. Preference optimization does not guarantee factual correctness, safety, or alignment in every situation.","source":"https://arxiv.org/abs/2203.02155","sourceName":"Ouyang et al. · 2022"},{"name":"Multimodal","year":"2023—2024","kicker":"06 / MORE WAYS INTO THE WORLD","title":"Seeing and hearing join language","deck":"GPT-4 → GPT-4o","key":"Different signals become representations the model can relate","captions":["A photograph contains spatial patterns. A voice carries words, rhythm, and tone. Multimodal models turn these different signals into representations they can relate.","GPT-4 accepts images alongside text. GPT-4o trains jointly across text, vision, and audio, bringing more of a conversation into the same system.","Now a question can point into a picture or arrive as speech. These connections broaden the interface. Their accuracy still depends on what was perceived."],"fact":"GPT-4 accepted text and images and produced text. GPT-4o was trained jointly across text, vision, and audio. Product and API feature availability varied.","source":"https://arxiv.org/html/2410.21276v1","sourceName":"GPT-4o system card · 2024"},{"name":"Reasoning","year":"2024—2025","kicker":"07 / COMPUTE WHILE ANSWERING","title":"A longer path to an answer","deck":"o1 → GPT-5 · reasoning effort","key":"Training for reasoning · inference compute · external verification","captions":["Training is only one place to spend compute. Reasoning models also use additional computation while answering, and learn through reinforcement learning to tackle harder problems.","More inference effort can improve evaluated results. Tools add another resource: a calculation, a search, or a test can provide evidence outside the model.","The branches here illustrate possible work steps, not a recovered inner monologue. More effort helps on some tasks. Verification tells us whether the result holds."],"fact":"o1-preview launched in September 2024; GPT-5 followed in August 2025. Gains from inference compute depend on the task. This diagram depicts a workflow, not hidden chain of thought.","source":"https://arxiv.org/html/2412.16720v1","sourceName":"OpenAI o1 system card · 2024"},{"name":"Astra","year":"2026","kicker":"08 / INTELLIGENCE ACROSS A WORKFLOW","title":"From a request to a result","deck":"GPT-6 Astra in Codex","key":"Reasoning · code · computer use · research · documents","captions":["With GPT-6 Astra, released in September 2026, the story reaches sustained work: reasoning, writing code, operating tools, researching, and producing documents across a task.","A request becomes a sequence of actions. Read the context. Choose a tool. Inspect its output. Revise the approach when the evidence calls for it.","The working system includes the model, its tools, and the surrounding environment. The meaningful test is whether it can complete the task reliably."],"fact":"Official documentation lists GPT-6 Astra as released September 3, 2026, with reasoning, coding, computer use, research, and document capabilities. No undisclosed architecture or parameter count is inferred.","source":"https://developers.openai.com/api/docs/models/gpt-6-astra","sourceName":"OpenAI · GPT-6 Astra"},{"name":"Open horizon","year":"BEYOND","kicker":"09 / WHAT MUST STILL BE DEMONSTRATED","title":"The horizon stays open","deck":"Toward broader, more dependable intelligence","key":"Generalization · reliability · adaptation · human direction","captions":["Looking back, progress came from several ideas working together. Attention made connections flexible. Scale improved prediction. Feedback and reasoning helped turn capability into useful behavior.","Looking forward, broader intelligence must work beyond familiar examples. It must remain dependable, adapt to new situations, and respond to human direction.","AGI has no universally accepted finish line. No glowing horizon proves we have reached it. The next chapter will be written in what systems demonstrate."],"fact":"The final scene is an artistic horizon. It does not claim AGI has been achieved, predict its arrival, or assign a percentage of progress toward it.","source":"https://arxiv.org/abs/2001.08361","sourceName":"Scaling laws · scope of evidence"}];
  const timing={"duration":348.8686666666667,"mimeType":"audio/webm; codecs=opus","voice":"af_heart","engine":"Kokoro-82M v1.0 / ONNX","cues":[{"chapter":0,"caption":0,"start":2.0,"end":11.472},{"chapter":0,"caption":1,"start":11.722,"end":20.468666666666667},{"chapter":0,"caption":2,"start":20.718666666666667,"end":31.3},{"chapter":1,"caption":0,"start":32.3,"end":40.72666666666667},{"chapter":1,"caption":1,"start":40.97666666666667,"end":50.00066666666667},{"chapter":1,"caption":2,"start":50.25066666666667,"end":60.04266666666667},{"chapter":1,"caption":3,"start":60.29266666666667,"end":70.298},{"chapter":2,"caption":0,"start":71.298,"end":81.58066666666667},{"chapter":2,"caption":1,"start":81.83066666666667,"end":96.61466666666666},{"chapter":2,"caption":2,"start":96.86466666666666,"end":107.446},{"chapter":3,"caption":0,"start":108.446,"end":119.198},{"chapter":3,"caption":1,"start":119.448,"end":131.30933333333334},{"chapter":3,"caption":2,"start":131.55933333333334,"end":143.84733333333332},{"chapter":4,"caption":0,"start":144.84733333333332,"end":154.362},{"chapter":4,"caption":1,"start":154.612,"end":166.068},{"chapter":4,"caption":2,"start":166.318,"end":176.57933333333332},{"chapter":5,"caption":0,"start":177.57933333333332,"end":186.49666666666667},{"chapter":5,"caption":1,"start":186.74666666666667,"end":197.09333333333333},{"chapter":5,"caption":2,"start":197.34333333333333,"end":207.15666666666667},{"chapter":6,"caption":0,"start":208.15666666666667,"end":219.16466666666668},{"chapter":6,"caption":1,"start":219.41466666666668,"end":231.36133333333333},{"chapter":6,"caption":2,"start":231.61133333333333,"end":241.19},{"chapter":7,"caption":0,"start":242.19,"end":253.43266666666668},{"chapter":7,"caption":1,"start":253.68266666666668,"end":264.43466666666666},{"chapter":7,"caption":2,"start":264.68466666666666,"end":275.22333333333336},{"chapter":8,"caption":0,"start":276.22333333333336,"end":290.0473333333333},{"chapter":8,"caption":1,"start":290.2973333333333,"end":299.91866666666664},{"chapter":8,"caption":2,"start":300.16866666666664,"end":309.49133333333333},{"chapter":9,"caption":0,"start":310.49133333333333,"end":323.6326666666667},{"chapter":9,"caption":1,"start":323.8826666666667,"end":334.50666666666666},{"chapter":9,"caption":2,"start":334.75666666666666,"end":344.8686666666667}],"chapters":[{"start":0,"end":31.799999999999997},{"start":31.799999999999997,"end":70.798},{"start":70.798,"end":107.946},{"start":107.946,"end":144.34733333333332},{"start":144.34733333333332,"end":177.07933333333332},{"start":177.07933333333332,"end":207.65666666666667},{"start":207.65666666666667,"end":241.69},{"start":241.69,"end":275.72333333333336},{"start":275.72333333333336,"end":309.99133333333333},{"start":309.99133333333333,"end":348.8686666666667}]};
  const audio=$('audio'),seekControl=$('seek'),play=$('play'),stage=root.querySelector('.av-stage');
  const score=createAscentScore();
  const duration=timing.duration;
  let scene,playing=false,time=0,visualTime=0,lastFrame=0,index=-1,cueIndex=-1,dirty=true,disposed=false,drag=false,started=false,explain=false,explorer=null,audioFailed=false;
  let travel=null,captionText='',transportGeneration=0;
  const format=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
  seekControl.max=duration;
  chapters.forEach((c,i)=>{c.start=timing.chapters[i].start;c.end=timing.chapters[i].end;c.duration=c.end-c.start;});
  const chapterNav=$('chapters');
  chapters.forEach((c,i)=>{const b=document.createElement('button');b.type='button';b.className='av-chapter';b.setAttribute('aria-label',c.name+', '+c.year);const y=document.createElement('span');y.textContent=c.year;const n=document.createElement('strong');n.textContent=c.name;b.append(y,n);b.addEventListener('click',()=>seek(c.start));chapterNav.appendChild(b);});
  const labelNodes=Array.from({length:3},()=>{const d=document.createElement('div');d.className='av-label';d.hidden=true;$('labels').appendChild(d);return d;});
  const sources=[
    ['Attention Is All You Need','https://arxiv.org/abs/1706.03762','Vaswani et al. (2017).'],
    ['Generative pretraining','https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf','Radford et al. (2018).'],
    ['GPT-2 model card','https://github.com/openai/gpt-2/blob/master/model_card.md','OpenAI (2019).'],
    ['GPT-3: Language Models are Few-Shot Learners','https://arxiv.org/abs/2005.14165','Brown et al. (2020).'],
    ['Scaling Laws for Neural Language Models','https://arxiv.org/abs/2001.08361','Kaplan et al. (2020).'],
    ['Training Compute-Optimal Large Language Models','https://arxiv.org/abs/2203.15556','Hoffmann et al. (2022): Chinchilla.'],
    ['Learning from human feedback','https://arxiv.org/abs/2203.02155','Ouyang et al. (2022).'],
    ['GPT-4 Technical Report','https://arxiv.org/abs/2303.08774','OpenAI (2023).'],
    ['GPT-4o System Card','https://arxiv.org/html/2410.21276v1','OpenAI (2024).'],
    ['OpenAI o1 System Card','https://arxiv.org/html/2412.16720v1','OpenAI (2024).'],
    ['GPT-5 model card','https://developers.openai.com/api/docs/models/gpt-5','OpenAI (2025).'],
    ['GPT-6 Astra model card','https://developers.openai.com/api/docs/models/gpt-6-astra','OpenAI (2026).'],
    ['API changelog','https://developers.openai.com/api/docs/changelog','Release dates; verified September 5, 2026.']
  ];
  const notes=$('sources');
  function note(text){const p=document.createElement('div');p.textContent=text;notes.appendChild(p);}
  note('An original continuous 3D reconstruction with a locally generated neural voice and an original procedural score. Grids use illustrative numerical values and sampled structure; moving packets carry data or activations. Learned weights change during training and stay fixed during generation. Labelled dimensions are published sizes or explicitly toy examples. Spatial layouts are explanatory reconstructions, not scans of model internals. Astra is shown at the system level; its detailed architecture is not disclosed.');
  note('The explorers use deliberately small, illustrative examples. Their invented scores, values, and scaling coefficients are labeled and are not fitted measurements or forecasts. The chronology follows selected GPT milestones and Chinchilla’s contribution to compute allocation.');
  const voiceNote=document.createElement('div');voiceNote.appendChild(document.createTextNode('AI-generated narration: Kokoro, stock af_heart voice. '));const voiceLink=document.createElement('a');voiceLink.href='https://huggingface.co/hexgrad/Kokoro-82M';voiceLink.target='_blank';voiceLink.rel='noopener noreferrer';voiceLink.textContent='Voice model & license ↗';voiceNote.appendChild(voiceLink);notes.appendChild(voiceNote);
  sources.forEach(s=>{const d=document.createElement('div');const a=document.createElement('a');a.href=s[1];a.target='_blank';a.rel='noopener noreferrer';a.textContent=s[0];d.appendChild(a);d.appendChild(document.createTextNode(' — '+s[2]));notes.appendChild(d);});
  function locate(t){let i=chapters.length-1;while(i>0&&t<chapters[i].start)i--;return i;}
  function findCue(t,chapter){let c=timing.cues.findIndex(q=>q.chapter===chapter&&t>=q.start&&t<q.end);if(c>=0)return c;const available=timing.cues.map((q,i)=>({q,i})).filter(o=>o.q.chapter===chapter);let p=available[0];for(const item of available){if(item.q.start<=t)p=item;}return p.i;}
  function mountConcept(){if(!explain)return;if(explorer)explorer.dispose();$('concept-title').textContent=chapters[index].name+' · inside the mechanism';explorer=mountAscentConcept($('concept'),index);}
  function update(force=false){
    const next=locate(time),c=chapters[next];
    if(next!==index||force){
      index=next;$('year').textContent=c.year;$('number').textContent=c.kicker;$('title').textContent=c.title;$('key').textContent=c.key;
      $('current').textContent=String(next+1).padStart(2,'0')+' / 10 · '+c.name;$('fact').textContent=c.fact;$('source').href=c.source;$('source').setAttribute('aria-label',c.sourceName);
      [...chapterNav.children].forEach((b,i)=>b.setAttribute('aria-current',String(i===next)));score.setChapter(next);mountConcept();
    }
    cueIndex=findCue(time,index);const cue=timing.cues[cueIndex];const text=c.captions[cue.caption];
    if(text!==captionText){$('caption').textContent=text;captionText=text;}
    $('clock').textContent=format(time)+' / '+format(duration);seekControl.value=time;seekControl.setAttribute('aria-valuetext',format(time)+', '+c.name);
    $('intro').hidden=index>0;$('intro').classList.toggle('out',time>5||started);$('intro').setAttribute('aria-hidden',String(time>5||started));
  }
  function renderLabels(){
    const labels=scene&&scene.getLabels?scene.getLabels():[];const w=stage.clientWidth,h=stage.clientHeight,placed=[];
    labelNodes.forEach((node,i)=>{
      const label=labels[i];
      if(!label||!label.visible||!Number.isFinite(label.x)||!Number.isFinite(label.y)){node.hidden=true;return;}
      const nx=label.x,ny=label.y;
      if(nx<.12||nx>.88||ny<.27||ny>.77||(!started&&time<5)){node.hidden=true;return;}
      const px=nx*w,py=ny*h;node.hidden=false;if(node.textContent!==label.text)node.textContent=label.text;
      const halfWidth=node.offsetWidth/2;if(px-halfWidth<12||px+halfWidth>w-12){node.hidden=true;return;}
      if(placed.some(p=>Math.abs(p.x-px)<130&&Math.abs(p.y-py)<36)){node.hidden=true;return;}
      placed.push({x:px,y:py});node.hidden=false;node.style.left=(nx*100)+'%';node.style.top=(ny*100)+'%';node.dataset.kind=label.kind||'cool';
    });
  }
  function draw(){if(!scene)return;const i=locate(visualTime),c=chapters[i],p=Math.max(0,Math.min(1,(visualTime-c.start)/c.duration));scene.render(i,p,visualTime);renderLabels();}
  function pause(){transportGeneration++;playing=false;audio.pause();score.pause();play.textContent=time>=duration-.05?'Replay journey':(started?'Continue journey':'Begin journey');dirty=true;}
  async function start(){
    if(time>=duration-.05)seek(0,false);
    const generation=++transportGeneration;started=true;playing=true;play.textContent='Pause';audio.muted=!$('narration').checked;score.setMuted(!$('score').checked);lastFrame=performance.now();
    score.start();
    if(!audioFailed){try{audio.currentTime=time;await audio.play();}catch(error){if(!playing||generation!==transportGeneration||error.name==='AbortError')return;audioFailed=true;$('voice-note').textContent='Audio unavailable in this browser · captions remain active';$('narration').checked=false;$('narration').disabled=true;}}
    dirty=true;update();
  }
  function seek(t,animate=true){
    const target=Math.max(0,Math.min(duration,Number(t)));time=target;
    if(!audioFailed){try{audio.currentTime=target;}catch(e){}}
    if(animate){travel={from:visualTime,to:target,began:performance.now(),length:950};}else{visualTime=target;travel=null;}
    update(true);dirty=true;if(target>=duration-.05)pause();
  }
  play.addEventListener('click',()=>playing?pause():start());
  seekControl.addEventListener('input',()=>seek(seekControl.value,false));
  $('narration').addEventListener('change',()=>{audio.muted=!$('narration').checked;});
  $('score').addEventListener('change',()=>{score.setMuted(!$('score').checked);if(playing&&$('score').checked)score.start();});
  $('explain').addEventListener('click',()=>{explain=!explain;$('concept-panel').hidden=!explain;$('explain').setAttribute('aria-expanded',String(explain));$('explain').textContent=explain?'Close explanation':'Explore this idea';if(explain){pause();mountConcept();}else if(explorer){explorer.dispose();explorer=null;}});
  audio.addEventListener('ended',()=>{time=duration;visualTime=duration;pause();update();draw();});
  audio.addEventListener('error',()=>{audioFailed=true;$('narration').checked=false;$('narration').disabled=true;$('voice-note').textContent='Audio unavailable in this browser · captions remain active';});
  const canvas=$('canvas');canvas.addEventListener('pointerdown',e=>{drag=true;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(drag&&scene){const r=canvas.getBoundingClientRect();scene.setPointer((e.clientX-r.left)/r.width*2-1,(e.clientY-r.top)/r.height*2-1);dirty=true;}});
  canvas.addEventListener('pointerup',()=>{drag=false;});canvas.addEventListener('pointercancel',()=>{drag=false;});
  function resize(){if(scene){const r=stage.getBoundingClientRect();scene.resize(r.width,r.height);}dirty=true;}
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(stage);
  try{if(typeof THREE==='undefined')throw Error('3D library unavailable');scene=createAscentScene(canvas,{compositionShift:.025});resize();$('loading').hidden=true;}catch(error){$('loading').textContent='3D is unavailable in this browser. The narration and interactive explanations are still available.';console.warn('Ascent 3D:',error.message);}
  play.disabled=false;update(true);draw();
  function frame(now){
    if(disposed)return;if(!root.isConnected){cleanup();return;}
    const dt=Math.max(0,Math.min(.1,(now-lastFrame)/1000));lastFrame=now;
    if(playing){time=audioFailed?Math.min(duration,time+dt):Math.min(duration,audio.currentTime);dirty=true;}
    if(travel){const f=Math.max(0,Math.min(1,(now-travel.began)/travel.length));const smooth=f*f*(3-2*f);visualTime=travel.from+(travel.to-travel.from)*smooth;dirty=true;if(f>=1){travel=null;visualTime=time;}}
    else if(playing)visualTime=time;
    if(dirty){update();draw();dirty=false;}
    if(playing&&time>=duration-.03)pause();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)pause();});
  function cleanup(){if(disposed)return;disposed=true;transportGeneration++;audio.pause();score.dispose();resizeObserver.disconnect();if(explorer)explorer.dispose();if(scene)scene.dispose();}
  window.addEventListener('pagehide',event=>{if(event.persisted){pause();return;}cleanup();});
})();

