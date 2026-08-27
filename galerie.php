<?php
/**
 * GALERIE PHOTOS DU SITE
 * ======================
 *
 * Ce fichier lit tout seul le contenu du dossier  images/souvenirs/
 * et le donne à la page Souvenirs. Un dossier = un album.
 *
 * L'administrateur du site n'a rien à modifier ici : il lui suffit
 * d'envoyer ses dossiers de photos par FileZilla. Mode d'emploi dans
 * images/souvenirs/INSTRUCTIONS.txt
 *
 * Il rend aussi les photos plus légères (format webp) avant de les
 * envoyer aux visiteurs, sans toucher aux fichiers d'origine.
 *
 * Pour vérifier que tout fonctionne sur le serveur, ouvrez dans un
 * navigateur :  https://votre-site.fr/galerie.php?test=1
 */

declare(strict_types=1);

// Un avertissement PHP affiché au milieu d'une image la rendrait illisible :
// les messages vont dans le journal du serveur, jamais dans la page.
@ini_set('display_errors', '0');

$DOSSIER  = __DIR__ . '/images/souvenirs';
$CACHE    = $DOSSIER . '/.cache';
$QUALITE  = 82;                       // compression webp
$LARGEURS = [400, 800, 1600];         // tailles préparées pour le site

$MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
         'août', 'septembre', 'octobre', 'novembre', 'décembre'];


/* ── Ce que sait faire le serveur ────────────────────────────────── */

function imagickDispo(): bool {
    return class_exists('Imagick');
}

function heicDispo(): bool {
    if (!imagickDispo()) return false;
    try { return (bool) Imagick::queryFormats('HEIC'); }
    catch (Throwable $e) { return false; }
}

function conversionDispo(): bool {
    return (extension_loaded('gd') && function_exists('imagewebp')) || imagickDispo();
}

function extensionsLues(): array {
    $ext = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (heicDispo()) { $ext[] = 'heic'; $ext[] = 'heif'; }
    return $ext;
}

function cachePret(string $cache): bool {
    if (!is_dir($cache)) @mkdir($cache, 0755, true);
    return is_dir($cache) && is_writable($cache);
}


/* ── Lecture des dossiers d'albums ───────────────────────────────── */

function comparerPhotos(string $a, string $b): int {
    $prio = function (string $n): int {
        $stem = strtolower(pathinfo($n, PATHINFO_FILENAME));
        return (strpos($stem, 'couverture') === 0 || strpos($stem, 'cover') === 0) ? 0 : 1;
    };
    $d = $prio($a) <=> $prio($b);
    return $d !== 0 ? $d : strnatcasecmp($a, $b);
}

/** « 2026-03-28 Concert de Printemps » -> date lisible, année, titre, clé de tri */
function lireNomDossier(string $nom, array $MOIS): array {
    $annee = $mois = $jour = null;
    $titre = $nom;

    if (preg_match('/^(\d{4})(?:[-_.](\d{1,2}))?(?:[-_.](\d{1,2}))?[\s\-_.]*(.*)$/u', trim($nom), $m)) {
        $annee = $m[1];
        $mois  = ($m[2] ?? '') !== '' ? (int) $m[2] : null;
        $jour  = ($m[3] ?? '') !== '' ? (int) $m[3] : null;
        $titre = trim($m[4] ?? '');
    } elseif (preg_match('/(19|20)\d{2}/', $nom, $m)) {
        $annee = $m[0];
    }

    $titre = trim(str_replace('_', ' ', $titre));
    if ($titre === '') $titre = $nom;
    if ($annee === null) $annee = date('Y');
    if ($mois !== null && ($mois < 1 || $mois > 12)) $mois = null;

    if ($mois !== null && $jour !== null) {
        $date = $jour . ' ' . $MOIS[$mois - 1] . ' ' . $annee;
    } elseif ($mois !== null) {
        $date = mb_convert_case($MOIS[$mois - 1], MB_CASE_TITLE, 'UTF-8') . ' ' . $annee;
    } else {
        $date = 'Année ' . $annee;
    }

    $cle = sprintf('%04d%02d%02d', (int) $annee, $mois ?? 0, $jour ?? 0);
    return [$date, $annee, $titre, $cle];
}

function lireAlbums(string $dossier, array $MOIS): array {
    $albums = [];
    $extensions = extensionsLues();

    foreach (scandir($dossier) ?: [] as $nom) {
        if ($nom === '' || $nom[0] === '.' || !is_dir($dossier . '/' . $nom)) continue;

        $photos = [];
        foreach (scandir($dossier . '/' . $nom) ?: [] as $fichier) {
            if ($fichier === '' || $fichier[0] === '.') continue;
            $ext = strtolower(pathinfo($fichier, PATHINFO_EXTENSION));
            if (in_array($ext, $extensions, true)) $photos[] = $fichier;
        }
        usort($photos, 'comparerPhotos');

        [$date, $annee, $titre, $cle] = lireNomDossier($nom, $MOIS);
        $albums[] = [
            'titre'   => $titre,
            'date'    => $date,
            'annee'   => $annee,
            'dossier' => $nom,
            'photos'  => array_values($photos),
            'cle'     => $cle,
        ];
    }

    usort($albums, function ($a, $b) {          // du plus récent au plus ancien
        return $b['cle'] <=> $a['cle'] ?: strcoll($a['titre'], $b['titre']);
    });
    foreach ($albums as &$a) unset($a['cle']);
    return $albums;
}


