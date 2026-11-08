/* Construit assets/contenus.js à partir des fichiers Markdown de contenus/.
   Usage : node outils/construire_contenus.mjs   (nécessite les paquets « marked » et « katex »)
   - contenus/recaps/<id-matiere>.md      -> fiche récap de la matière
   - contenus/corriges/<nom>.md           -> corrigé ; en-tête « fichier: <chemin de l'épreuve> »
   Syntaxe en plus du Markdown :
     $...$ et $$...$$ pour les formules ; blocs :::retenir / :::piege / :::methode ... ::: ;
     bloc :::freq avec des lignes « Thème | nombre d'épreuves | total ».  */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const chercher = (nom) => { for (const p of [nom, '/opt/npm-tools/node_modules/' + nom]) { try { return require(p); } catch (e) { /* suivant */ } } throw new Error('Paquet manquant : ' + nom); };
const { marked } = chercher('marked');
const katex = chercher('katex');

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const C = path.join(RACINE, 'contenus');

function maths(src) {
    // Protège les formules avant Markdown
    const store = [];
    src = src.replace(/\$\$([\s\S]+?)\$\$/g, (_, f) => { store.push(katex.renderToString(f.trim(), { displayMode: true, throwOnError: false })); return `@@M${store.length - 1}@@`; });
    src = src.replace(/(^|[^\\$])\$([^\n$]+?)\$/g, (_, a, f) => { store.push(katex.renderToString(f.trim(), { throwOnError: false })); return `${a}@@M${store.length - 1}@@`; });
    return { src, store };
}
const TITRES = { retenir: 'À retenir', piege: 'Piège classique', methode: 'Méthode' };
function blocs(src) {
    return src.replace(/^:::(retenir|piege|methode|freq)[ \t]*(.*)\n([\s\S]*?)^:::[ \t]*$/gm, (_, type, titre, corps) => {
        if (type === 'freq') {
            const lignes = corps.trim().split('\n').map((l) => l.split('|').map((x) => x.trim()));
            return '<div class="freq">' + lignes.map(([t, n, tot]) => `<span>${marked.parseInline(t)}</span><span class="freq-nb">${n} / ${tot} épreuves</span><div class="freq-barre"><span style="width:${Math.round(100 * n / tot)}%"></span></div>`).join('') + '</div>\n';
        }
        return `<div class="cadre cadre-${type}"><p><strong>${titre || TITRES[type]}</strong></p>\n\n${corps}\n</div>\n`;
    });
}
function rendre(md) {
    const { src, store } = maths(md);
    let html = marked.parse(blocs(src));
    return html.replace(/@@M(\d+)@@/g, (_, i) => store[+i]);
}
function entete(md) {
    const m = md.match(/^---\n([\s\S]*?)\n---\n/);
    if (!m) return { meta: {}, corps: md };
    const meta = {};
    m[1].split('\n').forEach((l) => { const i = l.indexOf(':'); if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim(); });
    return { meta, corps: md.slice(m[0].length) };
}

const out = { recaps: {}, corriges: {} };
for (const f of fs.existsSync(path.join(C, 'recaps')) ? fs.readdirSync(path.join(C, 'recaps')) : []) {
    if (!f.endsWith('.md')) continue;
    const { corps } = entete(fs.readFileSync(path.join(C, 'recaps', f), 'utf8'));
    out.recaps[f.slice(0, -3)] = { html: rendre(corps) };
}
for (const f of fs.existsSync(path.join(C, 'corriges')) ? fs.readdirSync(path.join(C, 'corriges')) : []) {
    if (!f.endsWith('.md')) continue;
    const { meta, corps } = entete(fs.readFileSync(path.join(C, 'corriges', f), 'utf8'));
    if (!meta.fichier) { console.warn('Sans en-tête « fichier: » :', f); continue; }
    for (const p of meta.fichier.split(';').map((x) => x.trim()).filter(Boolean)) out.corriges[p] = { html: rendre(corps), titre: meta.titre || '' };
}
fs.writeFileSync(path.join(RACINE, 'assets', 'contenus.js'),
    '/* Généré par outils/construire_contenus.mjs à partir de contenus/ — ne pas modifier à la main. */\nwindow.CONTENUS = ' + JSON.stringify(out) + ';\n');
console.log(`${Object.keys(out.recaps).length} récaps, ${Object.keys(out.corriges).length} corrigés -> assets/contenus.js`);
