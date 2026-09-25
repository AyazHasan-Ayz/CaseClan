export type CameraLayout='dual-diagonal'|'dual-vertical'|'single-wide'|'triple-square'|'triple-wide';
export type Rect={x:number;y:number;width:number;height:number};
export type MockupAssets={base:string;caseOverlay:string;printMask:string;cameraMask:string;highlightOverlay:string;shadowOverlay:string};
export type ModelConfig={slug:string;model:string;width:number;height:number;camera:Rect;safe:number;cameraLayout:CameraLayout;cornerRadius:number;photorealistic?:boolean;printArea:Rect;safeArea:{top:number;right:number;bottom:number;left:number};previewCrop:Rect;assets:MockupAssets};

const assets=(slug:string):MockupAssets=>({base:`/mockups/${slug}/base.png`,caseOverlay:`/mockups/${slug}/case-overlay.png`,printMask:`/mockups/${slug}/print-mask.png`,cameraMask:`/mockups/${slug}/camera-mask.png`,highlightOverlay:`/mockups/${slug}/highlight-overlay.png`,shadowOverlay:`/mockups/${slug}/shadow-overlay.png`});
const config=(slug:string,model:string,width:number,height:number,camera:Rect,cameraLayout:CameraLayout,cornerRadius:number,photorealistic=false):ModelConfig=>({slug,model,width,height,camera,cameraLayout,cornerRadius,photorealistic,safe:70,printArea:{x:.075,y:.012,width:.85,height:.976},safeArea:{top:.035,right:.055,bottom:.045,left:.055},previewCrop:{x:.05,y:0,width:.9,height:1},assets:assets(slug)});

export const modelConfigs:Record<string,ModelConfig>={
 'iphone-17':config('iphone-17','iPhone 17',2.81,5.89,{x:76,y:71,width:866,height:327},'single-wide',112,true),
 'iphone-17-pro':config('iphone-17-pro','iPhone 17 Pro',2.84,5.91,{x:78,y:88,width:866,height:533},'triple-wide',108,true),
 'iphone-17-pro-max':config('iphone-17-pro-max','iPhone 17 Pro Max',3.02,6.31,{x:68,y:73,width:854,height:582},'triple-wide',105,true),
 'iphone-16':config('iphone-16','iPhone 16',2.78,5.81,{x:78,y:74,width:286,height:489},'dual-vertical',114,true),
 'iphone-16-plus':config('iphone-16-plus','iPhone 16 Plus',3.06,6.33,{x:78,y:74,width:286,height:489},'dual-vertical',108,true),
 'iphone-16-pro':config('iphone-16-pro','iPhone 16 Pro',2.81,5.89,{x:72,y:83,width:503,height:484},'triple-square',109,true),
 'iphone-16-pro-max':config('iphone-16-pro-max','iPhone 16 Pro Max',3.06,6.42,{x:80,y:80,width:458,height:484},'triple-square',104,true),
 'iphone-15':config('iphone-15','iPhone 15',2.82,5.81,{x:74,y:73,width:445,height:448},'dual-diagonal',116,true),
 'iphone-15-pro':config('iphone-15-pro','iPhone 15 Pro',2.78,5.77,{x:74,y:75,width:493,height:488},'triple-square',112,true),
 'iphone-15-pro-max':config('iphone-15-pro-max','iPhone 15 Pro Max',3.02,6.29,{x:86,y:77,width:479,height:487},'triple-square',106,true),
 'iphone-15-plus':config('iphone-15-plus','iPhone 15 Plus',3.06,6.33,{x:86,y:67,width:437,height:473},'dual-diagonal',108,true)
};

export function modelConfig(device:string):ModelConfig{return modelConfigs[device]||modelConfigs['iphone-17-pro']}
