// =====================================================
// MON IPTV - app.js
// Étape 1 : connexion | Étape 2 : catégories et chaînes
// =====================================================

// ----- Récupération des éléments de la page -----
const ecranConnexion  = document.getElementById('ecran-connexion');
const ecranCategories = document.getElementById('ecran-categories');
const ecranChaines    = document.getElementById('ecran-chaines');
const chargement      = document.getElementById('chargement');

const champUrl   = document.getElementById('champ-url');
const champUser  = document.getElementById('champ-user');
const champPass  = document.getElementById('champ-pass');
const btnConnexion    = document.getElementById('btn-connexion');
const messageConnexion = document.getElementById('message-connexion');

const listeCategories = document.getElementById('liste-categories');
const listeChaines    = document.getElementById('liste-chaines');
const titreCategorie  = document.getElementById('titre-categorie');
const btnRetourCategories = document.getElementById('btn-retour-categories');
const btnDeconnexion  = document.getElementById('btn-deconnexion');

// ----- Mémoire de l'application -----
let identifiants = null; // { url, user, pass }


// =====================================================
// FONCTIONS DE BASE
// =====================================================

// Affiche un écran et cache les autres
function afficherEcran(ecran) {
    ecranConnexion.classList.add('cache');
    ecranCategories.classList.add('cache');
    ecranChaines.classList.add('cache');
    ecran.classList.remove('cache');
}

// Affiche ou cache le message "Chargement..."
function afficherChargement(visible) {
    chargement.classList.toggle('cache', !visible);
}

// Construit l'adresse de l'API Xtream
function construireUrlApi(action) {
    let adresse = identifiants.url;
    // Enlève le "/" à la fin si présent
    if (adresse.endsWith('/')) {
        adresse = adresse.slice(0, -1);
    }
    let url = adresse + '/player_api.php?username=' + encodeURIComponent(identifiants.user)
              + '&password=' + encodeURIComponent(identifiants.pass);
    if (action) {
        url += '&action=' + action;
    }
    return url;
}

// Appelle l'API et renvoie les données (ou null si erreur)
async function appelerApi(action) {
    try {
        const reponse = await fetch(construireUrlApi(action));
        if (!reponse.ok) {
            return null;
        }
        return await reponse.json();
    } catch (erreur) {
        return null;
    }
}


// =====================================================
// ÉTAPE 1 : CONNEXION
// =====================================================

async function seConnecter() {
    messageConnexion.textContent = '';

    // Récupère ce que l'utilisateur a tapé
    const url  = champUrl.value.trim();
    const user = champUser.value.trim();
    const pass = champPass.value.trim();

    // Vérifie que tout est rempli
    if (!url || !user || !pass) {
        messageConnexion.textContent = '⚠️ Remplis les 3 champs';
        return;
    }

    identifiants = { url: url, user: user, pass: pass };

    afficherChargement(true);

    // Teste la connexion en demandant les infos du compte
    const donnees = await appelerApi(null);

    afficherChargement(false);

    // Vérifie la réponse
    if (donnees && donnees.user_info && donnees.user_info.auth == 1) {
        // ✅ Connexion réussie : on sauvegarde pour la prochaine fois
        localStorage.setItem('iptv_identifiants', JSON.stringify(identifiants));
        chargerCategories();
    } else if (donnees && donnees.user_info && donnees.user_info.auth == 0) {
        messageConnexion.textContent = '❌ Identifiants incorrects';
    } else {
        messageConnexion.textContent = '❌ Impossible de joindre le serveur (réseau ou CORS)';
    }
}

// Reconnexion automatique au démarrage
function tenterReconnexion() {
    const sauvegarde = localStorage.getItem('iptv_identifiants');
    if (sauvegarde) {
        identifiants = JSON.parse(sauvegarde);
        chargerCategories();
    }
}

// Déconnexion : efface la sauvegarde
function seDeconnecter() {
    localStorage.removeItem('iptv_identifiants');
    identifiants = null;
    champUrl.value = '';
    champUser.value = '';
    champPass.value = '';
    afficherEcran(ecranConnexion);
}


// =====================================================
// ÉTAPE 2 : CATÉGORIES ET CHAÎNES
// =====================================================

// Charge et affiche la liste des catégories de chaînes TV
async function chargerCategories() {
    afficherChargement(true);
    const categories = await appelerApi('get_live_categories');
    afficherChargement(false);

    if (!categories) {
        messageConnexion.textContent = '❌ Erreur de chargement';
        afficherEcran(ecranConnexion);
        return;
    }

    // Vide la liste puis la remplit
    listeCategories.innerHTML = '';

    categories.forEach(function(categorie) {
        const bouton = document.createElement('button');
        bouton.className = 'element-liste';
        bouton.innerHTML = '<span class="nom">📁 ' + categorie.category_name + '</span>'
                         + '<span class="fleche">›</span>';
        bouton.addEventListener('click', function() {
            chargerChaines(categorie.category_id, categorie.category_name);
        });
        listeCategories.appendChild(bouton);
    });

    afficherEcran(ecranCategories);
}

// Charge et affiche les chaînes d'une catégorie
async function chargerChaines(idCategorie, nomCategorie) {
    afficherChargement(true);
    const chaines = await appelerApi('get_live_streams&category_id=' + idCategorie);
    afficherChargement(false);

    titreCategorie.textContent = nomCategorie;
    listeChaines.innerHTML = '';

    if (!chaines || chaines.length === 0) {
        listeChaines.innerHTML = '<p style="padding:16px;color:#aaaaaa;">Aucune chaîne dans cette catégorie</p>';
    } else {
        chaines.forEach(function(chaine) {
            const bouton = document.createElement('button');
            bouton.className = 'element-liste';

            // Logo de la chaîne (ou une icône TV par défaut)
            let logoHtml = '<span style="font-size:32px;">📺</span>';
            if (chaine.stream_icon) {
                logoHtml = '<img class="logo-chaine" src="' + chaine.stream_icon + '" alt="" loading="lazy">';
            }

            bouton.innerHTML = logoHtml
                             + '<span class="nom">' + chaine.name + '</span>'
                             + '<span class="fleche">▶</span>';

            // Pour l'instant : clic = message (le lecteur arrive à l'étape 3)
            bouton.addEventListener('click', function() {
                alert('🚧 Lecteur pas encore installé !\nChaîne : ' + chaine.name + '\n(Étape 3 à venir)');
            });

            listeChaines.appendChild(bouton);
        });
    }

    afficherEcran(ecranChaines);
}


// =====================================================
// BRANCHEMENT DES BOUTONS
// =====================================================

btnConnexion.addEventListener('click', seConnecter);
btnDeconnexion.addEventListener('click', seDeconnecter);
btnRetourCategories.addEventListener('click', function() {
    afficherEcran(ecranCategories);
});

// Touche "Entrée" sur le champ mot de passe = connexion
champPass.addEventListener('keydown', function(evenement) {
    if (evenement.key === 'Enter') {
        seConnecter();
    }
});

// Au démarrage : tente la reconnexion automatique
tenterReconnexion();
