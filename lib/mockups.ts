export type CameraLayout='dual-diagonal'|'dual-vertical'|'triple-square'|'triple-wide';
export type Rect={x:number;y:number;width:number;height:number};
export type MockupAssets={base:string;caseOverlay:string;printMask:string;cameraMask:string;highlightOverlay:string;shadowOverlay:string};
export type ModelConfig={slug:string;model:string;width:number;height:number;camera:Rect;safe:number;cameraLayout:CameraLayout;cornerRadius:number;printArea:Rect;safeArea:{top:number;right:number;bottom:number;left:number};previewCrop:Rect;assets:MockupAssets};

const assets=(slug:string):MockupAssets=>({base:`/mockups/${slug}/base.png`,caseOverlay:`/mockups/${slug}/case-overlay.png`,printMask:`/mockups/${slug}/print-mask.png`,cameraMask:`/mockups/${slug}/camera-mask.png`,highlightOverlay:`/mockups/${slug}/highlight-overlay.png`,shadowOverlay:`/mockups/${slug}/shadow-overlay.png`});
const config=(slug:string,model:string,width:number,height:number,camera:Rect,cameraLayout:CameraLayout,cornerRadius:number):ModelConfig=>({slug,model,width,height,camera,cameraLayout,cornerRadius,safe:70,printArea:{x:.075,y:.012,width:.85,height:.976},safeArea:{top:.035,right:.055,bottom:.045,left:.055},previewCrop:{x:.05,y:0,width:.9,height:1},assets:assets(slug)});

export const modelConfigs:Record<string,ModelConfig>={
 'iphone-17':config('iphone-17','iPhone 17',2.81,5.89,{x:66,y:58,width:285,height:520},'dual-vertical',112),
 'iphone-17-pro':config('iphone-17-pro','iPhone 17 Pro',2.84,5.91,{x:48,y:55,width:904,height:435},'triple-wide',108),
 'iphone-17-pro-max':config('iphone-17-pro-max','iPhone 17 Pro Max',3.02,6.31,{x:46,y:52,width:908,height:438},'triple-wide',105),
 'iphone-16':config('iphone-16','iPhone 16',2.78,5.81,{x:70,y:62,width:270,height:505},'dual-vertical',114),
 'iphone-16-pro':config('iphone-16-pro','iPhone 16 Pro',2.81,5.89,{x:60,y:56,width:500,height:515},'triple-square',109),
 'iphone-16-pro-max':config('iphone-16-pro-max','iPhone 16 Pro Max',3.06,6.42,{x:57,y:53,width:508,height:522},'triple-square',104),
 'iphone-15':config('iphone-15','iPhone 15',2.82,5.81,{x:68,y:60,width:405,height:430},'dual-diagonal',116),
 'iphone-15-pro':config('iphone-15-pro','iPhone 15 Pro',2.78,5.77,{x:62,y:58,width:492,height:505},'triple-square',112),
 'iphone-15-pro-max':config('iphone-15-pro-max','iPhone 15 Pro Max',3.02,6.29,{x:59,y:55,width:500,height:512},'triple-square',106),
 'iphone-15-plus':config('iphone-15-plus','iPhone 15 Plus',3.06,6.33,{x:65,y:57,width:410,height:435},'dual-diagonal',108)
};

export function modelConfig(device:string):ModelConfig{return modelConfigs[device]||modelConfigs['iphone-17-pro']}