/* ── Envoi d'une photo, allégée à la taille demandée ──────────────── */

function refuser(int $code = 404): void {
    http_response_code($code);
    header('Content-Type: text/plain; charset=utf-8');
    exit('Photo introuvable.');
}

function cheminPhoto(string $demande, string $dossier): string {
    $demande = str_replace('\\', '/', $demande);
    $morceaux = explode('/', $demande);
    if (count($morceaux) !== 2) refuser();
    foreach ($morceaux as $m) {
        if ($m === '' || $m === '.' || $m === '..' || strpos($m, "\0") !== false) refuser();
    }
    $ext = strtolower(pathinfo($morceaux[1], PATHINFO_EXTENSION));
    if (!in_array($ext, extensionsLues(), true)) refuser();

    $reel = realpath($dossier . '/' . $morceaux[0] . '/' . $morceaux[1]);
    $base = realpath($dossier);
    if ($reel === false || $base === false || strpos($reel, $base . DIRECTORY_SEPARATOR) !== 0) refuser();
    return $reel;
}

function fabriquerWebp(string $source, string $cible, int $largeur, int $qualite): bool {
    $temporaire = $cible . '.tmp' . getmypid();

    if (imagickDispo()) {
        try {
            $img = new Imagick($source);
            $img->setImageColorspace(Imagick::COLORSPACE_SRGB);
            if (method_exists($img, 'autoOrient')) $img->autoOrient();
            if ($img->getImageWidth() > $largeur) {
                $img->resizeImage($largeur, 0, Imagick::FILTER_LANCZOS, 1);
            }
            $img->stripImage();                       // enlève GPS, marque de l'appareil...
            $img->setImageFormat('webp');
            $img->setImageCompressionQuality($qualite);
            $ok = $img->writeImage($temporaire);
            $img->clear();
            unset($img);
            if ($ok && rename($temporaire, $cible)) return true;
            @unlink($temporaire);
        } catch (Throwable $e) {
            @unlink($temporaire);
        }
    }

    if (!extension_loaded('gd') || !function_exists('imagewebp')) return false;

    $infos = @getimagesize($source);
    if ($infos === false) return false;
    switch ($infos[2]) {
        case IMAGETYPE_JPEG: $img = @imagecreatefromjpeg($source); break;
        case IMAGETYPE_PNG:  $img = @imagecreatefrompng($source);  break;
        case IMAGETYPE_GIF:  $img = @imagecreatefromgif($source);  break;
        case IMAGETYPE_WEBP: $img = @imagecreatefromwebp($source); break;
        default: return false;
    }
    if (!$img) return false;

    if ($infos[2] === IMAGETYPE_JPEG && function_exists('exif_read_data')) {
        $exif = @exif_read_data($source);            // redresse les photos de téléphone
        $rotation = ['3' => 180, '6' => -90, '8' => 90][$exif['Orientation'] ?? ''] ?? 0;
        if ($rotation) { $pivote = @imagerotate($img, $rotation, 0); if ($pivote) $img = $pivote; }
    }

    if (imagesx($img) > $largeur) {
        $nouvelle = @imagescale($img, $largeur);
        if ($nouvelle) $img = $nouvelle;
    }
    imagepalettetotruecolor($img);
    imagealphablending($img, false);
    imagesavealpha($img, true);

    $ok = @imagewebp($img, $temporaire, $qualite);
    unset($img);
    if ($ok && rename($temporaire, $cible)) return true;
    @unlink($temporaire);
    return false;
}

function envoyer(string $fichier, string $type): void {
    while (ob_get_level() > 0) ob_end_clean();     // rien avant les octets du fichier
    $etag = '"' . md5($fichier . '|' . filemtime($fichier) . '|' . filesize($fichier)) . '"';
    header('Content-Type: ' . $type);
    header('Cache-Control: public, max-age=86400');
    header('ETag: ' . $etag);
    header('X-Content-Type-Options: nosniff');
    if (trim($_SERVER['HTTP_IF_NONE_MATCH'] ?? '') === $etag) { http_response_code(304); exit; }
    header('Content-Length: ' . filesize($fichier));
    readfile($fichier);
    exit;
}

