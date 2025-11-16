import { Outlet } from "react-router-dom";

const ErrorLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  );
};

export default ErrorLayout;
