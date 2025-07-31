import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X } from "lucide-react";
import { updateDoc, doc } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/firebase";

export default function EditableItem({
  docId,
  path,
  icon: Icon,
  label,
  value,
  unit,
}) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const handleUpdate = async () => {
    try {
      await updateDoc(doc(db, "stocks", docId), {
        [path]: inputValue,
      });
      toast.success("Modification réussie", {
        description: `${label} mis à jour.`,
      });
      setEditing(false);
    } catch (err) {
      console.error(err);
      toast.error("Erreur de modification", {
        description: `Impossible de modifier ${label}.`,
      });
    }
  };

  return (
    <div className="flex justify-between items-center py-2 border-b">
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <Icon size={16} className="text-[#a41624]" />
        <span className="font-medium">{label} :</span>

        {editing ? (
          <Input
            className="h-7 ml-2 text-sm"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            autoFocus
          />
        ) : (
          <span className="ml-1">
            {value}
            {unit && ` ${unit}`}
          </span>
        )}
      </div>

      {editing ? (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={handleUpdate}>
            <Check size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditing(false);
              setInputValue(value);
            }}>
            <X size={16} />
          </Button>
        </div>
      ) : (
        <Button variant="ghost" size="icon" onClick={() => setEditing(true)}>
          <Pencil size={14} />
        </Button>
      )}
    </div>
  );
}
