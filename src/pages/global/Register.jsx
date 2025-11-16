/*
- utiliser un store zustand qui sera stocker dans global/register/registerStore
- chaque champ du formulaire doit consommer une et une seule variable dans le store afin d'eviter les rerendues multiples
- examiner admin/userToolkit pour recuperer le schema d'un user
- il faut un formulaire avec au dessus le message "Bienvenue", en dessous le logo_petit.PNG
 */
import useBreakpoint from "@/hooks/useBreakpoint";
import MobileRegister from "./register/MobileRegister";
import DesktopRegister from "./register/DesktopRegister";

const Register = () => {
  const { mobile } = useBreakpoint();

  return mobile ? <MobileRegister /> : <DesktopRegister />;
};

export default Register;