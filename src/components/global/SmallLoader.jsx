/*
C'est un petit loader textuel avec un spinner lucide-react type [spinner text ...]
il peut etre importe dans n'importe quel composant et s,y adapte parfaitement
*/
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SmallLoader = ({
  text = "Chargement",
  className = "",
  spinnerSize = 16,
  showDots = true,
}) => {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-muted-foreground",
        className
      )}
    >
      <Loader2 className="animate-spin" size={spinnerSize} />
      <span>
        {text}
        {showDots && (
          <span className="inline-flex">
            <span className="animate-pulse">.</span>
            <span className="animate-pulse delay-100">.</span>
            <span className="animate-pulse delay-200">.</span>
          </span>
        )}
      </span>
    </div>
  );
};

export default SmallLoader;
