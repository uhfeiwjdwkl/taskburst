import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calculateTime } from '@/lib/timeCalculator';
export function TimeCalculator() {
  const [time, setTime] = useState('09:00');
  const [operation, setOperation] = useState('add');
  const [amount, setAmount] = useState('30');
  let result = ''; try { result = calculateTime(time, operation, amount); } catch(e) { result = e instanceof Error ? e.message : ''; }
  return <Popover><PopoverTrigger asChild><Button type="button" variant="outline" size="icon" title="Time calculator" aria-label="Time calculator"><Calculator className="h-4 w-4" /></Button></PopoverTrigger><PopoverContent className="space-y-3 z-[220]">
    <h3 className="font-semibold">Time calculator</h3><Label>Start time<Input type="time" value={time} onChange={e => setTime(e.target.value)} /></Label>
    <Select value={operation} onValueChange={v => { setOperation(v); setAmount(v === 'difference' ? '10:00' : '30'); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent className="z-[230]"><SelectItem value="add">Add</SelectItem><SelectItem value="subtract">Subtract</SelectItem><SelectItem value="difference">Difference</SelectItem></SelectContent></Select>
    <Label>{operation === 'difference' ? 'End time' : 'Minutes or hours:minutes'}<Input type={operation === 'difference' ? 'time' : 'text'} value={amount} onChange={e => setAmount(e.target.value)} /></Label><output className="block font-semibold" aria-live="polite">{result}</output>
  </PopoverContent></Popover>;
}
