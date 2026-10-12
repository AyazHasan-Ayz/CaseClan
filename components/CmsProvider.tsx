'use client';
import {createContext,useContext,type ReactNode} from 'react';
import type {CmsContent} from '@/lib/cms/types';
const fallback:CmsContent={homepage:null,settings:null,customizer:null,faqs:[],reviews:[]};
const Context=createContext<CmsContent>(fallback);
export const useCms=()=>useContext(Context);
export default function CmsProvider({content,children}:{content:CmsContent;children:ReactNode}){return <Context.Provider value={content}>{children}</Context.Provider>}
