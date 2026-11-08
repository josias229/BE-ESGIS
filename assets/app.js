/* Banque d'épreuves ESGIS — logique du site (accueil + pages de niveau).
   Données : assets/catalogue.js (généré par outils/generer_catalogue.py)
             assets/contenus.js  (récaps et corrigés proposés, optionnel) */
(function () {
    'use strict';

    const CAT = window.CATALOGUE || { ressources: [], niveaux: {} };
    const CONT = window.CONTENUS || { recaps: {}, corriges: {} };
    const SITE = window.SITE || {};
    const RES = CAT.ressources;
    const NIV = CAT.niveaux;

    /* ================================================================== */
    /* Outils                                                             */
    /* ================================================================== */
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const urlDe = (p) => p.split('/').map(encodeURIComponent).join('/');
    const nomFichier = (p) => p.split('/').pop();
    const taille = (b) => b < 1024 * 1024 ? Math.max(1, Math.round(b / 1024)) + ' Ko' : (b / 1048576).toFixed(1).replace('.', ',') + ' Mo';
    const pluriel = (n, s, p) => n + ' ' + (n > 1 ? (p || s + 's') : s);
    const icones = () => { if (window.lucide) window.lucide.createIcons(); };
    const stock = {
        lire(k) { try { return localStorage.getItem('be-esgis:' + k); } catch (e) { return null; } },
        ecrire(k, v) { try { localStorage.setItem('be-esgis:' + k, v); } catch (e) { /* stockage indisponible */ } },
    };

    const NIVEAUX = {
        L1: { nom: 'Licence 1', page: 'l1.html', couleur: 'blue' },
        L2: { nom: 'Licence 2', page: 'l2.html', couleur: 'emerald' },
        L3: { nom: 'Licence 3', page: 'l3.html', couleur: 'purple' },
    };

    const FORMATS = {
        pdf: { label: 'PDF', icone: 'file-text', couleur: 'text-red-500', apercu: 'pdf' },
        docx: { label: 'Word', icone: 'file-text', couleur: 'text-blue-600', apercu: 'office' },
        doc: { label: 'Word', icone: 'file-text', couleur: 'text-blue-600', apercu: 'office' },
        pptx: { label: 'PPT', icone: 'presentation', couleur: 'text-orange-500', apercu: 'office' },
        ppt: { label: 'PPT', icone: 'presentation', couleur: 'text-orange-500', apercu: 'office' },
        xlsx: { label: 'Excel', icone: 'sheet', couleur: 'text-green-600', apercu: 'office' },
        xls: { label: 'Excel', icone: 'sheet', couleur: 'text-green-600', apercu: 'office' },
        accdb: { label: 'Access', icone: 'database', couleur: 'text-rose-600' },
        sql: { label: 'SQL', icone: 'database', couleur: 'text-sky-600' },
        txt: { label: 'TXT', icone: 'file-text', couleur: 'text-slate-400' },
        zip: { label: 'ZIP', icone: 'file-archive', couleur: 'text-amber-600' },
        rar: { label: 'RAR', icone: 'file-archive', couleur: 'text-amber-600' },
        '7z': { label: '7Z', icone: 'file-archive', couleur: 'text-amber-600' },
        jpg: { label: 'JPG', icone: 'image', couleur: 'text-teal-500', apercu: 'image' },
        jpeg: { label: 'JPG', icone: 'image', couleur: 'text-teal-500', apercu: 'image' },
        png: { label: 'PNG', icone: 'image', couleur: 'text-teal-500', apercu: 'image' },
    };
    const fmt = (e) => FORMATS[e] || { label: String(e).toUpperCase(), icone: 'file', couleur: 'text-slate-400' };

    const TYPES = {
        epreuve: { label: 'Épreuves', court: 'Épreuve', icone: 'file-badge', puce: 'bg-brand-red', badge: 'bg-red-50 text-red-600' },
        photos: { label: "Photos d'épreuves", court: 'Photos', icone: 'images', puce: 'bg-rose-400', badge: 'bg-rose-50 text-rose-600' },
        corrige: { label: 'Corrigés & TD traités', court: 'Corrigé', icone: 'file-check-2', puce: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
        cours: { label: 'Cours & supports', court: 'Cours', icone: 'book', puce: 'bg-dot-irt', badge: 'bg-blue-50 text-blue-600' },
        fiche: { label: 'Fiches & mémos', court: 'Fiche', icone: 'sticky-note', puce: 'bg-yellow-400', badge: 'bg-yellow-50 text-yellow-700' },
        notes: { label: 'Notes de cours (photos)', court: 'Notes', icone: 'camera', puce: 'bg-teal-500', badge: 'bg-teal-50 text-teal-700' },
        expose: { label: 'Exposés', court: 'Exposé', icone: 'presentation', puce: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700' },
        td: { label: 'TD & exercices', court: 'TD', icone: 'pencil-line', puce: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700' },
        tp: { label: 'TP & projets', court: 'TP', icone: 'wrench', puce: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700' },
        video: { label: 'Vidéos', court: 'Vidéo', icone: 'video', puce: 'bg-fuchsia-500', badge: 'bg-fuchsia-50 text-fuchsia-700' },
    };
    /* Onglets d'une matière et types qu'ils regroupent */
    const ONGLETS = [
        { id: 'epreuves', label: 'Épreuves', icone: 'file-badge', types: ['epreuve', 'photos'] },
        { id: 'cours', label: 'Cours', icone: 'book-open', types: ['cours', 'fiche', 'notes', 'expose', 'video'] },
        { id: 'td', label: 'TD & TP', icone: 'pencil-line', types: ['td', 'tp'] },
        { id: 'corriges', label: 'Corrigés', icone: 'file-check-2', types: ['corrige'] },
        { id: 'recap', label: 'Récap', icone: 'sparkles', types: [] },
    ];
    /* Filtres simplifiés de l'accueil */
    const FAMILLES = { epreuve: ['epreuve', 'photos'], cours: ['cours', 'fiche', 'notes', 'video', 'expose'], td: ['td', 'tp'], corrige: ['corrige'] };
    const SOUS = [
        { id: 'Examen / CT', label: 'Examens / CT' },
        { id: 'Contrôle continu', label: 'Contrôles continus' },
        { id: 'Rattrapage', label: 'Rattrapages' },
        { id: 'Devoir', label: 'Devoirs' },
    ];

    /* Index des matières (tous niveaux) */
    const MAT = {};
    const GRP = {};
    Object.entries(NIV).forEach(([n, niv]) => {
        (niv.groupes || []).forEach((g) => { GRP[n + ':' + g.id] = g; });
        (niv.matieres || []).forEach((m) => { MAT[m.id] = Object.assign({ niveau: n }, m); });
    });
    const matiere = (id) => MAT[id] || { id, nom: 'Autres ressources', icone: 'folder', couleur: 'slate', niveau: '' };
    const nomCourt = (m) => m.court || m.nom;

    /* Index de recherche */
    RES.forEach((r) => {
        const m = matiere(r.matiere);
        r._s = norm([r.titre, m.nom, m.court, (TYPES[r.type] || {}).label, r.sous, r.annee, (r.groupes || []).join(' '),
            r.niveau, NIVEAUX[r.niveau] && NIVEAUX[r.niveau].nom, r.extrait, r.fichiers.map((f) => nomFichier(f.p)).join(' ')].join(' '));
        r._t = norm(r.titre);
        r._an = r.annee ? parseInt(r.annee.slice(0, 4), 10) : 0;
    });
    /* Corrigés proposés : rattachés à l'épreuve par le chemin de son fichier */
    const CORR = {};
    RES.forEach((r) => { const f = r.fichiers.find((x) => CONT.corriges && CONT.corriges[x.p]); if (f) CORR[r.id] = CONT.corriges[f.p]; });
    const parMatiere = {};
    RES.forEach((r) => { (parMatiere[r.matiere] = parMatiere[r.matiere] || []).push(r); });

    function rechercher(liste, q) {
        const termes = norm(q).split(/\s+/).filter(Boolean);
        if (!termes.length) return liste;
        return liste
            .filter((r) => termes.every((t) => r._s.includes(t)))
            .map((r) => ({ r, score: termes.reduce((s, t) => s + (r._t.includes(t) ? 2 : 0) + (r._t.startsWith(t) ? 1 : 0), 0) + r._an / 10000 }))
            .sort((a, b) => b.score - a.score)
            .map((x) => x.r);
    }
    function matieresTrouvees(q, niveau) {
        const t = norm(q).trim();
        if (t.length < 2) return [];
        return Object.values(MAT).filter((m) => (!niveau || m.niveau === niveau) && norm(m.nom + ' ' + (m.court || '')).includes(t));
    }

    function surligner(texte, q) {
        const t = esc(texte);
        const termes = norm(q).split(/\s+/).filter((x) => x.length > 1);
        if (!termes.length) return t;
        const base = norm(texte);
        if (base.length !== texte.length) return t;
        const marques = new Array(texte.length).fill(false);
        termes.forEach((term) => {
            let i = base.indexOf(term);
            while (i !== -1) { for (let k = i; k < i + term.length; k++) marques[k] = true; i = base.indexOf(term, i + term.length); }
        });
        let out = '', ouvert = false;
        for (let i = 0; i < texte.length; i++) {
            if (marques[i] && !ouvert) { out += '<mark>'; ouvert = true; }
            if (!marques[i] && ouvert) { out += '</mark>'; ouvert = false; }
            out += esc(texte[i]);
        }
        return out + (ouvert ? '</mark>' : '');
    }

    /* Statistiques d'une matière */
    function stats(id) {
        const l = parMatiere[id] || [];
        const n = (types) => l.filter((r) => types.includes(r.type)).length;
        const annees = l.map((r) => r._an).filter(Boolean);
        const corriges = n(['corrige']) + l.filter((r) => CORR[r.id]).length;
        return {
            total: l.length, epreuves: n(['epreuve', 'photos']), cours: n(ONGLETS[1].types), td: n(['td', 'tp']), corriges,
            recap: !!(CONT.recaps && CONT.recaps[id]),
            de: annees.length ? Math.min(...annees) : null, a: annees.length ? Math.max(...annees) + 1 : null,
        };
    }

    /* ================================================================== */
    /* Rendu d'une ressource                                              */
    /* ================================================================== */
    function boutons(r) {
        let html = '';
        const corrige = CORR[r.id];
        if (corrige) {
            html += `<button type="button" data-corrige="${r.id}" class="text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 text-xs font-medium flex items-center gap-1 px-2.5 py-1.5 rounded smooth-transition focus-ring" title="Voir le corrigé proposé">
                <i data-lucide="check-check" class="w-3.5 h-3.5"></i>Corrigé</button>`;
        }
        if (r.album) {
            return html + `<button type="button" data-album="${r.id}" class="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded smooth-transition focus-ring" aria-label="Voir les ${r.fichiers.length} images">
                <i data-lucide="images" class="w-3.5 h-3.5"></i>Voir <span class="text-blue-400">${r.fichiers.length}</span></button>`;
        }
        const f = fmt(r.fichiers[0].e);
        if (f.apercu) {
            html += `<button type="button" data-apercu="${r.id}" class="text-slate-600 hover:text-brand-dark bg-slate-100 hover:bg-slate-200 text-xs font-medium flex items-center gap-1 px-2.5 py-1.5 rounded smooth-transition focus-ring" aria-label="Aperçu de ${esc(r.titre)}">
                <i data-lucide="eye" class="w-3.5 h-3.5"></i>Aperçu</button>`;
        }
        r.fichiers.forEach((fi, i) => {
            const ff = fmt(fi.e);
            const style = i === 0 ? 'text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100' : 'text-slate-600 hover:text-slate-800 bg-white border border-brand-border hover:bg-slate-50';
            html += `<a href="${urlDe(fi.p)}" download="${esc(nomFichier(fi.p))}" class="${style} text-xs font-medium flex items-center gap-1 px-2.5 py-1.5 rounded smooth-transition focus-ring" title="Télécharger (${ff.label}, ${taille(fi.s)})" aria-label="Télécharger ${esc(r.titre)} en ${ff.label}">
                <i data-lucide="download" class="w-3.5 h-3.5"></i>${ff.label}</a>`;
        });
        return html;
    }

    function ligne(r, opts = {}) {
        const f = r.album ? { icone: TYPES[r.type].icone, couleur: 'text-teal-500' } : fmt(r.fichiers[0].e);
        const t = TYPES[r.type] || TYPES.cours;
        const meta = [];
        if (opts.contexte) {
            const m = matiere(r.matiere);
            meta.push(`<a href="${NIVEAUX[r.niveau] ? NIVEAUX[r.niveau].page : ''}#m=${encodeURIComponent(r.matiere)}" class="font-semibold text-slate-600 hover:text-brand-dark hover:underline">${esc(r.niveau)} · ${esc(nomCourt(m))}</a>`);
        }
        const etiquette = r.sous || (opts.badgeType === false ? null : t.court);
        if (etiquette) meta.push(`<span class="px-1.5 py-0.5 rounded ${t.badge} font-medium">${esc(etiquette)}</span>`);
        if (r.annee && !opts.sansAnnee) meta.push(`<span class="inline-flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3"></i>${esc(r.annee)}</span>`);
        if (r.groupes) meta.push(`<span>${esc(r.groupes.join(', '))}</span>`);
        const poids = r.fichiers.reduce((s, x) => s + x.s, 0);
        meta.push(`<span>${r.album ? pluriel(r.fichiers.length, 'image') + ' · ' : ''}${taille(poids)}</span>`);
        const extrait = r.extrait && opts.extrait !== false
            ? `<p class="text-xs text-slate-500 mt-1.5 clamp-2 italic">« ${esc(r.extrait)} »</p>` : '';
        return `<li class="group/l flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 p-3 rounded-lg hover:bg-slate-50 smooth-transition">
            <div class="flex items-start gap-3 min-w-0">
                <div class="w-8 h-8 shrink-0 rounded-lg bg-white border border-brand-border flex items-center justify-center"><i data-lucide="${f.icone}" class="w-4 h-4 ${f.couleur}"></i></div>
                <div class="min-w-0">
                    <p class="text-sm font-medium text-slate-800 clamp-2 break-words" title="${esc(r.titre)}">${surligner(r.titre, opts.q || '')}</p>
                    <div class="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[11px] text-slate-400">${meta.join('')}</div>
                    ${extrait}
                </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0 flex-wrap pl-11 sm:pl-0">${boutons(r)}</div>
        </li>`;
    }

    function vide(titre, texte, icone = 'inbox', cta = true) {
        return `<div class="bg-white border border-dashed border-brand-border rounded-xl p-8 sm:p-10 text-center">
            <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3"><i data-lucide="${icone}" class="w-6 h-6"></i></div>
            <p class="font-semibold text-brand-dark mb-1">${titre}</p>
            <p class="text-sm text-brand-gray mb-4 max-w-md mx-auto">${texte}</p>
            ${cta ? '<button type="button" data-modale="soumettre" class="inline-flex items-center gap-2 bg-brand-dark hover:bg-slate-800 text-white text-sm font-medium py-2 px-4 rounded smooth-transition"><i data-lucide="plus" class="w-4 h-4"></i>Partager un document</button>' : ''}
        </div>`;
    }

    /* ================================================================== */
    /* Aperçu (PDF, Office, image) et galerie                             */
    /* ================================================================== */
    const enLigne = /^https?:$/.test(location.protocol) && !/^(localhost|127\.|0\.0\.0\.0|192\.168\.|10\.)/.test(location.hostname);
    const absolu = (p) => new URL(urlDe(p), location.href).href;
    const petitEcran = () => window.matchMedia('(max-width: 767px)').matches;

    function dialogue() {
        let d = $('#apercu');
        if (d) return d;
        d = document.createElement('dialog');
        d.id = 'apercu';
        d.setAttribute('aria-labelledby', 'apercu-titre');
        d.innerHTML = `<div class="bg-white w-screen h-[100dvh] md:w-[min(64rem,92vw)] md:h-[88vh] md:rounded-xl overflow-hidden flex flex-col shadow-2xl">
            <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-brand-border bg-slate-50">
                <div class="min-w-0">
                    <p id="apercu-titre" class="font-semibold text-sm text-brand-dark truncate"></p>
                    <p id="apercu-sous" class="text-xs text-brand-gray truncate"></p>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                    <a id="apercu-onglet" target="_blank" rel="noopener" class="hidden sm:flex text-slate-500 hover:text-brand-dark hover:bg-slate-100 p-2 rounded smooth-transition focus-ring" title="Ouvrir dans un nouvel onglet"><i data-lucide="external-link" class="w-4 h-4"></i></a>
                    <a id="apercu-dl" class="bg-brand-dark hover:bg-slate-800 text-white text-xs font-medium py-2 px-3 rounded flex items-center gap-1.5 smooth-transition focus-ring"><i data-lucide="download" class="w-3.5 h-3.5"></i><span>Télécharger</span></a>
                    <button type="button" data-fermer class="text-slate-500 hover:text-brand-dark hover:bg-slate-100 p-2 rounded smooth-transition focus-ring" aria-label="Fermer"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
            </div>
            <div id="apercu-corps" class="relative flex-1 bg-slate-100 overflow-auto flex items-center justify-center"></div>
            <div id="apercu-pied" class="hidden items-center justify-between gap-3 px-4 py-2 border-t border-brand-border text-xs text-brand-gray">
                <button type="button" data-prec class="flex items-center gap-1 px-3 py-2 rounded hover:bg-slate-100 focus-ring"><i data-lucide="chevron-left" class="w-4 h-4"></i>Précédente</button>
                <span id="apercu-compteur"></span>
                <button type="button" data-suiv class="flex items-center gap-1 px-3 py-2 rounded hover:bg-slate-100 focus-ring">Suivante<i data-lucide="chevron-right" class="w-4 h-4"></i></button>
            </div>
        </div>`;
        document.body.appendChild(d);
        d.addEventListener('click', (e) => {
            if (e.target === d || e.target.closest('[data-fermer]')) d.close();
            if (e.target.closest('[data-prec]')) galerie(-1);
            if (e.target.closest('[data-suiv]')) galerie(1);
        });
        d.addEventListener('close', () => { $('#apercu-corps').innerHTML = ''; document.body.classList.remove('modal-open'); });
        d.addEventListener('keydown', (e) => {
            if (!d._album) return;
            if (e.key === 'ArrowLeft') galerie(-1);
            if (e.key === 'ArrowRight') galerie(1);
        });
        return d;
    }

    function ouvrir(r, fichier) {
        const d = dialogue();
        const f = fmt(fichier.e);
        const href = urlDe(fichier.p);
        $('#apercu-titre').textContent = r.titre;
        $('#apercu-sous').textContent = [NIVEAUX[r.niveau] ? NIVEAUX[r.niveau].nom : r.niveau, nomCourt(matiere(r.matiere)), r.annee].filter(Boolean).join(' · ');
        const dl = $('#apercu-dl');
        dl.href = href; dl.setAttribute('download', nomFichier(fichier.p));
        $('#apercu-onglet').href = href;
        const corps = $('#apercu-corps');
        if (f.apercu === 'pdf') {
            corps.innerHTML = `<iframe src="${href}#view=FitH" title="${esc(r.titre)}" class="w-full h-full bg-white" loading="lazy"></iframe>`;
        } else if (f.apercu === 'image') {
            corps.innerHTML = `<img src="${href}" alt="${esc(r.titre)}" class="max-w-full max-h-full object-contain select-none">`;
        } else if (f.apercu === 'office' && enLigne) {
            const src = 'https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURIComponent(absolu(fichier.p));
            corps.innerHTML = `<iframe src="${src}" title="${esc(r.titre)}" class="w-full h-full bg-white" loading="lazy"></iframe>`;
        } else {
            corps.innerHTML = `<div class="text-center p-8 max-w-sm">
                <div class="w-14 h-14 rounded-2xl bg-white text-slate-400 flex items-center justify-center mx-auto mb-4 shadow-sm"><i data-lucide="${f.icone}" class="w-7 h-7"></i></div>
                <p class="font-semibold text-brand-dark mb-1">Aperçu indisponible hors ligne</p>
                <p class="text-sm text-brand-gray mb-2">L'aperçu des fichiers ${esc(f.label)} fonctionne une fois le site publié. Vous pouvez le télécharger dès maintenant.</p>
                ${r.extrait ? `<p class="text-xs text-slate-500 italic bg-white rounded-lg p-3 mb-5 text-left">« ${esc(r.extrait)} »</p>` : ''}
                <a href="${href}" download="${esc(nomFichier(fichier.p))}" class="inline-flex items-center gap-2 bg-brand-dark hover:bg-slate-800 text-white text-sm font-medium py-2 px-4 rounded smooth-transition"><i data-lucide="download" class="w-4 h-4"></i>Télécharger (${taille(fichier.s)})</a>
            </div>`;
        }
        if (!d.open) { d.showModal(); document.body.classList.add('modal-open'); }
        icones();
    }

    function apercu(r) {
        const fichier = r.fichiers[0];
        if (fmt(fichier.e).apercu === 'pdf' && (petitEcran() || navigator.pdfViewerEnabled === false)) {
            window.open(urlDe(fichier.p), '_blank', 'noopener');
            return;
        }
        const d = dialogue();
        d._album = null;
        $('#apercu-pied').classList.add('hidden'); $('#apercu-pied').classList.remove('flex');
        ouvrir(r, fichier);
    }
    function album(r) {
        const d = dialogue();
        d._album = { r, index: 0 };
        const plusieurs = r.fichiers.length > 1;
        $('#apercu-pied').classList.toggle('hidden', !plusieurs); $('#apercu-pied').classList.toggle('flex', plusieurs);
        galerie(0);
    }
    function galerie(delta) {
        const d = $('#apercu');
        if (!d || !d._album) return;
        const a = d._album;
        const n = a.r.fichiers.length;
        a.index = (a.index + delta + n) % n;
        ouvrir(a.r, a.r.fichiers[a.index]);
        $('#apercu-compteur').textContent = `Image ${a.index + 1} sur ${n}`;
        $('#apercu-dl span').textContent = petitEcran() ? 'Image' : 'Télécharger cette image';
    }

    /* Corrigé proposé */
    function corrige(r) {
        const c = CORR[r.id];
        if (!c) return;
        let d = $('#corrige');
        if (!d) {
            d = document.createElement('dialog');
            d.id = 'corrige';
            d.setAttribute('aria-labelledby', 'corrige-titre');
            document.body.appendChild(d);
            d.addEventListener('click', (e) => {
                if (e.target === d || e.target.closest('[data-fermer]')) d.close();
                if (e.target.closest('[data-imprimer]')) imprimer($('#corrige-corps').innerHTML, $('#corrige-titre').textContent);
            });
            d.addEventListener('close', () => document.body.classList.remove('modal-open'));
        }
        d.innerHTML = `<div class="bg-white w-screen h-[100dvh] md:w-[min(52rem,92vw)] md:h-auto md:max-h-[88vh] md:rounded-xl overflow-hidden flex flex-col shadow-2xl">
            <div class="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-brand-border bg-emerald-50/60">
                <div class="min-w-0">
                    <p class="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Corrigé proposé</p>
                    <p id="corrige-titre" class="font-semibold text-sm text-brand-dark truncate">${esc(r.titre)}</p>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                    ${r.album ? '' : `<button type="button" data-apercu="${r.id}" class="hidden sm:flex text-slate-600 hover:text-brand-dark hover:bg-white text-xs font-medium items-center gap-1 px-2.5 py-2 rounded focus-ring"><i data-lucide="eye" class="w-3.5 h-3.5"></i>Sujet</button>`}
                    <button type="button" data-imprimer class="text-slate-600 hover:text-brand-dark hover:bg-white text-xs font-medium flex items-center gap-1 px-2.5 py-2 rounded focus-ring" title="Imprimer ou enregistrer en PDF"><i data-lucide="printer" class="w-3.5 h-3.5"></i><span class="hidden sm:inline">PDF</span></button>
                    <button type="button" data-fermer class="text-slate-500 hover:text-brand-dark hover:bg-white p-2 rounded focus-ring" aria-label="Fermer"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
            </div>
            <div class="overflow-auto px-4 sm:px-8 py-6">
                <div class="mb-5 flex gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3"><i data-lucide="info" class="w-4 h-4 shrink-0 mt-0.5"></i><span>Corrigé rédigé avec l'aide d'une IA à partir du sujet. Il sert à réviser et à vérifier sa démarche : confrontez-le à vos cours et signalez toute erreur.</span></div>
                <div id="corrige-corps" class="fiche">${c.html}</div>
            </div>
        </div>`;
        if (!d.open) { d.showModal(); document.body.classList.add('modal-open'); }
        icones();
    }

    function imprimer(html, titre) {
        const w = window.open('', '_blank');
        if (!w) return;
        const css = $$('link[rel="stylesheet"]').map((l) => `<link rel="stylesheet" href="${l.href}">`).join('');
        w.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>${esc(titre)}</title>${css}
            <style>body{background:#fff!important;display:block;font-family:Inter,system-ui,sans-serif;color:#0f172a;max-width:48rem;margin:2rem auto;padding:0 1.5rem}</style></head>
            <body><p style="font-size:12px;color:#64748b">ESGIS Ressources — ${esc(titre)}</p><div class="fiche">${html}</div>
            <script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script></body></html>`);
        w.document.close();
    }

    document.addEventListener('click', (e) => {
        const trouver = (attr) => { const el = e.target.closest('[' + attr + ']'); return el ? RES.find((x) => x.id === +el.getAttribute(attr)) : null; };
        let r;
        if ((r = trouver('data-apercu'))) { const c = $('#corrige'); if (c && c.open) c.close(); apercu(r); return; }
        if ((r = trouver('data-album'))) { album(r); return; }
        if ((r = trouver('data-corrige'))) { corrige(r); return; }
        const imp = e.target.closest('[data-imprimer-recap]');
        if (imp) imprimer($('#recap-corps').innerHTML, imp.dataset.imprimerRecap);
    });

    /* Modales communes */
    const MODALES = `
    <dialog id="soumettre" aria-labelledby="soumettre-titre">
        <div class="bg-white w-[min(30rem,calc(100vw-2rem))] rounded-xl shadow-2xl overflow-hidden">
            <div class="p-5 border-b border-brand-border bg-slate-50 flex items-start justify-between gap-3">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-brand-dark text-white flex items-center justify-center"><i data-lucide="upload" class="w-5 h-5"></i></div>
                    <div><h2 id="soumettre-titre" class="font-bold text-brand-dark">Partager une ressource</h2><p class="text-xs text-brand-gray">Épreuve, cours, TD, corrigé ou notes</p></div>
                </div>
                <button type="button" data-fermer class="text-slate-400 hover:text-brand-dark p-1 rounded focus-ring" aria-label="Fermer"><i data-lucide="x" class="w-5 h-5"></i></button>
            </div>
            <div class="p-5 space-y-4 text-sm text-slate-600">
                <p>Pour que votre document soit bien classé, indiquez :</p>
                <ul class="space-y-2">
                    <li class="flex gap-2"><i data-lucide="check" class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"></i><span>le <b class="text-brand-dark">niveau</b> (L1, L2, L3) et la <b class="text-brand-dark">matière</b> ;</span></li>
                    <li class="flex gap-2"><i data-lucide="check" class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"></i><span>le <b class="text-brand-dark">type</b> : contrôle continu, examen, rattrapage, cours, TD… ;</span></li>
                    <li class="flex gap-2"><i data-lucide="check" class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"></i><span>l'<b class="text-brand-dark">année académique</b> (ex. 2023-2024) et le groupe si besoin.</span></li>
                </ul>
                <p class="text-xs text-brand-gray bg-slate-50 border border-brand-border rounded p-3">Pas de copies notées ni de listes d'étudiants : seuls les sujets et supports de cours sont publiés.</p>
            </div>
            <div class="p-5 pt-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button type="button" data-fermer class="bg-white border border-brand-border text-slate-600 hover:bg-slate-50 text-sm font-medium py-2 px-4 rounded smooth-transition">Plus tard</button>
                <a data-lien="soumission" target="_blank" rel="noopener" class="bg-brand-dark hover:bg-slate-800 text-white text-sm font-medium py-2 px-4 rounded flex items-center justify-center gap-2 smooth-transition"><i data-lucide="send" class="w-4 h-4"></i>Envoyer le document</a>
            </div>
        </div>
    </dialog>
    <dialog id="confidentialite" aria-labelledby="conf-titre">
        <div class="bg-white w-[min(30rem,calc(100vw-2rem))] rounded-xl shadow-2xl p-5 text-sm text-slate-600 space-y-3">
            <div class="flex items-start justify-between gap-3">
                <h2 id="conf-titre" class="font-bold text-brand-dark text-base">Confidentialité</h2>
                <button type="button" data-fermer class="text-slate-400 hover:text-brand-dark p-1 rounded focus-ring" aria-label="Fermer"><i data-lucide="x" class="w-5 h-5"></i></button>
            </div>
            <p>Ce site ne demande aucun compte et ne collecte aucune donnée personnelle. Les documents sont publiés à des fins de révision.</p>
            <p>Un document vous concerne ou ne devrait pas être en ligne ? Signalez-le et il sera retiré rapidement.</p>
            <a data-lien="soumission" target="_blank" rel="noopener" class="inline-flex items-center gap-1 text-blue-600 font-medium hover:underline">Signaler un document <i data-lucide="arrow-right" class="w-4 h-4"></i></a>
        </div>
    </dialog>`;
    document.body.insertAdjacentHTML('beforeend', MODALES);
    $$('[data-lien="soumission"]').forEach((a) => { a.href = SITE.lienSoumission || SITE.depot || '#'; });
    $$('[data-lien="mentor"]').forEach((a) => { a.href = SITE.lienMentor || SITE.depot || '#'; });
    document.addEventListener('click', (e) => {
        const b = e.target.closest('[data-modale]');
        if (!b) return;
        e.preventDefault();
        const d = document.getElementById(b.dataset.modale);
        if (!d) return;
        d.showModal(); document.body.classList.add('modal-open');
        d.addEventListener('close', () => document.body.classList.remove('modal-open'), { once: true });
        d.onclick = (ev) => { if (ev.target === d || ev.target.closest('[data-fermer]')) d.close(); };
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) {
            const i = $('[data-recherche]');
            if (i) { e.preventDefault(); i.focus(); }
        }
    });

    /* ================================================================== */
    /* Accueil                                                            */
    /* ================================================================== */
    function pageAccueil() {
        const champ = $('#recherche');
        const zone = $('#resultats');
        const niveauSel = $('#filtre-niveau');
        let famille = 'tout';

        Object.keys(NIVEAUX).forEach((n) => {
            const el = $(`[data-compteur="${n}"]`);
            if (!el) return;
            const nbMat = ((NIV[n] || {}).matieres || []).filter((m) => !m.id.endsWith('-autres')).length;
            const nbDoc = RES.filter((r) => r.niveau === n).length;
            el.innerHTML = nbDoc ? `<span class="font-semibold text-brand-dark">${nbMat}</span> matières · <span class="font-semibold text-brand-dark">${nbDoc}</span> documents` : 'Bientôt disponible';
        });
        const total = $('[data-total]');
        if (total) total.textContent = RES.length;

        function rendre() {
            const q = champ.value.trim();
            const niv = niveauSel.value;
            if (!q && famille === 'tout' && !niv) { zone.innerHTML = ''; zone.classList.add('hidden'); return; }
            let liste = RES;
            if (niv) liste = liste.filter((r) => r.niveau === niv);
            if (famille !== 'tout') liste = liste.filter((r) => FAMILLES[famille].includes(r.type));
            liste = rechercher(liste, q);
            if (!q) liste = liste.slice().sort((a, b) => b._an - a._an);
            const mats = q ? matieresTrouvees(q, niv) : [];
            const MAX = 30;
            zone.classList.remove('hidden');
            const blocMats = mats.length ? `<div class="mb-4">
                <p class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Matières</p>
                <div class="flex flex-wrap gap-2">${mats.map((m) => `<a href="${NIVEAUX[m.niveau].page}#m=${m.id}" class="inline-flex items-center gap-2 bg-white border border-brand-border hover:border-slate-400 rounded-lg px-3 py-2 text-sm smooth-transition">
                    <span class="w-6 h-6 rounded bg-${m.couleur}-100 text-${m.couleur}-600 flex items-center justify-center"><i data-lucide="${m.icone}" class="w-3.5 h-3.5"></i></span>
                    <span class="font-medium text-brand-dark">${surligner(nomCourt(m), q)}</span><span class="text-xs text-slate-400">${m.niveau}</span></a>`).join('')}</div></div>` : '';
            zone.innerHTML = blocMats + (liste.length ? `
                <div class="bg-white border border-brand-border rounded-xl overflow-hidden shadow-sm">
                    <div class="px-4 py-3 border-b border-brand-border bg-slate-50 flex items-center justify-between gap-2">
                        <p class="text-sm font-semibold text-brand-dark" aria-live="polite">${pluriel(liste.length, 'document')}${q ? ` pour « ${esc(q)} »` : ''}</p>
                        ${liste.length > MAX ? `<span class="text-xs text-brand-gray">${MAX} premiers affichés</span>` : ''}
                    </div>
                    <ul class="p-1 sm:p-2 divide-y divide-slate-100">${liste.slice(0, MAX).map((r) => ligne(r, { contexte: true, q })).join('')}</ul>
                </div>` : (mats.length ? '' : vide('Aucun document trouvé', 'Essayez un autre mot : « SQL », « rattrapage 2023 », « Merise »… ou partagez l\'épreuve si vous l\'avez.', 'search-x')));
            icones();
        }
        let minuterie;
        champ.addEventListener('input', () => { clearTimeout(minuterie); minuterie = setTimeout(rendre, 120); });
        champ.addEventListener('keydown', (e) => { if (e.key === 'Escape') { champ.value = ''; rendre(); } });
        niveauSel.addEventListener('change', rendre);
        $$('[data-famille]').forEach((b) => b.addEventListener('click', () => {
            famille = b.dataset.famille;
            $$('[data-famille]').forEach((x) => {
                const on = x === b;
                x.setAttribute('aria-pressed', on);
                x.classList.toggle('bg-brand-dark', on); x.classList.toggle('text-white', on); x.classList.toggle('border-brand-dark', on);
                x.classList.toggle('bg-white', !on); x.classList.toggle('text-slate-600', !on);
            });
            rendre();
        }));
        rendre();
    }

    /* ================================================================== */
    /* Page d'un niveau : liste des matières  ↔  page d'une matière       */
    /* ================================================================== */
    function pageNiveau(niveau) {
        const niv = NIV[niveau] || { matieres: [], groupes: [] };
        const racine = $('#app');
        const etat = { q: '', semestre: 'tous', parcours: stock.lire('parcours') || 'tous', sous: 'tous' };

        const route = () => {
            const p = new URLSearchParams(location.hash.slice(1));
            return { m: p.get('m'), o: p.get('o') };
        };
        const lien = (m, o) => '#m=' + encodeURIComponent(m) + (o ? '&o=' + o : '');

        window.addEventListener('hashchange', () => { afficher(); window.scrollTo({ top: 0 }); });

        function afficher() {
            const r = route();
            if (r.m && MAT[r.m] && MAT[r.m].niveau === niveau) vueMatiere(r.m, r.o);
            else vueNiveau();
            icones();
        }

        /* ---------- Vue « niveau » : grille des matières ---------- */
        function carte(m) {
            const s = stats(m.id);
            const c = m.couleur || 'slate';
            const badges = [];
            if (s.epreuves) badges.push(`<span class="px-2 py-0.5 rounded bg-red-50 text-red-600 font-medium">${pluriel(s.epreuves, 'épreuve')}</span>`);
            if (s.cours) badges.push(`<span class="px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">${s.cours} cours</span>`);
            if (s.td) badges.push(`<span class="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">${s.td} TD/TP</span>`);
            if (s.corriges) badges.push(`<span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">${pluriel(s.corriges, 'corrigé')}</span>`);
            if (s.recap) badges.push(`<span class="px-2 py-0.5 rounded bg-violet-50 text-violet-700 font-medium inline-flex items-center gap-1"><i data-lucide="sparkles" class="w-3 h-3"></i>Récap</span>`);
            const infos = [];
            if (m.parcours && m.parcours.length < 3) infos.push('Parcours ' + m.parcours.join(', '));
            if (s.de) infos.push(s.de === s.a - 1 ? `${s.de}-${s.a}` : `${s.de} → ${s.a}`);
            return `<a href="${lien(m.id)}" class="group flex flex-col bg-white border border-brand-border rounded-xl p-4 hover:border-${c}-300 hover:shadow-md hover:-translate-y-0.5 smooth-transition focus-ring ${s.total ? '' : 'opacity-70'}">
                <div class="flex items-start gap-3">
                    <div class="w-10 h-10 shrink-0 rounded-lg bg-${c}-100 text-${c}-600 flex items-center justify-center group-hover:scale-105 smooth-transition"><i data-lucide="${m.icone}" class="w-5 h-5"></i></div>
                    <div class="min-w-0 flex-1">
                        <h3 class="font-semibold text-[15px] text-brand-dark leading-snug">${esc(nomCourt(m))}</h3>
                        <p class="text-[11px] text-brand-gray mt-0.5">${infos.length ? esc(infos.join(' · ')) : (s.total ? pluriel(s.total, 'document') : 'Aucun document pour l\'instant')}</p>
                    </div>
                    <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 smooth-transition mt-1 shrink-0"></i>
                </div>
                ${badges.length ? `<div class="mt-3 flex flex-wrap gap-1.5 text-[11px]">${badges.join('')}</div>` : ''}
            </a>`;
        }

        function filtreMatieres() {
            return niv.matieres.filter((m) => {
                const g = GRP[niveau + ':' + m.groupe] || {};
                if (etat.semestre !== 'tous' && g.semestre && g.semestre !== etat.semestre) return false;
                if (etat.parcours !== 'tous' && m.parcours && !m.parcours.includes(etat.parcours)) return false;
                return true;
            });
        }

        function vueNiveau() {
            document.title = `${niv.nom || NIVEAUX[niveau].nom} — matières et épreuves | ESGIS Ressources`;
            const total = RES.filter((r) => r.niveau === niveau).length;
            const c = NIVEAUX[niveau].couleur;
            const aSemestres = niv.groupes.some((g) => g.semestre);
            const outils = aSemestres ? `
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div class="inline-flex bg-slate-100 rounded-lg p-1 text-xs font-semibold w-full sm:w-auto" role="tablist" aria-label="Semestre">
                        ${[['tous', 'Toute l\'année'], ['S3', 'Semestre 3'], ['S4', 'Semestre 4']].map(([v, l]) => `<button type="button" role="tab" data-semestre="${v}" aria-selected="${etat.semestre === v}" class="flex-1 sm:flex-none px-3 py-2 rounded-md smooth-transition ${etat.semestre === v ? 'bg-white text-brand-dark shadow-sm' : 'text-slate-500 hover:text-brand-dark'}">${l}</button>`).join('')}
                    </div>
                    ${niv.parcours ? `<div class="flex items-center gap-2 scroll-x">
                        <span class="text-xs text-brand-gray shrink-0">Parcours</span>
                        ${[['tous', 'Tous']].concat(Object.keys(niv.parcours).map((k) => [k, k])).map(([v, l]) => `<button type="button" data-parcours="${v}" title="${esc(v === 'tous' ? 'Tous les parcours' : niv.parcours[v])}" aria-pressed="${etat.parcours === v}" class="shrink-0 text-xs font-medium px-3 py-1.5 rounded border smooth-transition ${etat.parcours === v ? 'bg-brand-dark text-white border-brand-dark' : 'bg-white text-slate-600 border-brand-border hover:bg-slate-50'}">${l}</button>`).join('')}
                    </div>` : ''}
                </div>` : '';

            const mats = filtreMatieres();
            const groupesHtml = niv.groupes.map((g) => {
                const liste = mats.filter((m) => m.groupe === g.id);
                if (!liste.length) return '';
                const nb = liste.reduce((s, m) => s + stats(m.id).total, 0);
                return `<section class="mb-8">
                    <div class="flex items-center gap-2 mb-3">
                        <i data-lucide="${g.icone}" class="w-4 h-4 text-${g.couleur}-600"></i>
                        <h2 class="text-sm font-bold text-brand-dark">${esc(g.nom)}</h2>
                        ${g.semestre && etat.semestre === 'tous' ? `<span class="text-[10px] font-semibold text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">${g.semestre}</span>` : ''}
                        <span class="text-xs text-slate-400">${pluriel(liste.length, 'matière')} · ${pluriel(nb, 'document')}</span>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">${liste.map(carte).join('')}</div>
                </section>`;
            }).join('');

            racine.innerHTML = `
                <div class="w-full mb-6 sm:mb-8">
                    <div class="inline-flex items-center gap-2 mb-4 px-3 py-1 bg-${c}-50 text-${c}-600 rounded-full text-xs font-semibold">
                        <i data-lucide="${{ L1: 'book-open', L2: 'code', L3: 'award' }[niveau]}" class="w-3.5 h-3.5"></i> ${esc(niv.filiere || 'IRT')}
                    </div>
                    <h1 class="text-3xl md:text-4xl font-bold tracking-tight text-brand-dark leading-tight mb-2">${esc(niv.nom || NIVEAUX[niveau].nom)}</h1>
                    <p class="text-base text-brand-gray max-w-2xl">${niv.matieres.length ? `Choisissez une matière pour retrouver ses épreuves par année, ses cours, ses TD, les corrigés et une fiche récap. <span class="whitespace-nowrap">${pluriel(niv.matieres.filter((m) => !m.id.endsWith('-autres')).length, 'matière')} · ${pluriel(total, 'document')}.</span>` : 'Les matières de ce niveau seront ajoutées au fur et à mesure des contributions.'}</p>
                </div>
                ${niv.matieres.length ? `
                <div class="w-full mb-6">
                    <div class="flex items-center w-full bg-white border border-brand-border rounded overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)] focus-within:border-slate-400 smooth-transition">
                        <div class="pl-4 pr-2 text-slate-400"><i data-lucide="search" class="w-5 h-5" stroke-width="1.5"></i></div>
                        <label for="recherche" class="sr-only">Rechercher une matière ou un document</label>
                        <input type="search" id="recherche" data-recherche autocomplete="off" enterkeyhint="search" value="${esc(etat.q)}"
                               class="flex-1 py-3 px-2 text-sm text-brand-dark placeholder-slate-400 bg-transparent w-full min-w-0"
                               placeholder="Rechercher une matière ou un document (ex. SQL 2022, rattrapage)…">
                        <kbd class="hidden md:inline-block mr-3 text-[10px] font-medium text-slate-400 border border-brand-border rounded px-1.5 py-0.5">/</kbd>
                    </div>
                </div>
                <div id="zone" class="w-full"></div>` : `<div class="w-full">${vide('Bientôt disponible', 'Vous avez des épreuves, cours ou TD de ' + esc(NIVEAUX[niveau].nom) + ' ? Partagez-les pour aider les prochaines promotions.')}</div>`}`;

            const zone = $('#zone');
            if (!zone) return;
            const champ = $('#recherche');
            const rendreZone = () => {
                const q = champ.value.trim();
                etat.q = q;
                if (!q) { zone.innerHTML = outils + groupesHtml; icones(); return; }
                const ms = matieresTrouvees(q, niveau);
                const docs = rechercher(RES.filter((r) => r.niveau === niveau), q);
                zone.innerHTML = `
                    ${ms.length ? `<section class="mb-6"><p class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Matières</p>
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">${ms.map(carte).join('')}</div></section>` : ''}
                    ${docs.length ? `<section><p class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">${pluriel(docs.length, 'document')}</p>
                        <div class="bg-white border border-brand-border rounded-xl shadow-sm"><ul class="p-1 sm:p-2 divide-y divide-slate-100">${docs.slice(0, 60).map((r) => ligne(r, { contexte: true, q })).join('')}</ul></div>
                        ${docs.length > 60 ? '<p class="text-xs text-brand-gray mt-2">60 premiers résultats affichés : précisez la recherche.</p>' : ''}</section>`
                        : (ms.length ? '' : vide('Aucun résultat', 'Essayez un autre mot, ou ouvrez une matière pour parcourir tous ses documents.', 'search-x', false))}`;
                icones();
            };
            let minuterie;
            champ.addEventListener('input', () => { clearTimeout(minuterie); minuterie = setTimeout(rendreZone, 120); });
            champ.addEventListener('keydown', (e) => { if (e.key === 'Escape') { champ.value = ''; rendreZone(); } });
            zone.onclick = (e) => {
                const s = e.target.closest('[data-semestre]');
                if (s) { etat.semestre = s.dataset.semestre; vueNiveau(); icones(); return; }
                const p = e.target.closest('[data-parcours]');
                if (p) { etat.parcours = p.dataset.parcours; stock.ecrire('parcours', etat.parcours); vueNiveau(); icones(); }
            };
            rendreZone();
        }

        /* ---------- Vue « matière » ---------- */
        function vueMatiere(id, onglet) {
            const m = MAT[id];
            const g = GRP[niveau + ':' + m.groupe] || {};
            const liste = parMatiere[id] || [];
            const s = stats(id);
            const c = m.couleur || 'slate';
            const compte = { epreuves: s.epreuves, cours: s.cours, td: s.td, corriges: s.corriges, recap: s.recap ? 1 : 0 };
            if (!onglet || !ONGLETS.some((o) => o.id === onglet)) onglet = ONGLETS.find((o) => compte[o.id])?.id || 'epreuves';
            document.title = `${m.nom} — ${NIVEAUX[niveau].nom} | ESGIS Ressources`;

            const visibles = niv.matieres;
            const i = visibles.findIndex((x) => x.id === id);
            const prec = visibles[i - 1], suiv = visibles[i + 1];
            const meta = [g.nom ? 'UE ' + g.nom : null, g.semestre ? 'Semestre ' + g.semestre.slice(1) : null, m.parcours && m.parcours.length < 3 ? 'Parcours ' + m.parcours.join(', ') : null].filter(Boolean);

            racine.innerHTML = `
                <nav class="w-full text-xs text-brand-gray mb-5 flex items-center gap-1.5 flex-wrap" aria-label="Fil d'Ariane">
                    <a href="#" class="hover:text-brand-dark font-medium">${esc(NIVEAUX[niveau].nom)}</a>
                    <i data-lucide="chevron-right" class="w-3 h-3 text-slate-300"></i>
                    <span>${esc(g.nom || 'Matières')}</span>
                    <i data-lucide="chevron-right" class="w-3 h-3 text-slate-300"></i>
                    <span class="text-brand-dark font-medium truncate max-w-[16rem]">${esc(nomCourt(m))}</span>
                </nav>
                <div class="w-full flex items-start gap-4 mb-6">
                    <div class="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-${c}-100 text-${c}-600 flex items-center justify-center shadow-sm"><i data-lucide="${m.icone}" class="w-6 h-6 sm:w-7 sm:h-7"></i></div>
                    <div class="min-w-0">
                        <h1 class="text-2xl md:text-3xl font-bold tracking-tight text-brand-dark leading-tight">${esc(m.nom)}</h1>
                        ${meta.length ? `<p class="text-sm text-brand-gray mt-1">${esc(meta.join(' · '))}</p>` : ''}
                        <div class="flex flex-wrap gap-2 mt-3 text-xs">
                            <span class="inline-flex items-center gap-1.5 bg-white border border-brand-border rounded px-2 py-1"><i data-lucide="files" class="w-3.5 h-3.5 text-slate-400"></i>${pluriel(s.total, 'document')}</span>
                            ${s.de ? `<span class="inline-flex items-center gap-1.5 bg-white border border-brand-border rounded px-2 py-1"><i data-lucide="calendar-range" class="w-3.5 h-3.5 text-slate-400"></i>${s.de} → ${s.a}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="toolbar-sticky w-[calc(100%+2rem)] sm:w-full -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-brand-border mb-6">
                    <div class="flex gap-1 scroll-x" role="tablist" aria-label="Contenu de la matière">
                        ${ONGLETS.map((o) => `<a href="${lien(id, o.id)}" role="tab" aria-selected="${o.id === onglet}" class="shrink-0 inline-flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium border-b-2 -mb-px smooth-transition ${o.id === onglet ? 'border-brand-dark text-brand-dark' : 'border-transparent text-slate-500 hover:text-brand-dark'}">
                            <i data-lucide="${o.icone}" class="w-4 h-4"></i>${o.label}${o.id !== 'recap' ? `<span class="text-xs ${o.id === onglet ? 'text-slate-500' : 'text-slate-400'}">${compte[o.id]}</span>` : (s.recap ? '<span class="w-1.5 h-1.5 rounded-full bg-violet-500"></span>' : '')}</a>`).join('')}
                    </div>
                </div>
                <div id="onglet" class="w-full min-h-[40vh]"></div>
                <div class="w-full grid grid-cols-2 gap-3 mt-12 pt-6 border-t border-brand-border">
                    <div>${prec ? `<a href="${lien(prec.id)}" class="group block rounded-lg p-3 hover:bg-white border border-transparent hover:border-brand-border smooth-transition"><span class="text-[11px] text-brand-gray flex items-center gap-1"><i data-lucide="arrow-left" class="w-3 h-3"></i>Précédente</span><span class="text-sm font-medium text-brand-dark clamp-2">${esc(nomCourt(prec))}</span></a>` : ''}</div>
                    <div class="text-right">${suiv ? `<a href="${lien(suiv.id)}" class="group block rounded-lg p-3 hover:bg-white border border-transparent hover:border-brand-border smooth-transition"><span class="text-[11px] text-brand-gray flex items-center justify-end gap-1">Suivante<i data-lucide="arrow-right" class="w-3 h-3"></i></span><span class="text-sm font-medium text-brand-dark clamp-2">${esc(nomCourt(suiv))}</span></a>` : ''}</div>
                </div>`;

            const zone = $('#onglet');
            const o = ONGLETS.find((x) => x.id === onglet);
            const items = liste.filter((r) => o.types.includes(r.type));

            if (onglet === 'epreuves') {
                const rendreEp = () => {
                    const presents = SOUS.filter((x) => items.some((r) => r.sous === x.id));
                    const nbPhotos = items.filter((r) => r.type === 'photos').length;
                    const filtres = [['tous', 'Toutes', items.length]].concat(presents.map((x) => [x.id, x.label, items.filter((r) => r.sous === x.id).length]));
                    if (nbPhotos) filtres.push(['photos', 'Photos', nbPhotos]);
                    if (!filtres.some((f) => f[0] === etat.sous)) etat.sous = 'tous';
                    const sel = items.filter((r) => etat.sous === 'tous' || (etat.sous === 'photos' ? r.type === 'photos' : r.sous === etat.sous));
                    zone.innerHTML = items.length ? `
                        ${filtres.length > 2 ? `<div class="flex gap-2 scroll-x mb-6">${filtres.map(([v, l, n]) => `<button type="button" data-sous="${esc(v)}" aria-pressed="${etat.sous === v}" class="shrink-0 text-xs font-medium px-3 py-1.5 rounded border smooth-transition ${etat.sous === v ? 'bg-brand-dark text-white border-brand-dark' : 'bg-white text-slate-600 border-brand-border hover:bg-slate-50'}">${esc(l)} <span class="${etat.sous === v ? 'text-slate-300' : 'text-slate-400'}">${n}</span></button>`).join('')}</div>` : ''}
                        ${parAnnee(sel)}` : vide('Pas encore d\'épreuve pour cette matière', 'Vous avez un sujet de contrôle ou d\'examen ? Partagez-le pour aider les autres étudiants.');
                    icones();
                };
                zone.onclick = (e) => { const b = e.target.closest('[data-sous]'); if (b) { etat.sous = b.dataset.sous; rendreEp(); } };
                rendreEp();
                return;
            }
            if (onglet === 'recap') {
                const rc = CONT.recaps && CONT.recaps[id];
                zone.innerHTML = rc ? `
                    <div class="bg-white border border-brand-border rounded-xl shadow-sm overflow-hidden">
                        <div class="px-4 sm:px-6 py-3 border-b border-brand-border bg-violet-50/60 flex items-center justify-between gap-3">
                            <p class="text-sm font-semibold text-violet-800 flex items-center gap-2"><i data-lucide="sparkles" class="w-4 h-4"></i>Fiche récap</p>
                            <button type="button" data-imprimer-recap="Récap — ${esc(m.nom)}" class="text-xs font-medium text-slate-600 hover:text-brand-dark bg-white border border-brand-border rounded px-2.5 py-1.5 flex items-center gap-1 focus-ring"><i data-lucide="printer" class="w-3.5 h-3.5"></i>Imprimer / PDF</button>
                        </div>
                        <div id="recap-corps" class="fiche px-4 sm:px-8 py-6">${rc.html}</div>
                        <p class="px-4 sm:px-8 pb-5 text-[11px] text-brand-gray">Fiche rédigée avec l'aide d'une IA à partir des cours et des épreuves de cette page. Elle ne remplace pas le cours : signalez toute erreur.</p>
                    </div>` : vide('Récap en préparation', 'La fiche de révision de cette matière n\'est pas encore rédigée. En attendant, les épreuves des années précédentes sont le meilleur entraînement.', 'sparkles', false);
                return;
            }
            if (onglet === 'corriges') {
                const proposes = liste.filter((r) => CORR[r.id]).sort((a, b) => b._an - a._an);
                zone.innerHTML = (proposes.length || items.length) ? `
                    ${proposes.length ? `<section class="mb-8">
                        <h2 class="text-sm font-bold text-brand-dark mb-1 flex items-center gap-2"><i data-lucide="check-check" class="w-4 h-4 text-emerald-600"></i>Corrigés proposés</h2>
                        <p class="text-xs text-brand-gray mb-3">Rédigés avec l'aide d'une IA à partir des sujets : utiles pour vérifier votre démarche, à confronter au cours.</p>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">${proposes.map((r) => `<button type="button" data-corrige="${r.id}" class="text-left bg-white border border-brand-border hover:border-emerald-300 hover:shadow-md rounded-xl p-4 smooth-transition focus-ring">
                            <div class="flex items-center gap-2 text-[11px] mb-1.5"><span class="px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-medium">${esc(r.sous || 'Épreuve')}</span>${r.annee ? `<span class="text-slate-400">${esc(r.annee)}</span>` : ''}</div>
                            <p class="text-sm font-semibold text-brand-dark clamp-2">${esc(r.titre)}</p>
                            <p class="text-xs text-emerald-700 font-medium mt-2 flex items-center gap-1">Voir le corrigé <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i></p></button>`).join('')}</div>
                    </section>` : ''}
                    ${items.length ? `<section><h2 class="text-sm font-bold text-brand-dark mb-3 flex items-center gap-2"><i data-lucide="file-check-2" class="w-4 h-4"></i>Documents corrigés et TD traités</h2>
                        <div class="bg-white border border-brand-border rounded-xl"><ul class="p-1 sm:p-2 divide-y divide-slate-100">${items.map((r) => ligne(r)).join('')}</ul></div></section>` : ''}`
                    : vide('Pas encore de corrigé', 'Les corrigés proposés arrivent progressivement. Vous avez corrigé une épreuve ? Partagez votre correction.', 'file-check-2');
                return;
            }
            // Cours, TD & TP : regroupés par type
            const parType = o.types.filter((t) => items.some((r) => r.type === t));
            zone.innerHTML = items.length ? parType.map((t) => {
                const l = items.filter((r) => r.type === t).sort((a, b) => (b._an - a._an) || a.titre.localeCompare(b.titre, 'fr', { numeric: true }));
                return `<section class="mb-8">
                    <h2 class="text-sm font-bold text-brand-dark mb-3 flex items-center gap-2"><i data-lucide="${TYPES[t].icone}" class="w-4 h-4"></i>${esc(TYPES[t].label)}<span class="text-xs font-medium text-slate-400">${l.length}</span></h2>
                    <div class="bg-white border border-brand-border rounded-xl"><ul class="p-1 sm:p-2 divide-y divide-slate-100">${l.map((r) => ligne(r, { badgeType: false })).join('')}</ul></div>
                </section>`;
            }).join('') : vide(onglet === 'cours' ? 'Pas encore de cours pour cette matière' : 'Pas encore de TD ou de TP', 'Vous avez un support, des notes ou une série d\'exercices ? Partagez-les.');
        }

        function parAnnee(liste) {
            if (!liste.length) return vide('Rien dans cette catégorie', 'Choisissez un autre filtre.', 'filter', false);
            const groupes = {};
            liste.forEach((r) => { const k = r.annee && /^\d{4}-\d{4}$/.test(r.annee) && +r.annee.slice(5) - +r.annee.slice(0, 4) === 1 ? r.annee : (r.annee ? r.annee : 'inconnue'); (groupes[k] = groupes[k] || []).push(r); });
            const cles = Object.keys(groupes).sort((a, b) => (a === 'inconnue') - (b === 'inconnue') || b.localeCompare(a));
            const ordreSous = { 'Examen / CT': 0, 'Rattrapage': 1, 'Contrôle continu': 2, 'Devoir': 3 };
            return `<div class="relative">
                ${cles.map((k) => {
                    const l = groupes[k].sort((a, b) => (ordreSous[a.sous] ?? 9) - (ordreSous[b.sous] ?? 9) || a.titre.localeCompare(b.titre, 'fr', { numeric: true }));
                    return `<section class="relative pl-6 sm:pl-8 pb-8 border-l-2 border-slate-100 last:pb-0">
                        <span class="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-white border-2 ${k === 'inconnue' ? 'border-slate-300' : 'border-brand-dark'}"></span>
                        <h3 class="text-sm font-bold text-brand-dark mb-3 flex items-baseline gap-2">${k === 'inconnue' ? 'Année non précisée' : esc(k)}<span class="text-xs font-medium text-slate-400">${pluriel(l.length, 'document')}</span></h3>
                        <div class="bg-white border border-brand-border rounded-xl"><ul class="p-1 sm:p-2 divide-y divide-slate-100">${l.map((r) => ligne(r, { sansAnnee: k !== 'inconnue' })).join('')}</ul></div>
                    </section>`;
                }).join('')}
            </div>`;
        }

        afficher();
    }

    /* ================================================================== */
    const page = document.body.dataset.page;
    if (page === 'accueil') pageAccueil();
    else if (page === 'niveau') pageNiveau(document.body.dataset.niveau);
    icones();
})();