function servirPhoto(string $demande, int $largeur, string $dossier, string $cache,
                     array $largeurs, int $qualite): void {
    $source = cheminPhoto($demande, $dossier);
    if (!in_array($largeur, $largeurs, true)) $largeur = max($largeurs);

    $types = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png',
              'gif' => 'image/gif', 'webp' => 'image/webp',
              'heic' => 'image/heic', 'heif' => 'image/heif'];
    $ext = strtolower(pathinfo($source, PATHINFO_EXTENSION));

    if (conversionDispo() && cachePret($cache)) {
        $cible = $cache . '/' . sha1($source . '|' . filemtime($source) . '|' . $largeur) . '.webp';
        if (is_file($cible) || fabriquerWebp($source, $cible, $largeur, $qualite)) {
            if (filesize($cible) < filesize($source) || $ext !== 'webp') envoyer($cible, 'image/webp');
        }
    }

    if ($ext === 'heic' || $ext === 'heif') refuser();   // illisible par les navigateurs
    envoyer($source, $types[$ext] ?? 'application/octet-stream');
}


/* ── Page de vérification (galerie.php?test=1) ───────────────────── */

function pageTest(string $dossier, string $cache, array $MOIS): void {
    header('Content-Type: text/html; charset=utf-8');
    $albums = is_dir($dossier) ? lireAlbums($dossier, $MOIS) : [];
    $total  = array_sum(array_map(fn($a) => count($a['photos']), $albums));
    $lignes = [
        'PHP'                       => [true, PHP_VERSION],
        'Dossier images/souvenirs/' => [is_dir($dossier), is_dir($dossier) ? 'trouvé' : 'INTROUVABLE'],
        'Allègement des photos'     => [conversionDispo(), conversionDispo()
                                        ? (imagickDispo() ? 'Imagick' : 'GD') . ' : photos converties en webp'
                                        : 'indisponible : les photos seront envoyées telles quelles'],
        'Photos iPhone (.heic)'     => [heicDispo() ? true : null, heicDispo() ? 'lues directement'
                                        : 'non lues (c\'est le cas courant) : sur l\'iPhone, Réglages > '
                                        . 'Appareil photo > Formats > « Le plus compatible » pour obtenir des jpg'],
        'Dossier de cache'          => [cachePret($cache), cachePret($cache) ? 'accessible en écriture'
                                        : 'non inscriptible : mettez les droits 755 sur images/souvenirs/'],
        'Albums trouvés'            => [count($albums) > 0, count($albums) . ' album(s), ' . $total . ' photo(s)'],
    ];

    echo '<!doctype html><meta charset="utf-8"><title>Vérification de la galerie</title>';
    echo '<style>body{font:16px/1.6 system-ui,sans-serif;max-width:44rem;margin:3rem auto;padding:0 1.5rem;color:#14243d}'
       . 'h1{font-size:1.5rem}li{margin:.4rem 0}code{background:#eef2f7;padding:.1rem .35rem;border-radius:4px}'
       . '.ok::before{content:"OK  ";color:#137a3f;font-weight:700}'
       . '.ko::before{content:"À VOIR  ";color:#b3261e;font-weight:700}'
       . '.info::before{content:"INFO  ";color:#5b6b82;font-weight:700}</style>';
    echo '<h1>Vérification de la galerie</h1><ul>';
    foreach ($lignes as $nom => [$ok, $detail]) {
        printf('<li class="%s"><strong>%s</strong> — %s</li>',
               $ok === null ? 'info' : ($ok ? 'ok' : 'ko'),
               htmlspecialchars($nom), htmlspecialchars($detail));
    }
    echo '</ul>';
    if ($albums) {
        echo '<h2 style="font-size:1.1rem">Albums lus</h2><ul>';
        foreach ($albums as $a) {
            printf('<li><strong>%s</strong> — %s — %d photo(s) <br><code>%s</code></li>',
                   htmlspecialchars($a['titre']), htmlspecialchars($a['date']),
                   count($a['photos']), htmlspecialchars($a['dossier']));
        }
        echo '</ul>';
    }
    echo '<p>Si toutes les lignes sont « OK », la page Souvenirs affiche la galerie.</p>';
    exit;
}


/* ── Aiguillage ──────────────────────────────────────────────────── */

if (isset($_GET['test'])) {
    pageTest($DOSSIER, $CACHE, $MOIS);
}

if (isset($_GET['photo'])) {
    servirPhoto((string) $_GET['photo'], (int) ($_GET['l'] ?? 0), $DOSSIER, $CACHE, $LARGEURS, $QUALITE);
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache');
if (!is_dir($DOSSIER)) {
    http_response_code(500);
    echo json_encode(['erreur' => 'Dossier images/souvenirs introuvable'], JSON_UNESCAPED_UNICODE);
    exit;
}
echo json_encode([
    'vignettes' => conversionDispo() && cachePret($CACHE),
    'albums'    => lireAlbums($DOSSIER, $MOIS),
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
