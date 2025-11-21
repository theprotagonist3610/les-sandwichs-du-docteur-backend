import useBreakpoint from "@/hooks/useBreakpoint";
import MobileTodos from "./mobile/MobileTodos";
import DesktopTodos from "./desktop/DesktopTodos";

const Todos = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileTodos /> : <DesktopTodos />;
};

export default Todos;
