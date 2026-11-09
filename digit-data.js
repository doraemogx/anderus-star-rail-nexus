// Character glyph reference bank from three user-provided screenshots, same fixed Enka template.
export const glyphs=[
["0",0,11,18,"BgP8f+f+ePcPcPcP8P8P8P8PcPcPcPcPeff+P+H4"],
["1",0,6,17,"D/P/////8/A/A/A/A/A/A/A/A/A/A/A/A/A/A/A/"],
["2",0,10,18,"BgP+f+//8P8PAPAPAfAeA8B4H4HwPgfA////////"],
["3",0,11,18,"BgP8f+/+8eYOAOAeA+D8D8AeAPAPAP4P+ef+f8H4"],
["4",0,12,17,"BwBwDwDgHgHAHAGAOcOceccccc4c//////AcAcAc"],
["4",0,12,17,"A4BwBwDwDgDgHAHAHOPOOOOOcOce//////AOAOAM"],
["5",0,11,17,"f+f+f+cAcAcAdwf8f+f+ceAeAPAPAO4e+ef+f8H4"],
["6",0,11,17,"B4B4D4DwDwHgPAPAf8f+//+f8P8P8P8P+ff+P8H4"],
["7",0,11,17,"//////8e8eYeA8A8A4B4B4B4DwDwDwHgHgPgPAPA"],
["7",0,11,17,"//////8e8eYeA8A8A8B8B4B4DwDwDwHgHgPgPAPA"],
["8",0,11,18,"DwP8f+f+8P8P8P+ff+P8f+ee8P8P8P8P+ff+P8H4"],
["9",0,11,18,"BgP8f+//8P8P8P8P8Pf+P+H8A8B8B4D4DwDgHgHA"],
["9",0,11,18,"BwP8f+f/8P8P8P8PePf/P+H+A8A8B4D4DwDwHgHg"],
["0",1,10,15,"+P+P8P8H8H8H8H8H8H8H8H8H8H8P8P8Pfff/f+H8"],
["1",1,6,16,"//////8/w/A/A/A/A/A/A/A/A/A/A/A/A/A/A/A8"],
["2",1,10,16,"f+8P8P8PAPAPAfAfAeA8B4H4HwHgPAeA////////"],
["3",1,11,18,"BgP8f+/+8eYOAOAeA+D8D8AeAPAPAP4P+ef+f8H4"],
["3",1,10,15,"8e4f4PAPAeA+D+H8H+D+AfAPAPAPwP4P++/+f8P4"],
["5",1,10,16,"//8A8A8A8A8g/8/+/+8fAPAPAPAPAP8P++/+f+P4"],
["5",1,10,17,"/+/+/+4A4A4A5g/8/+/+8fAPAPAPAP4P+//+f8P4"],
["6",1,11,16,"B4DwDwDwHgPAPAf8f8f++f8P8P8P8P8Pf+f+P8H4"],
["6",1,11,16,"DwDwHwHgHgPAPAf8f8f++e8P8P8P8P8e/+/+f8H4"],
["7",1,10,17,"//////8P8P4eAeA8A8A8B8B4B4HgHgHgPgPAPAOA"],
["7",1,10,17,"//////8P8PYeAeAeA8A8A4B4B4HwHgHgHAPAPA"],
["8",1,11,15,"+e8e8O8O8e/+f+P8f8/+8P8P8P8P8P8f/+/+f8H4"],
["8",1,10,15,"8P8P8P8P8P//f+f+f+//+f8P4H4H4H8P////f+H4"],
["9",1,10,16,"//8P8P8P4H8P8P////f+P+A8A8A8B4B4HwPgPAPA"]
].map(([digit,style,w,h,b64])=>{
 const data=atob(b64),pixels=[];
 for(let i=0;i<240;i++)pixels.push((data.charCodeAt(i>>3)>>(7-(i&7)))&1);
 return {digit,style,w,h,pixels};
});
