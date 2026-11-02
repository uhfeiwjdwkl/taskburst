import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ArrowUp, ArrowDown, Plus, Trash2, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
type Widget = { id: string; kind: string; size: string };
const defaults: Widget[] = [{id:'timer',kind:'timer',size:'half'},{id:'calendar',kind:'calendar',size:'half'},{id:'tasks',kind:'tasks',size:'full'},{id:'lists',kind:'lists',size:'half'},{id:'timetables',kind:'timetables',size:'half'}];
const names: Record<string,string> = {timer:'Timer',calendar:'Day calendar',tasks:'Tasks',lists:'Favourite lists',timetables:'Favourite timetables'};
const Context = createContext<{ widgets: Widget[] }>({widgets: defaults});
export function HomeLayout({children}: {children: ReactNode}) {
  const [widgets,setWidgets] = useState<Widget[]>(() => { try { const value = JSON.parse(localStorage.getItem('homeWidgetLayout') || 'null'); return Array.isArray(value) ? value : defaults; } catch { return defaults; }});
  const [open,setOpen]=useState(false);const [kind,setKind]=useState('calendar');
  useEffect(() => { localStorage.setItem('homeWidgetLayout',JSON.stringify(widgets)); },[widgets]);
  const move=(index:number,delta:number)=>{ const next=[...widgets];const target=index+delta;if(target<0||target>=next.length)return;[next[index],next[target]]=[next[target],next[index]];setWidgets(next); };
  return <Context.Provider value={{widgets}}><div className="flex justify-end mb-4"><Button variant="outline" onClick={()=>setOpen(true)}><LayoutDashboard className="h-4 w-4 mr-2"/>Edit layout</Button></div><div className="grid grid-cols-1 lg:grid-cols-12 gap-6">{children}</div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Home layout</DialogTitle></DialogHeader>
      {widgets.map((w,i)=><div key={w.id} className="flex flex-wrap gap-2 items-center border-b py-2"><span className="flex-1 min-w-32">{names[w.kind]}</span><Select value={w.size} onValueChange={size=>setWidgets(widgets.map(x=>x.id===w.id?{...x,size}:x))}><SelectTrigger className="w-28"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="small">Small</SelectItem><SelectItem value="half">Medium</SelectItem><SelectItem value="full">Wide</SelectItem></SelectContent></Select><Button size="icon" variant="ghost" aria-label={`Move ${names[w.kind]} up`} disabled={i===0} onClick={()=>move(i,-1)}><ArrowUp className="h-4 w-4"/></Button><Button size="icon" variant="ghost" aria-label={`Move ${names[w.kind]} down`} disabled={i===widgets.length-1} onClick={()=>move(i,1)}><ArrowDown className="h-4 w-4"/></Button><Button size="icon" variant="ghost" aria-label={`Remove ${names[w.kind]}`} onClick={()=>setWidgets(widgets.filter(x=>x.id!==w.id))}><Trash2 className="h-4 w-4"/></Button></div>)}
      <div className="flex gap-2"><Select value={kind} onValueChange={setKind}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{Object.entries(names).map(([k,n])=><SelectItem key={k} value={k}>{n}</SelectItem>)}</SelectContent></Select><Button onClick={()=>setWidgets([...widgets,{id:crypto.randomUUID(),kind,size:'half'}])}><Plus className="h-4 w-4 mr-1"/>Add widget</Button></div><Button variant="outline" onClick={()=>setWidgets(defaults)}>Reset layout</Button><Button onClick={()=>setOpen(false)}>Done</Button>
    </DialogContent></Dialog></Context.Provider>;
}
export function HomeWidget({kind,children}: {kind:string;children:ReactNode}) {
  const {widgets}=useContext(Context);
  return <>{widgets.map((w,i)=> w.kind === kind ? <section key={w.id} data-home-widget={kind} style={{order:i}} className={`min-w-0 ${w.size==='full'?'lg:col-span-12':w.size==='small'?'lg:col-span-4':'lg:col-span-6'}`}>{children}</section>:null)}</>;
}
