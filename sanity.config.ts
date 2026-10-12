import {defineConfig} from 'sanity';
import {structureTool} from 'sanity/structure';
import {schemaTypes} from './sanity/schema';
const singletons=['homepage','siteSettings','customizerSettings'];
export default defineConfig({name:'caseclan',title:'CASECLAN Content',basePath:'/studio',projectId:process.env.NEXT_PUBLIC_SANITY_PROJECT_ID||'unconfigured',dataset:process.env.NEXT_PUBLIC_SANITY_DATASET||'production',plugins:[structureTool({structure:S=>S.list().title('CASECLAN Content').items([
 S.listItem().title('Homepage').child(S.document().schemaType('homepage').documentId('homepage')),
 ...S.documentTypeListItems().filter(item=>!singletons.includes(item.getId()||'')),
 S.listItem().title('Customization options').child(S.document().schemaType('customizerSettings').documentId('customizerSettings')),
 S.listItem().title('Site Settings').child(S.document().schemaType('siteSettings').documentId('siteSettings'))
])})],schema:{types:schemaTypes},document:{newDocumentOptions:(options)=>options.filter(option=>!singletons.includes(option.templateId)),actions:(actions,context)=>singletons.includes(context.schemaType)?actions.filter(action=>!['delete','duplicate'].includes(action.action||'')):actions.filter(action=>action.action!=='delete')}});
