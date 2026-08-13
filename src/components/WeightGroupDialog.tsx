import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { X, Plus, Trash2, EyeOff, Eye } from 'lucide-react';
import { toast } from 'sonner';
import {
  WeightGroup,
  WeightGroupItemType,
  calculateGroupScore,
  createWeightGroup,
  deleteWeightGroup,
  getScorableItems,
  getWeightGroups,
  updateWeightGroup,
} from '@/lib/weightGroups';

interface WeightGroupDialogProps {
  open: boolean;
  onClose: () => void;
  /** When provided, the dialog focuses on managing groups for this item. */
  itemId?: string;
  itemType?: WeightGroupItemType;
  itemName?: string;
  /** Open straight into a specific group. */
  groupId?: string;
  /** Click-through from the results page. */
  onOpenItem?: (itemId: string, itemType: WeightGroupItemType) => void;
}

export const WeightGroupDialog = ({
  open,
  onClose,
  itemId,
  itemType = 'task',
  itemName,
  groupId,
  onOpenItem,
}: WeightGroupDialogProps) => {
  const [groups, setGroups] = useState<WeightGroup[]>([]);
  const [activeId, setActiveId] = useState<string | null>(groupId ?? null);
  const [newName, setNewName] = useState('');
  const [addPickerOpen, setAddPickerOpen] = useState(false);
  const [search, setSearch] = useState('');

  const scorables = useMemo(() => (open ? getScorableItems() : []), [open, groups]);

  const reload = () => setGroups(getWeightGroups());

  useEffect(() => {
    if (!open) return;
    reload();
    setActiveId(groupId ?? null);
    setAddPickerOpen(false);
    setSearch('');
  }, [open, groupId]);

  const active = groups.find((g) => g.id === activeId) || null;

  const persist = (group: WeightGroup) => {
    updateWeightGroup(group);
    reload();
  };

  const handleCreate = () => {
    const seed = itemId ? [{ itemId, itemType, weight: 100 }] : [];
    const group = createWeightGroup(newName || itemName ? `${newName || itemName} group` : 'New group', seed);
    setNewName('');
    reload();
    setActiveId(group.id);
  };

  const handleAddItem = (id: string, type: WeightGroupItemType) => {
    if (!active) return;
    if (active.items.some((i) => i.itemId === id && i.itemType === type)) {
      toast.info('Already in this group');
      return;
    }
    persist({ ...active, items: [...active.items, { itemId: id, itemType: type, weight: 0 }] });
  };

  const renderGroupList = () => (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={itemName ? `Group name (default: ${itemName} group)` : 'New group name'}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-1" /> Create
        </Button>
      </div>

      {groups.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No weighting groups yet. Create one to combine tasks and assessments into a weighted score.
        </p>
      )}

      {groups.map((g) => {
        const score = calculateGroupScore(g, scorables);
        const contains = itemId ? g.items.some((i) => i.itemId === itemId) : false;
        return (
          <Card key={g.id} className="p-3 flex items-center gap-2">
            <button className="flex-1 text-left" onClick={() => setActiveId(g.id)}>
              <div className="font-medium text-sm flex items-center gap-2">
                {g.name}
                {g.hidden && <Badge variant="outline" className="text-xs">Hidden</Badge>}
                {contains && <Badge variant="secondary" className="text-xs">Includes this item</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">
                {g.items.length} item(s) • weighted score {score.display}
              </div>
            </button>
            {itemId && (
              <Button
                size="sm"
                variant={contains ? 'secondary' : 'outline'}
                onClick={() => {
                  if (contains) {
                    persist({ ...g, items: g.items.filter((i) => i.itemId !== itemId) });
                  } else {
                    persist({ ...g, items: [...g.items, { itemId, itemType, weight: 0 }] });
                  }
                }}
              >
                {contains ? 'Remove' : 'Add'}
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              title={g.hidden ? 'Unhide group' : 'Hide group'}
              onClick={() => persist({ ...g, hidden: !g.hidden })}
            >
              {g.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive"
              onClick={() => { deleteWeightGroup(g.id); reload(); }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Card>
        );
      })}
    </div>
  );

  const renderGroupDetails = (group: WeightGroup) => {
    const score = calculateGroupScore(group, scorables);
    const filtered = scorables.filter(
      (s) =>
        !group.items.some((i) => i.itemId === s.id && i.itemType === s.type) &&
        (!search.trim() || s.name.toLowerCase().includes(search.trim().toLowerCase()))
    );

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Input
            value={group.name}
            onChange={(e) => persist({ ...group, name: e.target.value })}
            className="font-medium"
          />
          <Button variant="outline" size="sm" onClick={() => setActiveId(null)}>All groups</Button>
        </div>

        <Card className="p-4 text-center">
          <div className="text-3xl font-bold">{score.display}</div>
          <div className="text-xs text-muted-foreground">
            Weighted score • total weight {score.totalWeight}%
          </div>
        </Card>

        <div className="space-y-2">
          <Label>Constituent items</Label>
          {group.items.length === 0 && (
            <p className="text-sm text-muted-foreground">No items yet — add tasks or assessments below.</p>
          )}
          {group.items.map((entry, index) => {
            const item = scorables.find((s) => s.id === entry.itemId && s.type === entry.itemType);
            return (
              <div key={`${entry.itemType}-${entry.itemId}`} className="flex items-center gap-2 border rounded-md p-2">
                <button
                  className="flex-1 min-w-0 text-left hover:text-primary"
                  onClick={() => onOpenItem?.(entry.itemId, entry.itemType)}
                >
                  <div className="text-sm truncate">{item?.name || 'Missing item'}</div>
                  <div className="text-xs text-muted-foreground">
                    {entry.itemType} • {item ? item.display : 'not found'}
                    {item?.percentage !== null && item?.percentage !== undefined
                      ? ` (${item.percentage.toFixed(1)}%)`
                      : ''}
                  </div>
                </button>
                <Input
                  type="number"
                  value={entry.weight}
                  min={0}
                  onChange={(e) => {
                    const items = [...group.items];
                    items[index] = { ...entry, weight: Number(e.target.value) || 0 };
                    persist({ ...group, items });
                  }}
                  className="w-20 h-8 text-sm"
                />
                <span className="text-xs text-muted-foreground">%</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => persist({ ...group, items: group.items.filter((_, i) => i !== index) })}
                >
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          <Button variant="outline" size="sm" onClick={() => setAddPickerOpen(!addPickerOpen)} className="w-full">
            <Plus className="h-3 w-3 mr-1" /> Add items
          </Button>
          {addPickerOpen && (
            <div className="border rounded-md p-2 space-y-2">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks & assessments…" className="h-8" />
              <div className="max-h-52 overflow-y-auto space-y-1">
                {filtered.length === 0 && (
                  <p className="text-xs text-muted-foreground p-2">Nothing else to add.</p>
                )}
                {filtered.map((s) => (
                  <button
                    key={`${s.type}-${s.id}`}
                    className="w-full text-left text-sm px-2 py-1 rounded hover:bg-muted flex items-center justify-between gap-2"
                    onClick={() => handleAddItem(s.id, s.type)}
                  >
                    <span className="truncate">{s.name}</span>
                    <Badge variant="outline" className="text-xs shrink-0">{s.type} • {s.display}</Badge>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        showClose={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex flex-row items-start justify-between">
          <div>
            <DialogTitle>Weighting groups</DialogTitle>
            <DialogDescription>
              {itemName
                ? `Combine ${itemName} with other tasks and assessments into weighted scores.`
                : 'Combine tasks and assessments into weighted scores.'}
            </DialogDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="py-2">{active ? renderGroupDetails(active) : renderGroupList()}</div>
      </DialogContent>
    </Dialog>
  );
};

export default WeightGroupDialog;
