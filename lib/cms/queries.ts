const image=`{"url": asset->url, "width": asset->metadata.dimensions.width, "height": asset->metadata.dimensions.height, alt}`;
export const seoProjection=`seo{title,description,canonical,noindex,"image":image${image}}`;
export const productProjection=`{_id,_rev,name,"slug":slug.current,status,kind,price,compareAtPrice,description,shortDescription,material,features,"images":images[]${image},"devices":phones[]->slug.current,"category":category->title,designType,featured,bestSeller,rank,${seoProjection}}`;
export const phoneProjection=`{_id,name,"slug":slug.current,brand,active,sortOrder,"image":image${image},modelUrl,mockup,supportedCaseTypes}`;
export const reviewProjection=`{_id,customer,rating,text,verified,active,"productSlug":product->slug.current,"image":image${image}}`;
export const contentQuery=`{
 "announcement":*[_type=="announcement"&&active==true&&(!defined(startsAt)||startsAt<=now())&&(!defined(endsAt)||endsAt>now())]|order(_updatedAt desc)[0]{text,link},
 "homepage":*[_type=="homepage"][0]{...,hero{...,"image":image${image}},"deviceSlugs":devices[]->slug.current,"designSlugs":designs[]->slug.current,"bestSellerSlugs":bestSellers[]->slug.current,"featuredSlugs":featured[]->slug.current,customBanner{...,"image":image${image}},clan{...,"image":image${image}},"reviewIds":reviews[]._ref,${seoProjection}},
 "settings":*[_type=="siteSettings"][0]{...,"logo":logo${image},${seoProjection}},
 "customizer":*[_type=="customizerSettings"][0],
 "faqs":*[_type=="faq"&&active==true]|order(sortOrder asc){_id,question,answer,category,placements,"productSlugs":products[]->slug.current},
 "reviews":*[_type=="review"&&active==true]${reviewProjection}
}`;
export const postsQuery=`*[_type=="post"&&publishedAt<=now()]|order(publishedAt desc){_id,title,"slug":slug.current,"image":image${image},author,publishedAt,excerpt,body,"category":category->title,tags,${seoProjection}}`;
