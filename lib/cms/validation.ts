import type {ModelConfig,Rect} from '../mockups.ts';
const finite=(n:unknown)=>typeof n==='number'&&Number.isFinite(n);
function rectangle(rect:Rect|undefined,width:number,height:number){return !!rect&&[rect.x,rect.y,rect.width,rect.height].every(finite)&&rect.x>=0&&rect.y>=0&&rect.width>0&&rect.height>0&&rect.x+rect.width<=width&&rect.y+rect.height<=height}
export function validateMockup(config:ModelConfig,slug:string){
 if(!config||config.slug!==slug||!finite(config.width)||!finite(config.height)||config.width<=0||config.height<=0)throw new Error('Invalid phone dimensions/model slug.');
 if(!rectangle(config.printArea,1,1)||!rectangle(config.previewCrop,1,1)||!rectangle(config.camera,1000,2000))throw new Error('Invalid model-specific print or camera area.');
 if(!config.safeArea||Object.values(config.safeArea).length!==4||!Object.values(config.safeArea).every(n=>finite(n)&&n>=0&&n<.5))throw new Error('Invalid safe margins.');
 if(!finite(config.cornerRadius)||config.cornerRadius<=0||!finite(config.safe)||config.safe<0)throw new Error('Invalid case geometry.');
 if(!['dual-diagonal','dual-vertical','triple-square','triple-wide'].includes(config.cameraLayout))throw new Error('Invalid camera layout.');
 for(const key of ['base','caseOverlay','printMask','cameraMask','highlightOverlay','shadowOverlay'] as const){const value=config.assets?.[key];if(typeof value!=='string'||!(/^(\/(?!\/)|https:\/\/)/.test(value)))throw new Error(`Missing or unsafe layered asset: ${key}`)}
 return config;
}
