import { List, ListItem } from '@/types/list';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Check, Edit, List as ListIcon, Trash2, Undo, X } from 'lucide-react';
import { formatDateTimeToDDMMYYYY } from '@/lib/dateFormat';

interface Props {
  item: ListItem | null;
  list: List | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onComplete: () => void;
  onDelete: () => void;
}

export function ListItemFullDetailsDialog({ item, list, open, onClose, onEdit, onComplete, onDelete }: Props) {
  if (!item || !list) return null;
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="max-w-md" showClose={false}>
        <DialogHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <DialogTitle>List Item Details</DialogTitle>
            <DialogDescription>{list.title}</DialogDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></Button>
        </DialogHeader>
        <div className="space-y-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold">{item.title}</h3>
            {item.completed && <Badge>Completed</Badge>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline"><ListIcon className="mr-1 h-3 w-3" />{list.title}</Badge>
            <Badge variant="outline">Priority {item.priority}</Badge>
            {item.dateTime && <Badge variant="secondary"><Calendar className="mr-1 h-3 w-3" />{formatDateTimeToDDMMYYYY(item.dateTime)}</Badge>}
          </div>
          {item.notes && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.notes}</p>}
        </div>
        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Button variant="destructive" size="icon" onClick={onDelete} aria-label="Delete list item"><Trash2 className="h-4 w-4" /></Button>
          <Button variant="outline" onClick={onEdit}><Edit className="mr-2 h-4 w-4" />Edit</Button>
          <Button className="ml-auto" onClick={onComplete}>
            {item.completed ? <Undo className="mr-2 h-5 w-5" /> : <Check className="mr-2 h-5 w-5" />}
            {item.completed ? 'Mark Incomplete' : 'Complete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}