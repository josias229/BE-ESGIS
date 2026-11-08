/* Configuration partagée par toutes les pages (chargée juste après le CDN Tailwind). */
tailwind.config = {
    theme: {
        extend: {
            fontFamily: { sans: ['Inter', 'sans-serif'] },
            colors: {
                /* Couleurs sobres basées sur la maquette originale */
                'brand-dark': '#0f172a',
                'brand-gray': '#64748b',
                'brand-light': '#f8fafc',
                'brand-border': '#e2e8f0',
                'brand-red': '#ef4444',
                'dot-irt': '#3b82f6',
                'dot-gestion': '#10b981',
            }
        }
    }
};

/* Réglages du site : à adapter si le dépôt change de nom. */
window.SITE = {
    nom: "ESGIS Ressources",
    depot: "https://github.com/josias229/BE-ESGIS",
    /* Lien utilisé par « Soumettre » et « Devenir mentor » (formulaire, WhatsApp, e-mail…).
       Par défaut : création d'une « issue » sur le dépôt GitHub. */
    lienSoumission: "https://github.com/josias229/BE-ESGIS/issues/new?title=%5BSoumission%5D%20&body=Niveau%20%3A%0AMati%C3%A8re%20%3A%0AType%20(%C3%A9preuve%2C%20cours%2C%20TD%E2%80%A6)%20%3A%0AAnn%C3%A9e%20%3A%0A%0AJoignez%20le%20fichier%20ci-dessous.",
    lienMentor: "https://github.com/josias229/BE-ESGIS/issues/new?title=%5BMentor%5D%20&body=Nom%20%3A%0AFili%C3%A8re%20et%20niveau%20%3A%0AMati%C3%A8res%20que%20je%20peux%20accompagner%20%3A%0AContact%20%3A"
};
