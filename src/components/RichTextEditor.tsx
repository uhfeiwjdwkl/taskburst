import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight,
  Link as LinkIcon, Highlighter, Table as TableIcon,
  Indent, Outdent, Maximize2, Minimize2,
  Undo, Redo,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

const MenuButton = ({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: React.ReactNode; title: string }) => (
  <Button
    type="button"
    variant={active ? 'default' : 'ghost'}
    size="icon"
    className={cn('h-7 w-7', active && 'bg-primary text-primary-foreground')}
    onClick={onClick}
    title={title}
  >
    {children}
  </Button>
);

export function RichTextEditor({ value, onChange, placeholder, className, minHeight = '120px' }: RichTextEditorProps) {
  const [fullscreen, setFullscreen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({ openOnClick: false }),
      Highlight,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm dark:prose-invert max-w-none focus:outline-none p-3`,
        style: `min-height: ${minHeight}`,
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  }, [editor]);

  const insertTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) return null;

  const toolbar = (
    <div className="flex flex-wrap gap-0.5 p-1 border-b bg-muted/30">
      <MenuButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
        <Bold className="h-3.5 w-3.5" />
      </MenuButton>
      <MenuButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
        <Italic className="h-3.5 w-3.5" />
      </MenuButton>
      <MenuButton active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
        <UnderlineIcon className="h-3.5 w-3.5" />
      </MenuButton>
      <MenuButton active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
        <Strikethrough className="h-3.5 w-3.5" />
      </MenuButton>
      <MenuButton active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()} title="Highlight">
        <Highlighter className="h-3.5 w-3.5" />
      </MenuButton>
      <div className="w-px bg-border mx-0.5" />
      <MenuButton active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">
        <Heading1 className="h-3.5 w-3.5" />
      </MenuButton>
      <MenuButton active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">
        <Heading2 className="h-3.5 w-3.5" />
      </MenuButton>
      <MenuButton active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">
        <Heading3 className="h-3.5 w-3.5" />
      </MenuButton>
      <div className="w-px bg-border mx-0.5" />
      <MenuButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">
        <List className="h-3.5 w-3.5" />
      </MenuButton>
      <MenuButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List">
        <ListOrdered className="h-3.5 w-3.5" />
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().sinkListItem('listItem').run()} title="Indent">
        <Indent className="h-3.5 w-3.5" />
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().liftListItem('listItem').run()} title="Outdent">
        <Outdent className="h-3.5 w-3.5" />
      </MenuButton>
      <div className="w-px bg-border mx-0.5" />
      <MenuButton active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Align Left">
        <AlignLeft className="h-3.5 w-3.5" />
      </MenuButton>
      <MenuButton active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Align Center">
        <AlignCenter className="h-3.5 w-3.5" />
      </MenuButton>
      <MenuButton active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Align Right">
        <AlignRight className="h-3.5 w-3.5" />
      </MenuButton>
      <div className="w-px bg-border mx-0.5" />
      <MenuButton active={editor.isActive('link')} onClick={addLink} title="Insert Link">
        <LinkIcon className="h-3.5 w-3.5" />
      </MenuButton>
      <MenuButton onClick={insertTable} title="Insert Table">
        <TableIcon className="h-3.5 w-3.5" />
      </MenuButton>
      <div className="w-px bg-border mx-0.5" />
      <MenuButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
        <Undo className="h-3.5 w-3.5" />
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
        <Redo className="h-3.5 w-3.5" />
      </MenuButton>
      <div className="flex-1" />
      <MenuButton onClick={() => setFullscreen(!fullscreen)} title={fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
        {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
      </MenuButton>
    </div>
  );

  if (fullscreen) {
    return (
      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Edit Content</DialogTitle>
          </DialogHeader>
          {toolbar}
          <div className="flex-1 overflow-y-auto">
            <EditorContent editor={editor} />
          </div>
          <DialogFooter className="p-4">
            <Button onClick={() => setFullscreen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className={cn('border rounded-md overflow-hidden bg-background', className)}>
      {toolbar}
      <EditorContent editor={editor} />
    </div>
  );
}
