import { useState } from 'react';
import { BulkField, parseBulkValue } from '@/lib/bulkEditing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export function BulkAttributeEditor({ fields, disabled, onApply }: { fields: BulkField[]; disabled?: boolean; onApply: (key: string, value: unknown) => void }) {
  const [key, setKey] = useState(fields[0]?.key || '');
  const [value, setValue] = useState('');
  const field = fields.find(f => f.key === key);
  if (!field) return null;
  return <div className="flex flex-wrap items-center gap-2 w-full border-t pt-2">
    <Select value={key} onValueChange={k => { setKey(k); setValue(''); }}><SelectTrigger className="w-full sm:w-48" aria-label="Attribute to change"><SelectValue /></SelectTrigger><SelectContent>{fields.map(f => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}</SelectContent></Select>
    {field.type === 'boolean' ? <Switch aria-label={field.label} checked={value === 'true'} onCheckedChange={v => setValue(String(v))} /> : field.options ? <Select value={value} onValueChange={setValue}><SelectTrigger className="w-48" aria-label={field.label}><SelectValue placeholder="Choose value" /></SelectTrigger><SelectContent>{field.options.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select> : field.type === 'json' ? <Textarea className="min-h-10 flex-1 min-w-40" aria-label={field.label} value={value} onChange={e => setValue(e.target.value)} placeholder="Structured value (JSON)" /> : <Input aria-label={field.label} className="flex-1 min-w-40" type={field.type} value={value} onChange={e => setValue(e.target.value)} />}
    <Button disabled={disabled} size="sm" onClick={() => { try { onApply(key, parseBulkValue(field, value)); toast.success('Changes applied'); } catch (e) { toast.error(e instanceof Error ? e.message : 'Invalid value'); } }}>Apply changes</Button>
  </div>;
}