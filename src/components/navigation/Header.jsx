import HeaderMobile from "./HeaderMobile";
import HeaderDesktop from "./HeaderDesktop";
import useBreakpoint from "@/hooks/useBreakpoint";
const Header = ({ toggleSidebar }) => {
  const { isMobile, isDesktop } = useBreakpoint();
  return (
    <div>
      {isMobile && <HeaderMobile toggleSidebar={toggleSidebar} />}
      {isDesktop && <HeaderDesktop />}
    </div>
  );
};

export default Header;
