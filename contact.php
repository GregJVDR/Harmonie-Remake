<?php
/**
 * ENVOI DES FORMULAIRES DU SITE
 * =============================
 *
 * Ce fichier reçoit les formulaires du site (contact du comité et
 * demande de renseignements de l'école de musique) et envoie leur
 * contenu par e-mail à l'association.
 *
 * POUR CHANGER L'ADRESSE QUI REÇOIT LES MESSAGES :
 * modifiez la ligne  $DESTINATAIRE  juste en dessous. C'est tout.
 *
 * Pour vérifier que l'envoi fonctionne sur le serveur, ouvrez :
 *     https://votre-site.fr/contact.php?test=1
 */

declare(strict_types=1);

@ini_set('display_errors', '0');   // jamais de message d'erreur dans la réponse

// Adresse qui reçoit les messages des visiteurs
$DESTINATAIRE = 'contact@harmonie-pont-de-roide.com';

// Adresse qui apparaît comme expéditeur. IMPORTANT : les hébergeurs
// (dont OVH) n'acceptent d'envoyer que depuis une adresse du domaine
// du site. L'adresse du visiteur est mise en « Répondre à », donc
// répondre au message écrit bien au visiteur.
$EXPEDITEUR = 'contact@harmonie-pont-de-roide.com';

$NOM_EXPEDITEUR = 'Site Harmonie Fanfare Rudipontaine';


/* ── Outils ──────────────────────────────────────────────────────── */

function propre(string $valeur, int $long = 200): string {
    $valeur = str_replace(["\r", "\n", "\0", "%0a", "%0d"], ' ', $valeur);  // anti-injection d'en-tête
    return trim(mb_substr($valeur, 0, $long));
}

function texte(string $valeur, int $long = 5000): string {
    $valeur = str_replace(["\r\n", "\r"], "\n", $valeur);
    return trim(mb_substr($valeur, 0, $long));
}

function entete(string $valeur): string {
    return mb_encode_mimeheader($valeur, 'UTF-8', 'B', "\r\n");
}

function repondre(bool $ok, string $message, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function envoyer(string $destinataire, string $sujet, string $corps,
                 string $expediteur, string $nomExpediteur, string $repondreA): bool {
    $entetes = [
        'From: ' . entete($nomExpediteur) . ' <' . $expediteur . '>',
        'Reply-To: ' . $repondreA,
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        'MIME-Version: 1.0',
        'X-Mailer: site-harmonie',
    ];
    return @mail($destinataire, entete($sujet), $corps,
                 implode("\r\n", $entetes), '-f' . $expediteur);
}


/* ── Page de vérification (contact.php?test=1) ───────────────────── */

if (isset($_GET['test'])) {
    header('Content-Type: text/html; charset=utf-8');
    $dispo = function_exists('mail');
    $essai = isset($_GET['envoi']);
    $resultat = null;
    if ($essai && $dispo) {
        $resultat = envoyer($DESTINATAIRE, 'Test d\'envoi depuis le site',
            "Ceci est un message de test envoyé depuis contact.php?test=1.\n"
            . "Si vous le recevez, les formulaires du site fonctionnent.\n",
            $EXPEDITEUR, $NOM_EXPEDITEUR, $DESTINATAIRE);
    }

    echo '<!doctype html><meta charset="utf-8"><title>Vérification des formulaires</title>';
    echo '<style>body{font:16px/1.6 system-ui,sans-serif;max-width:44rem;margin:3rem auto;padding:0 1.5rem;color:#14243d}'
       . 'h1{font-size:1.5rem}li{margin:.4rem 0}code{background:#eef2f7;padding:.1rem .35rem;border-radius:4px}'
       . 'a.bouton{display:inline-block;margin-top:1rem;background:#1A52A8;color:#fff;padding:.6rem 1.1rem;'
       . 'border-radius:6px;text-decoration:none}'
       . '.ok::before{content:"OK  ";color:#137a3f;font-weight:700}'
       . '.ko::before{content:"À VOIR  ";color:#b3261e;font-weight:700}</style>';
    echo '<h1>Vérification des formulaires</h1><ul>';
    printf('<li class="%s"><strong>PHP</strong> — %s</li>', 'ok', PHP_VERSION);
    printf('<li class="%s"><strong>Fonction d\'envoi</strong> — %s</li>',
           $dispo ? 'ok' : 'ko',
           $dispo ? 'disponible' : 'désactivée par l\'hébergeur : les formulaires basculeront sur le logiciel de messagerie du visiteur');
    printf('<li class="ok"><strong>Les messages arrivent à</strong> — %s</li>', htmlspecialchars($DESTINATAIRE));
    printf('<li class="ok"><strong>Envoyés depuis</strong> — %s</li>', htmlspecialchars($EXPEDITEUR));
    echo '</ul>';

    if ($resultat === true) {
        echo '<p class="ok" style="font-weight:600">Message de test accepté par le serveur. '
           . 'Regardez la boîte ' . htmlspecialchars($DESTINATAIRE)
           . ' dans les minutes qui viennent (pensez aux indésirables).</p>';
    } elseif ($resultat === false) {
        echo '<p class="ko" style="font-weight:600">Le serveur a refusé le message de test. '
           . 'Vérifiez auprès de l\'hébergeur que l\'adresse expéditrice appartient bien au domaine du site.</p>';
    } elseif ($dispo) {
        echo '<a class="bouton" href="?test=1&envoi=1">Envoyer un message de test</a>';
    }
    exit;
}


/* ── Réception d'un formulaire ───────────────────────────────────── */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    repondre(false, 'Adresse à utiliser depuis un formulaire du site.', 405);
}

