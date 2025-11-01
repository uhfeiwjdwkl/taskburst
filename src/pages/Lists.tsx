import { useState, useEffect } from 'react';
import { List } from '@/types/list';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AddListDialog } from '@/components/AddListDialog';
import { ListCard } from '@/components/ListCard';
import { ListDetailsDialog } from '@/components/ListDetailsDialog';
import { ExportImportButton } from '@/components/ExportImportButton';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

const Lists = () => {
  const [lists, setLists] = useState<List[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<List | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    const savedLists = localStorage.getItem('lists');
    if (savedLists) {
      const loadedLists: List[] = JSON.parse(savedLists);
      setLists(loadedLists.filter(l => !l.deletedAt && !l.archivedAt).sort((a, b) => a.order - b.order));
    }
  }, []);

  useEffect(() => {
    const allLists = JSON.parse(localStorage.getItem('lists') || '[]');
    const otherLists = allLists.filter((l: List) => l.deletedAt || l.archivedAt);
    localStorage.setItem('lists', JSON.stringify([...lists, ...otherLists]));
  }, [lists]);

  const handleAddList = (newList: Omit<List, 'id' | 'createdAt' | 'order'>) => {
    const list: List = {
      ...newList,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      order: lists.length,
    };
    setLists([...lists, list]);
    toast.success('List created successfully!');
  };

  const handleUpdateList = (updatedList: List) => {
    setLists(lists.map(l => l.id === updatedList.id ? updatedList : l));
    setSelectedList(updatedList);
    toast.success('List updated!');
  };

  const handleDeleteList = () => {
    if (!selectedList) return;
    
    const deletedList = { ...selectedList, deletedAt: new Date().toISOString() };
    const allLists = JSON.parse(localStorage.getItem('lists') || '[]');
    localStorage.setItem('lists', JSON.stringify([...allLists.filter((l: List) => l.id !== selectedList.id), deletedList]));
    
    setLists(lists.filter(l => l.id !== selectedList.id));
    setDetailsDialogOpen(false);
    setSelectedList(null);
    toast.success('List moved to recently deleted');
  };

  const handleArchiveList = () => {
    if (!selectedList) return;
    
    const archivedList = { ...selectedList, archivedAt: new Date().toISOString() };
    const allLists = JSON.parse(localStorage.getItem('lists') || '[]');
    localStorage.setItem('lists', JSON.stringify([...allLists.filter((l: List) => l.id !== selectedList.id), archivedList]));
    
    setLists(lists.filter(l => l.id !== selectedList.id));
    setDetailsDialogOpen(false);
    setSelectedList(null);
    toast.success('List archived!');
  };

  const handleDeleteItem = (itemId: string) => {
    if (!selectedList) return;

    const deletedItem = selectedList.items.find(item => item.id === itemId);
    if (!deletedItem) return;

    const deletedItems = JSON.parse(localStorage.getItem('deletedListItems') || '[]');
    localStorage.setItem('deletedListItems', JSON.stringify([...deletedItems, { ...deletedItem, deletedAt: new Date().toISOString(), listId: selectedList.id }]));

    const updatedList = {
      ...selectedList,
      items: selectedList.items.filter(item => item.id !== itemId),
    };
    handleUpdateList(updatedList);
    toast.success('Item moved to recently deleted');
  };

  const handleShowDetails = (list: List) => {
    setSelectedList(list);
    setDetailsDialogOpen(true);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(lists);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const reorderedLists = items.map((list, index) => ({ ...list, order: index }));
    setLists(reorderedLists);
  };

  const handleImport = (importedData: List[]) => {
    setLists(importedData.filter(l => !l.deletedAt && !l.archivedAt).sort((a, b) => a.order - b.order));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Lists
            </h1>
            <p className="text-muted-foreground mt-1">Create and manage your to-do lists</p>
          </div>
          <div className="flex gap-2">
            <ExportImportButton
              data={lists}
              filename={`lists-${new Date().toISOString().split('T')[0]}.json`}
              onImport={handleImport}
              storageKey="lists"
            />
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="bg-gradient-primary hover:opacity-90 shadow-glow"
            >
              <Plus className="h-4 w-4 mr-2" />
              New List
            </Button>
          </div>
        </header>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="lists">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {lists.map((list, index) => (
                  <Draggable key={list.id} draggableId={list.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <ListCard
                          list={list}
                          onClick={() => handleShowDetails(list)}
                          isDragging={snapshot.isDragging}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {lists.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No lists yet. Create your first list!</p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create List
            </Button>
          </div>
        )}

        <AddListDialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          onAdd={handleAddList}
        />

        <ListDetailsDialog
          list={selectedList}
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
          onUpdate={handleUpdateList}
          onDelete={handleDeleteList}
          onArchive={handleArchiveList}
          onDeleteItem={handleDeleteItem}
        />
      </div>
    </div>
  );
};

export default Lists;
