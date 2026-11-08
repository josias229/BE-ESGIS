#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Générateur du catalogue de la Banque d'Épreuves ESGIS.

Usage (depuis le dossier BE-ESGIS) :
    python outils/generer_catalogue.py

Le script parcourt les dossiers de ressources, classe chaque fichier
(niveau, matière, type, année académique, groupe), regroupe les doublons
et les versions d'un même document (PDF + Word), écarte les fichiers
personnels ou techniques, puis écrit assets/catalogue.js.

La matière est déterminée, dans l'ordre :
  1. outils/classement_manuel.json (corrections vérifiées, y compris celles
     issues de l'analyse du contenu des documents) ;
  2. le nom du fichier et le dossier, comparés à la liste officielle des
     matières (outils/matieres.json) ;
  3. le contenu du document, si l'option --textes est fournie.

Relancez-le à chaque fois que vous ajoutez des fichiers.
"""
import json
import os
import re
import sys
import unicodedata
from collections import defaultdict
from datetime import datetime
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Dossiers sources -> niveau par défaut. L'ordre fixe la priorité en cas de doublon.
SOURCES = [
    ("Dossier L2IRT", "L2"),
    ("COURS ET EPREUVES L2", "L2"),
    ("L1 - Matières", "L1"),
    ("archiveL1", "L1"),
    ("L3", "L3"),
    ("Dossier L3", "L3"),
]

# Sous-dossiers ignorés (copies complètes, projets compilés, installeurs…)
DOSSIERS_IGNORES = [
    "L1 - Matières/ARCHIVES RIVAROL",   # copie intégrale de archiveL1
    "archiveL1/HTML/Epreuve_L1",        # copie de archiveL1/Epreuve_L1
    "OracleXE", "/bin/", "/obj/", "/mon_site", "/mon-site", "/mon-portfolio",
    "/TP HTML-G5/", "/.git", "node_modules",
]

EXTENSIONS = {
    "pdf": "PDF", "docx": "Word", "doc": "Word", "pptx": "PowerPoint", "ppt": "PowerPoint",
    "xlsx": "Excel", "xls": "Excel", "odt": "Document", "txt": "Texte", "sql": "SQL",
    "accdb": "Access", "zip": "Archive", "rar": "Archive", "7z": "Archive",
    "jpg": "Image", "jpeg": "Image", "png": "Image",
}
IMAGES = {"jpg", "jpeg", "png"}

TAILLE_MAX = 95 * 1024 * 1024   # GitHub refuse les fichiers > 100 Mo

# Fichiers contenant des données personnelles ou hors sujet : jamais publiés.
EXCLUSIONS = [
    r"listes? des apprenants", r"jury licence", r"lettre_de_motivation_", r"anip_doc",
    r"emploi_du_temps", r"reglement_esgis_cup", r"^grille l1irt", r"^akpovi edgard",
    r"^noukpo vertueux", r"liste des matieres",
]


def sans_accents(s):
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    return re.sub(r" {2,}", " ", s.replace("_", " ").replace("’", "'"))


def rx(motif):
    """Les motifs s'écrivent avec _ ou espace : on normalise comme le texte."""
    return re.compile(re.sub(r" {2,}", " ", motif.replace("_", " ")))


def type_de(nom, dossiers, ext):
    n = sans_accents(nom)
    racine = dossiers.split("/")[0]
    d = sans_accents("/".join(dossiers.split("/")[1:]))
    if ext == "mp4":
        return "video", None
    if re.search(r"corrig|traite\)|\(traite|solution|correction", n):
        return "corrige", None
    if re.search(r"rattrap|rattapage|catch-up|recuperation|^s2[ _]|\bs2\b|session 2|2 epr", n):
        return "epreuve", "Rattrapage"
    if re.search(r"\bcc\b|controle? continu|partiel", n):
        return "epreuve", "Contrôle continu"
    if re.search(r"\bct\b|terminal|termial|evaluation terminale|examen|\bexam|final", n):
        return "epreuve", "Examen / CT"
    if re.search(r"\bcontrole?\b", n):
        return "epreuve", "Contrôle continu"
    if re.search(r"devoir|evaluation|\btest\b|epreuve|^dev |interro", n):
        return "epreuve", "Devoir"
    if re.search(r"\bqcm\b|\btd\b|td[0-9_ -]|travaux diriges|exercice|excercie|exo|planche|serie|application", n):
        return "td", None
    if re.search(r"\btp\b|tp[0-9_ -]|travaux pratiques|atelier|(?<!gestion de )projet|mini devoir", n):
        return "tp", None
    if re.search(r"expose|expos[0-9]|rapport|presentation", n):
        return "expose", None
    if re.search(r"fiche|revision|cheatsheet|glossaire|commandes|memo|resume|canevas|mode d.emploi|syllabus|programme du cours|guide", n):
        return "fiche", None
    if re.search(r"cours|support|chapitre|chap_|module|polycop|introduction|initiation|tutoriel|partie|book|cm-", n):
        return "cours", None
    # Repli sur le nom du dossier
    if re.search(r"epreuve|rattrapage|examen", d):
        return "epreuve", ("Rattrapage" if "rattrapage" in d else None)
    if re.search(r"exercice|devoir", d):
        return "td", None
    if re.search(r"expose", d):
        return "expose", None
    if re.search(r"cours|image", d):
        return "cours", None
    if racine == "Dossier L2IRT" and ext not in ("pptx", "ppt"):
        return "epreuve", None
    return "cours", None


TYPES = {
    "epreuve": "Épreuve", "corrige": "Corrigé", "cours": "Cours & supports",
    "td": "TD & exercices", "tp": "TP & projets", "expose": "Exposés",
    "fiche": "Fiches & notes", "video": "Vidéos", "photos": "Photos d'épreuves",
    "notes": "Notes de cours (photos)",
}


# --------------------------------------------------------------------------
# Année académique, groupes, titre
# --------------------------------------------------------------------------
def annee_de(nom, mtime=None):
    n = sans_accents(nom)
    m = re.search(r"(20[12]\d)\s*[-_ /]\s*(20[12]\d)", n)
    if m and int(m.group(2)) - int(m.group(1)) == 1:
        return f"{m.group(1)}-{m.group(2)}"
    m = re.search(r"(?<!\d)([12]\d)\s*[-_]\s*([12]\d)(?!\d)", n)
    if m and int(m.group(2)) - int(m.group(1)) == 1:
        return f"20{m.group(1)}-20{m.group(2)}"
    m = re.search(r"(?:img|vid)[-_](20[12]\d)(\d\d)(\d\d)", n) or re.search(r"(?<!\d)(20[12]\d)(\d\d)(\d\d)(?!\d)", n)
    if m:
        y, mo = int(m.group(1)), int(m.group(2))
        if 1 <= mo <= 12:
            return f"{y}-{y+1}" if mo >= 9 else f"{y-1}-{y}"
    m = re.search(r"(?<!\d)(20[12]\d)(?!\d)", n)
    if m:
        y = int(m.group(1))
        if 2015 <= y <= 2030:
            # Une année seule (ex. « juin 2022 ») = fin de l'année académique
            return f"{y-1}-{y}"
    return None


def groupes_de(nom):
    n = sans_accents(nom)
    g = set()
    for m in re.finditer(r"(?:\bg|groupe[s]?\s*|grpe?\s*|grp\s*|g°)\s*(\d)(?!\d)(?:\s*(?:&|et|-|,| )\s*g?(\d)(?!\d))?(?:\s*(?:&|et|-|,| )\s*g?(\d)(?!\d))?", n):
        for x in m.groups():
            if x and x in "123456":
                g.add("G" + x)
    return sorted(g)


def joli_titre(nom_sans_ext, dossier=""):
    t = nom_sans_ext
    if len(t) > 60 and not re.search(r"[ _]", t):
        # Nom généré automatiquement (téléchargement Google, WhatsApp…)
        return "Document — " + (dossier.split("/")[-1] or "sans titre")
    t = re.sub(r"^\[[^\]]*\]\s*-?\s*", "", t)           # [2023-2024-L2-IRT-ESGIS]-
    t = re.sub(r"^\d{4}-\d{4}-L\d[^\]]*\]\s*-?\s*", "", t)
    t = t.replace("_", " ").replace("+", " ")
    t = re.sub(r"\s*-\s*Copie(\s*\(\d+\))?", "", t, flags=re.I)
    t = re.sub(r"\s*\(\d+\)", "", t)
    t = re.sub(r"\s*\(Récupération automatique\)|\s*\(Enregistré automatiquement\)", "", t, flags=re.I)
    t = re.sub(r"\[\d\]", "", t)
    t = re.sub(r"\s+", " ", t).strip(" -.")
    mots = []
    for w in t.split(" "):
        coeur = re.sub(r"[^A-Za-zÀ-ÿ0-9]", "", w)
        if coeur.upper() in SIGLES or re.fullmatch(r"(L[1-3](IRT|IIR)?(G\d)?|G\d|IRT\d|S\d)", coeur.upper()):
            mots.append(re.sub(re.escape(coeur), coeur.upper(), w))
        elif coeur.upper() in NOMS:
            mots.append(re.sub(re.escape(coeur), coeur.capitalize(), w))
        elif len(coeur) > 1 and coeur.isupper():
            mots.append(w.lower())
        else:
            mots.append(w)
    t = " ".join(mots)
    return (t[:1].upper() + t[1:]) if t else nom_sans_ext


SIGLES = set("""IRT IIR CT CC TD TP SQL PHP GNU MCD MLD UML XML ESGIS RO MA MF BD BDR SI SIE ATO CLP TEEO IP
POO CCNA BRI SE SEW OB SGBD ASE HTML CSS JS JAVA DCL LMD LDD TCL STP SRWE MS SRC SRS AL GP QCM ADM RAM VE CV PGCD""".split())
NOMS = set("SASSAI SISSO DAGBETO AGBOHOUTO BADAROU ADJIBI AKOUENOUBA KAKPO FIACRE MATHA GBO DUPOND".split())


def cle_titre(t):
    t = sans_accents(t)
    t = re.sub(r"\s\d$", "", t)  # « TD3 2 » -> « td3 »
    return re.sub(r"[^a-z0-9]+", "", t)



def collecter_depuis_disque():
    fichiers = []
    for dossier, _ in SOURCES:
        base = os.path.join(RACINE, dossier)
        if not os.path.isdir(base):
            continue
        for racine, _dirs, noms in os.walk(base):
            for nom in noms:
                plein = os.path.join(racine, nom)
                rel = os.path.relpath(plein, RACINE).replace(os.sep, "/")
                try:
                    st = os.stat(plein)
                except OSError:
                    continue
                fichiers.append({"p": rel, "s": st.st_size, "m": int(st.st_mtime * 1000)})
    return fichiers


# --------------------------------------------------------------------------
# Matières officielles (outils/matieres.json)
# --------------------------------------------------------------------------
REF = json.load(open(os.path.join(RACINE, "outils", "matieres.json"), encoding="utf-8"))
MATS = {}
for _niv in ("L1", "L2", "L3"):
    for _m in REF[_niv]["matieres"]:
        _m["niveau"] = _niv
        _m["_dossiers"] = [rx(p) for p in _m.get("dossiers", [])]
        _m["_nom"] = [rx(p) for p in _m.get("nom_motifs", [])]
        _m["_mots"] = [rx(p) for p in _m.get("motscles", [])]
        MATS[_m["id"]] = _m


def autres_id(niveau):
    return niveau.lower() + "-autres"


def charger_json(nom, defaut):
    p = os.path.join(RACINE, "outils", nom)
    if os.path.exists(p):
        with open(p, encoding="utf-8") as fh:
            return json.load(fh)
    return defaut


# Classement forcé (chemin -> id de matière). Rempli après analyse du contenu ;
# vous pouvez aussi l'éditer à la main pour corriger un document mal rangé.
MANUEL = charger_json("classement_manuel.json", {})
# Extraits de texte (chemin -> première phrase utile du sujet), pour l'aperçu rapide.
EXTRAITS = charger_json("extraits.json", {})

ANGLAIS = set("the and of to is are in that this for with you your what which write answer following text questions sentences".split())


def scores_contenu(texte, niveau):
    """Score de chaque matière du niveau d'après le contenu du document."""
    t = sans_accents(texte)[:60000]
    res = {}
    for m in REF[niveau]["matieres"]:
        distincts, total = 0, 0
        for r in m["_mots"]:
            n = len(r.findall(t))
            if n:
                distincts += 1
                total += min(n, 8)
        if distincts:
            res[m["id"]] = distincts * 2 + total ** 0.5
    mots = re.findall(r"[a-z']+", t)
    if len(mots) > 40:
        ratio = sum(w in ANGLAIS for w in mots) / len(mots)
        cle = "l1-anglais" if niveau == "L1" else "l2-anglais"
        if ratio > 0.07 and cle in MATS:
            res[cle] = max(res.get(cle, 0), 40 * ratio + 10)
        elif cle in res:
            res[cle] *= 0.3  # quelques mots anglais isolés ne suffisent pas
    return res


def match_dossier(chemin, niveau):
    """Matière désignée par le chemin des dossiers (le motif le plus long gagne)."""
    d = sans_accents("/".join(chemin.split("/")[:-1])) + "/"
    best, lg = None, 0
    for m in REF[niveau]["matieres"]:
        for r in m["_dossiers"]:
            mt = r.search(d)
            if mt and len(r.pattern) > lg:
                best, lg = m["id"], len(r.pattern)
    return best


def match_nom(nom, niveau):
    n = sans_accents(nom)
    for m in REF[niveau]["matieres"]:
        if any(r.search(n) for r in m["_nom"]):
            return m["id"]
    return None


def classer(chemin, niveau, texte=None):
    """Renvoie (id_matiere, source, détail)."""
    if chemin in MANUEL:
        return MANUEL[chemin], "manuel", ""
    if not REF[niveau]["matieres"]:
        return autres_id(niveau), "defaut", ""
    nom = chemin.split("/")[-1]
    md = match_dossier(chemin, niveau)
    mn = match_nom(nom, niveau)
    sc = scores_contenu(texte, niveau) if texte and len(texte.strip()) > 60 else {}
    best = max(sc, key=sc.get) if sc else None
    bs = sc.get(best, 0)
    prior = mn or md
    if md and mn and md != mn:
        # Nom et dossier divergent : le contenu tranche, sinon le nom (fichier mal rangé)
        if sc and sc.get(md, 0) > sc.get(mn, 0) * 1.3:
            prior = md
        else:
            prior = mn
    if prior:
        ps = sc.get(prior, 0)
        if best and best != prior and bs >= 7 and bs >= 2 * max(ps, 1.5):
            return best, "contenu", f"{MATS[prior]['nom']} → {MATS[best]['nom']} ({bs:.0f} vs {ps:.0f})"
        return prior, ("dossier" if prior == md else "nom"), ""
    if best and bs >= 5:
        return best, "contenu", f"non rangé → {MATS[best]['nom']} ({bs:.0f})"
    return autres_id(niveau), "defaut", ""


LIGNES_IGNOREES = re.compile(
    r"esgis|ecole superieure|annee (academique|universitaire)|duree|filiere|licence|semestre|enseignant|"
    r"professeur|^\s*(ue|ecu)\b|date|groupe|l[123] ?irt|documents? (non )?autorise|calculatrice|"
    r"bareme|^\W*$|nom et prenom|matricule|session|\bpage\b|controle|examen|epreuve|devoir|rattrapage", re.I)


def extrait_de(texte):
    """Première phrase vraiment informative du sujet (≤ 160 caractères)."""
    if not texte:
        return None
    for ligne in texte.splitlines():
        l = re.sub(r"\s+", " ", ligne).strip(" -•*:|\t")
        if len(l) < 25 or len(re.findall(r"[A-Za-zÀ-ÿ]", l)) < 18:
            continue
        if LIGNES_IGNOREES.search(sans_accents(l)) and not re.search(r"exercice|question|partie", sans_accents(l)):
            continue
        if re.match(r"^(exercice|partie|question)\s*\w{0,3}\s*[:.\-]?\s*$", sans_accents(l)):
            continue
        return (l[:157] + "…") if len(l) > 160 else l
    return None


# --------------------------------------------------------------------------
def construire(fichiers, textes=None):
    """textes : dict chemin -> texte extrait (optionnel)."""
    textes = textes or {}
    niveaux_src = dict(SOURCES)
    ecartes = defaultdict(list)
    vus_taille = {}
    groupes = {}
    albums = {}
    journal = []
    ordre = {d: i for i, (d, _) in enumerate(SOURCES)}
    fichiers = sorted(fichiers, key=lambda f: (ordre.get(f["p"].split("/")[0], 99), f["p"]))

    for f in fichiers:
        p = f["p"]
        racine = p.split("/")[0]
        if racine not in niveaux_src:
            continue
        nom = p.split("/")[-1]
        if nom.startswith(("~$", "._", ".")):
            continue
        if any(x in "/" + p for x in DOSSIERS_IGNORES):
            continue
        ext = nom.rsplit(".", 1)[-1].lower() if "." in nom else ""
        if ext not in EXTENSIONS:
            continue
        base = nom[: -(len(ext) + 1)]
        base = re.sub(r"\.(pdf|docx)$", "", base, flags=re.I)
        nn = sans_accents(nom)
        if any(rx(r).search(nn) for r in EXCLUSIONS):
            ecartes["Données personnelles / hors sujet"].append(p)
            continue
        if f["s"] > TAILLE_MAX:
            ecartes["Trop volumineux pour GitHub (> 95 Mo)"].append(p)
            continue
        if f["s"] < 100:
            ecartes["Fichier vide ou corrompu"].append(p)
            continue
        k = (f["s"], ext)
        if f["s"] > 20 * 1024 and k in vus_taille:
            continue
        vus_taille[k] = p

        niveau = niveaux_src[racine]
        if re.search(r"(?<![a-z0-9])l3(?![a-z0-9])", nn) and REF["L3"]["matieres"]:
            niveau = "L3"
        dossiers = "/".join(p.split("/")[:-1])
        texte = textes.get(p)
        mat, source, detail = classer(p, niveau, texte)
        if source == "contenu":
            journal.append(f"{p}\n    {detail}")

        if ext in IMAGES:
            ka = (dossiers, niveau)
            a = albums.get(ka)
            if not a:
                d_norm = sans_accents(dossiers)
                kind = "photos" if re.search(r"epreuve|exercice|devoir|autres|anglais", d_norm) else "notes"
                a = albums[ka] = {"niveau": niveau, "votes": defaultdict(int), "type": kind,
                                  "dossier": dossiers, "fichiers": [], "annees": set(), "groupes": set(), "textes": []}
            a["votes"][mat] += 3 if source in ("manuel", "dossier") else 1
            a["fichiers"].append({"p": p, "s": f["s"], "e": ext})
            an = annee_de(nom)
            if an:
                a["annees"].add(an)
            a["groupes"].update(groupes_de(nom))
            if texte:
                a["textes"].append(texte)
            continue

        titre = joli_titre(base, dossiers)
        typ, sous = type_de(base, dossiers, ext)
        kg = (niveau, mat, cle_titre(titre))
        r = groupes.get(kg)
        if r:
            if not any(x["e"] == ext for x in r["fichiers"]):
                r["fichiers"].append({"p": p, "s": f["s"], "e": ext})
            continue
        ex = EXTRAITS.get(p) or extrait_de(texte)
        groupes[kg] = {
            "niveau": niveau, "matiere": mat, "titre": titre, "type": typ, "sous": sous,
            "annee": annee_de(base), "groupes": groupes_de(base),
            "fichiers": [{"p": p, "s": f["s"], "e": ext}],
            "extrait": ex, "src": source,
        }

    ressources = list(groupes.values())
    for a in albums.values():
        a["fichiers"].sort(key=lambda x: x["p"])
        n = len(a["fichiers"])
        annees = sorted(a["annees"])
        mat = max(a["votes"], key=a["votes"].get)
        libelle = "Photos d'épreuve" if a["type"] == "photos" else "Notes de cours en photos"
        sous_dossier = re.sub(r"^.* - ", "", a["dossier"].split("/")[-1])
        titre = (f"{libelle} — {sous_dossier}" if not re.search(r"epreuve|image|cours", sans_accents(sous_dossier)) else libelle)
        ressources.append({
            "niveau": a["niveau"], "matiere": mat,
            "titre": titre + f" ({n} image{'s' if n > 1 else ''})",
            "type": a["type"], "sous": None,
            "annee": annees[0] if len(annees) == 1 else (f"{annees[0][:4]}-{annees[-1][-4:]}" if annees else None),
            "groupes": sorted(a["groupes"]), "fichiers": a["fichiers"], "album": True,
            "extrait": EXTRAITS.get(a["fichiers"][0]["p"]) or extrait_de("\n".join(a["textes"])),
        })

    prio = {"pdf": 0, "docx": 1, "doc": 2, "pptx": 3, "ppt": 4}
    for r in ressources:
        if not r.get("album"):
            r["fichiers"].sort(key=lambda x: prio.get(x["e"], 9))

    ressources.sort(key=lambda r: (r["niveau"], r["matiere"], r["type"], -(int(r["annee"][:4]) if r.get("annee") else 0), r["titre"].lower()))
    for i, r in enumerate(ressources):
        r["id"] = i + 1
        for k in ("sous", "groupes", "annee", "extrait"):
            if not r.get(k):
                r.pop(k, None)
        r.pop("src", None)
    return ressources, ecartes, journal


def structure_niveaux(ressources):
    """Arbre niveau -> groupes -> matières, avec les seules infos utiles au site."""
    utilises = defaultdict(int)
    for r in ressources:
        utilises[r["matiere"]] += 1
    out = {}
    for niv in ("L1", "L2", "L3"):
        n = REF[niv]
        mats = []
        for m in n["matieres"]:
            g = next((x for x in n["groupes"] if x["id"] == m["groupe"]), {})
            mats.append({k: v for k, v in {
                "id": m["id"], "nom": m["nom"], "court": m.get("court"), "groupe": m["groupe"],
                "icone": m.get("icone") or g.get("icone", "book"), "couleur": m.get("couleur") or g.get("couleur", "slate"),
                "parcours": m.get("parcours"), "semestre": g.get("semestre"),
            }.items() if v})
        if utilises.get(autres_id(niv)):
            mats.append({"id": autres_id(niv), "nom": "Autres ressources", "groupe": "autres", "icone": "folder", "couleur": "slate"})
        groupes = [{k: v for k, v in g.items()} for g in n["groupes"]]
        if utilises.get(autres_id(niv)):
            groupes.append({"id": "autres", "nom": "Non classées", "icone": "folder", "couleur": "slate"})
        out[niv] = {"nom": n["nom"], "filiere": n.get("filiere"), "parcours": n.get("parcours"),
                    "groupes": groupes, "matieres": mats}
    return out


def ecrire(ressources, ecartes, journal):
    data = {
        "genere_le": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "niveaux": structure_niveaux(ressources),
        "ressources": ressources,
    }
    os.makedirs(os.path.join(RACINE, "assets"), exist_ok=True)
    with open(os.path.join(RACINE, "assets", "catalogue.js"), "w", encoding="utf-8") as fh:
        fh.write("/* Fichier généré par outils/generer_catalogue.py — ne pas modifier à la main. */\n")
        fh.write("window.CATALOGUE = ")
        json.dump(data, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write(";\n")
    with open(os.path.join(RACINE, "outils", "fichiers_ecartes.txt"), "w", encoding="utf-8") as fh:
        for raison, liste in ecartes.items():
            fh.write(f"## {raison} ({len(liste)})\n")
            for p in liste:
                fh.write(f"  {p}\n")
            fh.write("\n")
    if journal:
        with open(os.path.join(RACINE, "outils", "rapport_reclassement.txt"), "w", encoding="utf-8") as fh:
            fh.write("Documents dont la matière a été déduite du CONTENU (et non du dossier ou du nom).\n")
            fh.write("Pour forcer une autre matière : ajoutez le chemin dans outils/classement_manuel.json.\n\n")
            fh.write("\n".join(journal) + "\n")


def charger_textes(dossier):
    idx = json.load(open(os.path.join(dossier, "index.json"), encoding="utf-8"))
    out = {}
    for rel, v in idx.items():
        f = os.path.join(dossier, v["k"] + ".txt")
        if os.path.exists(f):
            out[rel] = open(f, encoding="utf-8", errors="ignore").read()
    return out


if __name__ == "__main__":
    args = sys.argv[1:]
    fichiers = None
    textes = None
    if "--inventaire" in args:
        fichiers = json.load(open(args[args.index("--inventaire") + 1], encoding="utf-8"))
    if "--textes" in args:
        textes = charger_textes(args[args.index("--textes") + 1])
    if fichiers is None:
        fichiers = collecter_depuis_disque()
    res, ec, journal = construire(fichiers, textes)
    ecrire(res, ec, journal)
    par = defaultdict(int)
    for r in res:
        par[r["niveau"]] += 1
    print(f"{len(res)} ressources écrites dans assets/catalogue.js :", dict(par))
    print(f"  reclassées d'après le contenu : {len(journal)}")
    for k, v in ec.items():
        print(f"  écartés — {k} : {len(v)}")