// Piège à robots : ce champ est invisible pour un visiteur, seuls les
// programmes automatiques le remplissent.
if (propre($_POST['site'] ?? '') !== '') {
    repondre(true, 'Message envoyé.');           // on ne dit rien au robot
}

$nom     = propre($_POST['nom'] ?? '', 120);
$email   = propre($_POST['email'] ?? '', 160);
$message = texte($_POST['message'] ?? '');

if ($nom === '' || $email === '') {
    repondre(false, 'Merci d\'indiquer votre nom et votre adresse e-mail.', 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    repondre(false, 'Cette adresse e-mail ne semble pas valide.', 400);
}

$formulaire = propre($_POST['formulaire'] ?? 'contact', 30);

if ($formulaire === 'ecole') {
    $instrument = propre($_POST['instrument'] ?? '', 80);
    $telephone  = propre($_POST['telephone'] ?? '', 40);
    $sujet = 'Demande de renseignements école de musique - ' . $nom;
    $corps = "Nom : $nom\n"
           . "Email : $email\n"
           . 'Téléphone : ' . ($telephone !== '' ? $telephone : 'non renseigné') . "\n"
           . 'Instrument souhaité : ' . ($instrument !== '' ? $instrument : 'non renseigné') . "\n\n"
           . "Message :\n" . ($message !== '' ? $message : '(aucun)') . "\n";
} else {
    $objet = propre($_POST['sujet'] ?? '', 120);
    $sujet = ($objet !== '' ? $objet : 'Message du site') . ' - ' . $nom;
    $corps = "Nom : $nom\n"
           . "Email : $email\n\n"
           . "Message :\n" . ($message !== '' ? $message : '(aucun)') . "\n";
}

$corps .= "\n-- \nMessage envoyé depuis le formulaire du site harmonie-pont-de-roide.com\n";

if (!function_exists('mail')) {
    repondre(false, 'L\'envoi automatique n\'est pas disponible.', 503);
}

if (!envoyer($DESTINATAIRE, '[Site] ' . $sujet, $corps, $EXPEDITEUR, $NOM_EXPEDITEUR, $email)) {
    repondre(false, 'L\'envoi a échoué.', 500);
}

repondre(true, 'Votre message a bien été envoyé. Nous vous répondrons rapidement.');
