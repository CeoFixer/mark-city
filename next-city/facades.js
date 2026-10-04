// Visible window counts and door placement, read from IMG_9511 (not generic floors).
export function facade(name,w,h){
 const window=(x,y,width=1.3,height=1.6)=>({x,y,w:width,h:height});
 const sidePair=(y,height=1.8)=>[-1,1].map(s=>window(s*w*.3,y,w*.18,height));
 if(/^Дом №/.test(name))return {windows:sidePair(2.4),doorX:0,doorW:1.6,doorColor:0x64b6df,signW:0};
 if(/ЛОББИ/.test(name))return {windows:[window(-w*.28,2.25,1.8,1.9)],doorX:w*.2,doorW:1.8,signW:w*.85,signH:1.25,signY:h-.8};
 if(/МОТЕЛЬ/.test(name))return {windows:[...sidePair(2.55,2.5),...sidePair(6.55,2.5)],doorX:0,doorW:3,signW:w*.38};
 if(/МЕГАЗИН/.test(name))return {windows:[-.05,.2,.4].map(x=>window(x*w,2.5,w*.18,2.5)),doorX:-w*.35,doorW:3.4,signW:w*.58,signH:1.6};
 if(/ФУД МАРТ/.test(name))return {windows:[window(w*.25,2.5,2.1,2.5)],doorX:-w*.25,doorW:2,signW:w*.92};
 if(/ДИСКО/.test(name))return {windows:sidePair(2,2.2),doorX:0,doorW:3,signW:w*.9};
 if(/Книги/.test(name))return {windows:[-.32,.32].map(x=>window(x*w,2.9,2.3,1.6)),doorX:0,doorW:2.3,doorH:3,doubleDoor:false,signW:w*.85,bookDisplays:true};
 if(/Тиурба/.test(name))return {windows:[...sidePair(2,2.3),...sidePair(5,1.9)],doorX:0,doorW:2.5,doorColor:0xe8a569,signW:w*.3,signH:2.2};
 return {windows:sidePair(2),doorX:0,doorW:1.6,signW:w*.8};
}

// Additional side-wall windows requested by Mark; the drawing's front layouts stay intact.
export function sideWindows(depth,height,name='',side=1){
 // Lobby and motel share a wall. Only the upper motel windows face its roof.
 if(/ЛОББИ/.test(name)&&side===1)return [];
 if(/МОТЕЛЬ/.test(name)&&side===-1)return [-depth/2+2,0,depth/2-2].map(z=>({z,y:6.55,w:1.6,h:1.7}));
 const columns=Math.max(2,Math.min(4,Math.floor(depth/4))),rows=height>=7&&!/МЕГАЗИН|ФУД МАРТ/.test(name)?[2,5]:[2.5];
 return rows.flatMap(y=>Array.from({length:columns},(_,i)=>({z:-depth/2+2+i*(depth-4)/(columns-1),y,w:1.6,h:1.7})));
}
