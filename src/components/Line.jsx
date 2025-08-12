import { Label } from "@/components/ui/label";

const Line = ({ title, children, modified = false }) => {
  return (
    <div className="space-y-1 p-4 rounded-md mb-2 bg-gray-200">
      {/* Ligne titre */}
      <Label className="flex justify-between text-sm text-muted-foreground">
        <div>{title}</div>
        {modified && (
          <div className="text-xs italic text-blue-500">Section modifiée</div>
        )}
      </Label>
      {/* Ligne de contenu : responsive */}
      <div className="">
        {children}
        {/* <div className="flex-1">{children}</div>

        <div className="sm:w-1/4 w-full text-sm text-muted-foreground">
          {right1}
        </div>
        <div className="sm:w-1/4 w-full text-sm text-muted-foreground">
          {right2}
        </div> */}
      </div>
    </div>
  );
};

export default Line;
