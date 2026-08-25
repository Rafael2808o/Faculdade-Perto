import { ChevronDown,ChevronUp } from 'lucide-react';
import { useState } from 'react';
export function FaqList({items}){const [open,setOpen]=useState(0);return <div className="faq-list">{items.map((item,index)=><div className="faq-item" key={item.question}><button onClick={()=>setOpen(open===index?-1:index)} aria-expanded={open===index}>{item.question}{open===index?<ChevronUp/>:<ChevronDown/>}</button>{open===index&&<p>{item.answer}</p>}</div>)}</div>}
