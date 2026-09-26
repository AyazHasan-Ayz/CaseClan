import type {Product} from '../catalog.ts';
import {deviceName,productImage} from '../catalog.ts';
import {absoluteUrl,siteConfig} from './config.ts';

export type JsonLdValue=string|number|boolean|null|JsonLdValue[]|{[key:string]:JsonLdValue};

export const organizationSchema=():JsonLdValue=>({
  '@context':'https://schema.org','@type':'Organization','@id':`${siteConfig.url}/#organization`,
  name:siteConfig.name,url:siteConfig.url,logo:absoluteUrl('/favicon.svg'),
});

export const websiteSchema=():JsonLdValue=>({
  '@context':'https://schema.org','@type':'WebSite','@id':`${siteConfig.url}/#website`,
  name:siteConfig.name,url:siteConfig.url,
  potentialAction:{'@type':'SearchAction',target:{'@type':'EntryPoint',urlTemplate:`${siteConfig.url}/search/?q={search_term_string}`},'query-input':'required name=search_term_string'},
});

export function breadcrumbSchema(items:{name:string;path:string}[]):JsonLdValue{return {
  '@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:items.map((item,index)=>({'@type':'ListItem',position:index+1,name:item.name,item:absoluteUrl(item.path)})),
}}

export function productSchema(product:Product):JsonLdValue{return {
  '@context':'https://schema.org','@type':'Product','@id':`${absoluteUrl(`/product/${product.id}/`)}#product`,
  name:`CASECLAN ${product.name}`,image:[absoluteUrl(productImage(product))],
  description:`${product.name} with fixed CASECLAN artwork, printed on a ${product.material.toLowerCase()} for compatible flagship phones.`,
  sku:product.id,brand:{'@type':'Brand',name:siteConfig.name},color:product.colors.join(', '),material:product.material,
  additionalProperty:product.devices.map(model=>({'@type':'PropertyValue',name:'Compatible phone model',value:deviceName(model)})),
  offers:{'@type':'Offer',url:absoluteUrl(`/product/${product.id}/`),price:product.price,priceCurrency:siteConfig.currency,availability:'https://schema.org/OutOfStock',itemCondition:'https://schema.org/NewCondition'},
}}

export function collectionSchema(name:string,path:string,products:Product[]):JsonLdValue{return {
  '@context':'https://schema.org','@type':'CollectionPage','@id':`${absoluteUrl(path)}#collection`,name,url:absoluteUrl(path),
  mainEntity:{'@type':'ItemList',numberOfItems:products.length,itemListElement:products.map((product,index)=>({'@type':'ListItem',position:index+1,url:absoluteUrl(`/product/${product.id}/`),name:product.name}))},
}}

export function faqSchema(groups:readonly {title:string;items:readonly (readonly [string,string])[]}[]):JsonLdValue{return {
  '@context':'https://schema.org','@type':'FAQPage',mainEntity:groups.flatMap(group=>group.items.map(([question,answer])=>({'@type':'Question',name:question,acceptedAnswer:{'@type':'Answer',text:answer}}))),
}}

export function pageSchema(type:'AboutPage'|'ContactPage',name:string,path:string,description:string):JsonLdValue{return {
  '@context':'https://schema.org','@type':type,name,url:absoluteUrl(path),description,isPartOf:{'@id':`${siteConfig.url}/#website`},
}}
