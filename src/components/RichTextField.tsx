import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/RichTextEditor';
import { Type, Wand2 } from 'lucide-react';

interface RichTextFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  /** Initial mode. Defaults to 'rich'. */
  defaultRich?: boolean;
}

/**
 * Wraps either a plain <Textarea> or the existing <RichTextEditor>, with a
 * toggle button. The container is resizable (resize-y) so users can drag to
 * change the height. Stored value is always the raw string supplied to
 * onChange — when in rich mode that is HTML, in plain mode it is text.
 */
export function RichTextField({
  value,
  onChange,
  placeholder,
  minHeight = '120px',
  defaultRich = true,
}: RichTextFieldProps) {
  const [rich, setRich] = useState(defaultRich);

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setRich(!rich)}
          className="h-7 px-2 text-xs"
          title={rich ? 'Switch to plain text' : 'Switch to rich text'}
        >
          {rich ? <Type className="h-3 w-3 mr-1" /> : <Wand2 className="h-3 w-3 mr-1" />}
          {rich ? 'Plain Text' : 'Rich Text'}
        </Button>
      </div>
      <div
        className="resize-y overflow-auto rounded-md border bg-background"
        style={{ minHeight, maxHeight: '80vh' }}
      >
        {rich ? (
          <RichTextEditor
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            minHeight={minHeight}
            className="border-0 rounded-none"
          />
        ) : (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="border-0 rounded-none min-h-full h-full focus-visible:ring-0 resize-none"
            style={{ minHeight }}
          />
        )}
      </div>
    </div>
  );
}
