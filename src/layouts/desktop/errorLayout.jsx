import { Outlet } from "react-router-dom";

const ErrorLayout = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Outlet />
    </div>
  );
};

export default ErrorLayout;
