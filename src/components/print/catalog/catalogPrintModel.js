// Split each category into two print columns; preserve every item and its order.
export function catalogPages(detail, groups) {
 const known = new Map(groups.map(g => [String(g.group_id), g.group_name]));
 const buckets = new Map(groups.map(g => [String(g.group_id), []]));
 for (const item of detail) {const key=item.catalog_group_id == null?'none':String(item.catalog_group_id);if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(item);}
 const pages=[];let number=0;
 for(const [key,items] of buckets){if(!items.length)continue;const columns=[];let col=[],height=0;
  for(const item of items){const weight=Math.max(1,Math.ceil(String(item.stname||'').length/20),Math.ceil(String(item.stnameEN||'').length/20));
   if(col.length && height+weight>44){columns.push(col);col=[];height=0;}
   col.push({...item,printNo:++number});height+=weight;
  }if(col.length)columns.push(col);
  for(let i=0;i<columns.length;i+=2)pages.push({group:known.get(key)||(key==='none'?'ยังไม่ระบุหมวด':'หมวด '+key),left:columns[i],right:columns[i+1]||[]});
 }return pages;
}
