/**
 * 🎬 Configuration des animations Framer Motion
 * Toutes les animations respectent les specs: fade+slide 0.3s
 */

// ============================================
// 📄 TRANSITIONS ENTRE PAGES
// ============================================
export const pageVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export const pageTransition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.3,
};

// ============================================
// 🎴 APPARITION DES CARDS (STAGGER)
// ============================================
export const cardStaggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

export const cardStaggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

// ============================================
// 📊 FADE-IN PROGRESSIF DES LIGNES DE TABLEAUX
// ============================================
export const tableRowVariants = {
  initial: { opacity: 0 },
  animate: (i) => ({
    opacity: 1,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
    },
  }),
};

// ============================================
// 🪟 MODALS ET DIALOGS (SCALE + FADE)
// ============================================
export const modalVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: 0.2,
    },
  },
};

export const modalOverlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// ============================================
// 📈 GRAPHIQUES (FADE + SCALE)
// ============================================
export const chartVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

// ============================================
// 🏷️ BADGES ET TOOLTIPS
// ============================================
export const badgeVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 20,
    },
  },
};

// ============================================
// 🔄 SKELETON LOADING
// ============================================
export const skeletonVariants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: 1,
    transition: {
      repeat: Infinity,
      repeatType: "reverse",
      duration: 1,
    },
  },
};

// ============================================
// ⚠️ ERREURS (SHAKE)
// ============================================
export const errorShakeVariants = {
  initial: { x: 0 },
  animate: {
    x: [-10, 10, -10, 10, 0],
    transition: {
      duration: 0.4,
    },
  },
};

// ============================================
// ✅ SUCCÈS (BOUNCE)
// ============================================
export const successBounceVariants = {
  initial: { scale: 0 },
  animate: {
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 15,
    },
  },
};

// ============================================
// 🔽 DROPDOWN MENU
// ============================================
export const dropdownVariants = {
  initial: { opacity: 0, y: -10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.15,
    },
  },
};

// ============================================
// 📱 SLIDE FROM BOTTOM (Mobile menus)
// ============================================
export const slideFromBottomVariants = {
  initial: { y: "100%", opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    y: "100%",
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

// ============================================
// 🎯 HELPER: Animation Layout Shift
// ============================================
export const layoutTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};
