export const BadgeDual = ({ children, className = "", color = "gray" }) => {
  const baseColors = {
    gray: "bg-gray-200 text-gray-800",
    blue: "bg-blue-200 text-blue-800",
    green: "bg-green-200 text-green-800",
    orange: "bg-orange-200 text-orange-800",
    red: "bg-red-200 text-red-800",
  };

  if (!children || !Array.isArray(children) || children.length !== 2) {
    console.warn("BadgeDual attend exactement 2 enfants.");
    return null;
  }

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full m-1 ${baseColors[color]} ${className}`}>
      {children[0]}
      {children[1]}
    </div>
  );
};
