// hooks/useDocumentTitle.js - Hook React 19 compatible
import { useEffect } from "react";

/**
 * Hook personnalisé pour gérer le titre du document
 * Compatible React 19 - pas de dépendances externes
 */
export const useDocumentTitle = (title) => {
  useEffect(() => {
    const previousTitle = document.title;

    if (title) {
      document.title = title;
    }

    // Cleanup : restaurer le titre précédent si le composant se démonte
    return () => {
      if (previousTitle !== title) {
        document.title = previousTitle;
      }
    };
  }, [title]);
};

/**
 * Hook avancé pour gérer les meta tags
 */
export const useDocumentMeta = ({ title, description, keywords, author }) => {
  useEffect(() => {
    // Gérer le titre
    if (title) {
      document.title = title;
    }

    // Gérer la description
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement("meta");
        metaDescription.setAttribute("name", "description");
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute("content", description);
    }

    // Gérer les mots-clés
    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement("meta");
        metaKeywords.setAttribute("name", "keywords");
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute("content", keywords);
    }

    // Gérer l'auteur
    if (author) {
      let metaAuthor = document.querySelector('meta[name="author"]');
      if (!metaAuthor) {
        metaAuthor = document.createElement("meta");
        metaAuthor.setAttribute("name", "author");
        document.head.appendChild(metaAuthor);
      }
      metaAuthor.setAttribute("content", author);
    }
  }, [title, description, keywords, author]);
};

/**
 * Hook pour gérer les favicons dynamiques
 */
export const useFavicon = (faviconUrl) => {
  useEffect(() => {
    if (!faviconUrl) return;

    const link =
      document.querySelector('link[rel="icon"]') ||
      document.createElement("link");
    link.type = "image/x-icon";
    link.rel = "icon";
    link.href = faviconUrl;

    if (!document.querySelector('link[rel="icon"]')) {
      document.head.appendChild(link);
    }
  }, [faviconUrl]);
};

// Export par défaut du hook principal
export default useDocumentTitle;
