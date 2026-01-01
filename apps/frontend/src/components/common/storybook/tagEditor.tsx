import { useState } from "react";
import { X } from "lucide-react";

export const TagEditor = ({ tags = [], onAdd, onRemove }) => {
  const [input, setInput] = useState("");
  const [addedTags, setAddedTags] = useState(tags);

  const handleKeyDown = (e) => {
    const trimmedInput = input.trim();
    if (e.key === "Enter") {
      e.preventDefault();
      if (!trimmedInput || addedTags.includes(trimmedInput)) return;
      onAdd([...addedTags, trimmedInput]);
      setInput("");
      setAddedTags((prev) => [...prev, trimmedInput]);
    } else if (e.key === "Backspace" && trimmedInput === "") {
      onRemove(addedTags.slice(0, -1));
      setAddedTags((prev) => prev.slice(0, -1));
    }
  };

  return (
    <div className='w-full'>
      <div
        className='flex flex-wrap items-center gap-2 focus:border-primary min-h-9
      w-full rounded-md border border-input bg-transparent px-2 py-1 text-base shadow-sm 
      transition-colors placeholder:text-muted-foreground focus-visible:outline-none 
      focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 
      md:text-sm'
      >
        {/* Render tags inside the input */}
        <Tags tags={addedTags} isRemovable={true} onRemove={onRemove} setAddedTags={setAddedTags} />

        {/* Input grows as needed */}
        <input
          className='flex-1 bg-transparent outline-none text-sm pl-1'
          placeholder='Type and press Enter...'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
};

interface ITagsProps {
  tags: string[];
  isRemovable?: boolean;
  onRemove?: (tags: string[]) => void;
  setAddedTags?: (tags: string[]) => void;
}
export const Tags = ({ tags = [], isRemovable = false, onRemove, setAddedTags }: ITagsProps) => {
  return (
    <div className='flex flex-wrap items-center gap-2'>
      {tags.map((tag) => (
        <span key={tag} className='flex items-center bg-sidebar-border rounded-full'>
          <p className='px-2 py-1 text-secondary-foreground text-sm'>{tag}</p>
          {isRemovable && (
            <button
              type='button'
              onClick={() => {
                const updatedTags = tags.filter((x) => x !== tag);
                onRemove(updatedTags);
                setAddedTags(updatedTags);
              }}
              className='text-red-400 hover:text-destructive hover:bg-secondary rounded-r-full p-1 flex flex-1 items-center justify-center w-full h-full'
            >
              <X className='h-4 w-4 my-1' />
            </button>
          )}
        </span>
      ))}
    </div>
  );
};
