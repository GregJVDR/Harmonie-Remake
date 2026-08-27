#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Génère la LISTE DE SECOURS des albums (js/albums.js).

À N'UTILISER QUE SI LE SERVEUR N'A PAS DE PHP.

En temps normal, la galerie est construite directement par le serveur
(fichier galerie.php) à partir du contenu de images/souvenirs/ : il n'y
a rien à lancer, il suffit d'envoyer ses dossiers de photos par FTP.

js/albums.js ne sert que de filet de sécurité : la page Souvenirs s'en
sert si galerie.php ne répond pas, et quand on ouvre le site depuis son
ordinateur sans serveur. Ce script le remet à jour, et convertit au
passage les photos en webp.

    python3 outils/generer-liste-secours.py

Par défaut il ne fait que lire les dossiers : vos photos ne sont pas
touchées. Ajoutez  --convertir  pour qu'il transforme aussi les photos
en webp allégé (l'original est alors REMPLACÉ) ; ce n'est utile que si
le serveur ne sait pas le faire lui-même :

    python3 outils/generer-liste-secours.py --convertir

(la conversion nécessite Pillow :  pip3 install pillow  )

Un dossier = un album. Le nom du dossier donne la date et le titre :
    2026-03-28 Concert de Printemps   ->  28 mars 2026 / Concert de Printemps
    2025-12 Concert de Noël           ->  Décembre 2025 / Concert de Noël
    2024 Galerie de l'année           ->  Année 2024 / Galerie de l'année
"""

import json
import os
import re
import sys

RACINE  = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHOTOS  = os.path.join(RACINE, 'images', 'souvenirs')
SORTIE  = os.path.join(RACINE, 'js', 'albums.js')

LARGEUR_MAX = 1600   # pixels : au-delà, la photo est réduite
QUALITE     = 80     # compression webp

A_CONVERTIR = {'.jpg', '.jpeg', '.png', '.heic', '.heif', '.tif', '.tiff', '.bmp', '.gif'}
EXTENSIONS  = A_CONVERTIR | {'.webp'}

MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
        'août', 'septembre', 'octobre', 'novembre', 'décembre']


# ── 1. Conversion des photos en webp ────────────────────────────────

def ouvrir_pillow():
    """Charge Pillow si disponible ; sinon on se contente de lister."""
    try:
        from PIL import Image, ImageOps
    except ImportError:
        print("Pillow absent : les photos sont listées sans être converties.")
        return None, None
    try:                                   # photos iPhone (.heic)
        import pillow_heif
        pillow_heif.register_heif_opener()
    except ImportError:
        pass
    return Image, ImageOps


def convertir(chemin, Image, ImageOps):
    """Convertit une photo en .webp allégé et supprime l'original."""
    base, _ = os.path.splitext(chemin)
    cible = base + '.webp'
    if os.path.exists(cible):              # un .webp du même nom existe déjà
        os.remove(chemin)
        print('  doublon supprimé :', os.path.basename(chemin))
        return cible
    with Image.open(chemin) as img:
        img = ImageOps.exif_transpose(img)         # respecte l'orientation
        img = img.convert('RGBA' if img.mode in ('RGBA', 'LA', 'P') else 'RGB')
        if img.width > LARGEUR_MAX:
            hauteur = round(img.height * LARGEUR_MAX / img.width)
            img = img.resize((LARGEUR_MAX, hauteur), Image.LANCZOS)
        img.save(cible, 'WEBP', quality=QUALITE, method=6)   # sans métadonnées
    os.remove(chemin)
    poids = os.path.getsize(cible) // 1024
    print('  converti :', os.path.basename(chemin), '->',
          os.path.basename(cible), '(%d Ko)' % poids)
    return cible


# ── 2. Lecture des dossiers ─────────────────────────────────────────

def tri_naturel(nom):
    """photo2 avant photo10 ; la couverture d'abord."""
    stem = os.path.splitext(nom)[0].lower()
    prioritaire = 0 if stem.startswith(('couverture', 'cover')) else 1
    morceaux = [int(m) if m.isdigit() else m
                for m in re.findall(r'\d+|\D+', stem)]
    return (prioritaire, [(0, m, '') if isinstance(m, int) else (1, 0, m)
                          for m in morceaux])


def lire_nom_dossier(nom):
    """« 2026-03-28 Concert de Printemps » -> date, année, titre."""
    m = re.match(r'^(\d{4})(?:[-_.](\d{1,2}))?(?:[-_.](\d{1,2}))?[\s\-_.]*(.*)$',
                 nom.strip())
    if m:
        annee, mois, jour, titre = m.group(1), m.group(2), m.group(3), m.group(4)
    else:
        annee, mois, jour = None, None, None
        titre = nom
        trouve = re.search(r'(19|20)\d{2}', nom)   # année cachée dans le nom
        if trouve:
            annee = trouve.group(0)

    titre = titre.replace('_', ' ').strip() or nom
    if not annee:
        from datetime import date
        annee = str(date.today().year)

    if mois and jour:
        date_lisible = '%d %s %s' % (int(jour), MOIS[int(mois) - 1], annee)
    elif mois:
        date_lisible = '%s %s' % (MOIS[int(mois) - 1].capitalize(), annee)
    else:
        date_lisible = 'Année ' + annee

    cle = (int(annee), int(mois or 0), int(jour or 0))
    return date_lisible, annee, titre, cle


def lire_albums(Image, ImageOps, convertir_photos):
    albums = []
    for dossier in sorted(os.listdir(PHOTOS)):
        chemin = os.path.join(PHOTOS, dossier)
        if not os.path.isdir(chemin) or dossier.startswith('.'):
            continue

        print('Album :', dossier)
        for fichier in sorted(os.listdir(chemin)):
            ext = os.path.splitext(fichier)[1].lower()
            if fichier.startswith('.') or ext not in A_CONVERTIR:
                continue
            if not convertir_photos or Image is None:
                continue
            try:
                convertir(os.path.join(chemin, fichier), Image, ImageOps)
            except Exception as erreur:                      # photo illisible
                print('  ATTENTION, photo ignorée :', fichier, '-', erreur)

        photos = sorted(
            (f for f in os.listdir(chemin)
             if not f.startswith('.') and os.path.splitext(f)[1].lower() in EXTENSIONS),
            key=tri_naturel)

        date_lisible, annee, titre, cle = lire_nom_dossier(dossier)
        albums.append({
            'titre'  : titre,
            'date'   : date_lisible,
            'annee'  : annee,
            'dossier': dossier,
            'photos' : photos,
            '_cle'   : cle,
        })
        print('  %d photo(s)' % len(photos))

    albums.sort(key=lambda a: a['_cle'], reverse=True)   # du plus récent au plus ancien
    for a in albums:
        del a['_cle']
    return albums


# ── 3. Écriture de js/albums.js ─────────────────────────────────────

ENTETE = """/* ================================================================
   LISTE DE SECOURS DES ALBUMS - FICHIER GÉNÉRÉ, NE PAS MODIFIER
   ================================================================

   En temps normal la galerie est construite par le serveur, qui lit
   directement le dossier images/souvenirs/ (fichier galerie.php).
   Cette liste ne sert que si le serveur ne répond pas, ou quand on
   ouvre le site depuis son ordinateur sans serveur.

   Elle est réécrite par  outils/generer-liste-secours.py
   Mode d'emploi de la galerie : images/souvenirs/INSTRUCTIONS.txt
   ================================================================ */

var ALBUMS = [
"""

BLOC = """
  {
    titre   : %s,
    date    : %s,
    annee   : %s,
    dossier : %s,
    photos  : [%s]
  }"""


def texte(valeur):
    return json.dumps(valeur, ensure_ascii=False)


def ecrire(albums):
    blocs = []
    for a in albums:
        liste = ', '.join(texte(p) for p in a['photos'])
        blocs.append(BLOC % (texte(a['titre']), texte(a['date']),
                             texte(a['annee']), texte(a['dossier']), liste))
    contenu = ENTETE + ','.join(blocs) + '\n\n];\n'

    ancien = ''
    if os.path.exists(SORTIE):
        with open(SORTIE, encoding='utf-8') as f:
            ancien = f.read()
    if ancien == contenu:
        print('js/albums.js déjà à jour.')
        return
    with open(SORTIE, 'w', encoding='utf-8') as f:
        f.write(contenu)
    print('js/albums.js réécrit.')


def main():
    if not os.path.isdir(PHOTOS):
        sys.exit('Dossier introuvable : ' + PHOTOS)
    convertir_photos = '--convertir' in sys.argv
    Image, ImageOps = ouvrir_pillow() if convertir_photos else (None, None)
    if not convertir_photos:
        print("Lecture seule : les photos ne sont pas modifiées "
              "(ajoutez --convertir pour les alléger).\n")
    albums = lire_albums(Image, ImageOps, convertir_photos)
    ecrire(albums)
    print('\n%d album(s), %d photo(s) au total.'
          % (len(albums), sum(len(a['photos']) for a in albums)))


if __name__ == '__main__':
    main()
