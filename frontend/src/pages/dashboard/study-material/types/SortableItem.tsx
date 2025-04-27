import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ItemComponent from "../material-create/ItemComponent"; // Adjust path accordingly
import { SortableItemProps } from "./itemComponent";

export function SortableItem({
  id,
  item,
  deleteItem,
  updateItem,
  isError, // Keep this prop for general item error
  isTermError, // Add specific field error props
  isDefinitionError, // Add specific field error props
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    // Add this to track active state
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Create clean drag handle props
  const dragHandleProps = {
    attributes,
    listeners,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ItemComponent
        item={item}
        deleteItem={deleteItem}
        updateItem={updateItem}
        dragHandleProps={dragHandleProps}
        isDragging={isDragging}
        isError={isError} // Pass the prop directly instead of trying to calculate it here
        isTermError={isTermError} // Pass the term-specific error state
        isDefinitionError={isDefinitionError} // Pass the definition-specific error state
        key={item.id}
      />
    </div>
  );
}
