const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const helper = require('./helper.js');

// La clé
const secretJwtKey = 'UnBonMatelasEmma';


// ============= APPLICATION =======================/
// Initialiser l'app
const app = express();

// OBLIGATOIRE !
// Middleware pour activer les données du body json en POST
app.use(express.json());
app.use(cors());

// Init swagger middleware
const swaggerUI = require('swagger-ui-express');
const swaggerDocument = require('./swagger_output.json');

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

// Fausse liste de films
const MOVIES = [
    {
      id: 1,
      title: "Inception",
      synopsis: "A thief who enters the dreams of others to steal secrets from their subconscious.",
      duration: "2h 28min",
      year: "2010",
      thumbnail_url: "https://example.com/inception-thumbnail.jpg"
    },
    {
      id: 2,
      title: "The Shawshank Redemption",
      synopsis: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
      duration: "2h 22min",
      year: "1994",
      thumbnail_url: "https://example.com/shawshank-redemption-thumbnail.jpg"
    },
    {
      id: 3,
      title: "The Dark Knight",
      synopsis: "When the menace known as The Joker emerges from his mysterious past, he wreaks havoc and chaos on the people of Gotham.",
      duration: "2h 32min",
      year: "2008",
      thumbnail_url: "https://example.com/dark-knight-thumbnail.jpg"
    },
    {
      id: 4,
      title: "Pulp Fiction",
      synopsis: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
      duration: "2h 34min",
      year: "1994",
      thumbnail_url: "https://example.com/pulp-fiction-thumbnail.jpg"
    },
    {
      id: 5,
      title: "Forrest Gump",
      synopsis: "The presidencies of Kennedy and Johnson, the Vietnam War, the Watergate scandal and other historical events unfold from the perspective of an Alabama man with an IQ of 75, whose only desire is to be reunited with his childhood sweetheart.",
      duration: "2h 22min",
      year: "1994",
      thumbnail_url: "https://example.com/forrest-gump-thumbnail.jpg"
    }
  ];

  const USERS = [
    {
      email: "john.doe@example.com",
      pseudo: "johndoe",
      password: "jd@123"
    },
    {
      email: "alice.smith@example.com",
      pseudo: "alicesmith",
      password: "as@456"
    },
    {
      email: "bob.jones@example.com",
      pseudo: "bobjones",
      password: "bj@789"
    }
  ];

// Déclarer des routes
app.get("/movies", async (request, response) => {
    /*
        #swagger.description = 'Récupérer la liste des personnes'
    */

    // Select all avec mongodb
    const movies = MOVIES;

    // Retourner la réponse
    return helper.buildResponse(response, "200", "Liste des films", movies);
});

app.get("/movies/:id", async (request, response) => {
    /*
        #swagger.description = 'Récupérer une personne grace a id'
    */
    const idRequest = parseInt(request.params.id);

    const movie = MOVIES[0];

    return helper.buildResponse(response, "200", "Film récupéré avec succès", movie);
});

app.post("/movies", async (request, response) => {
    /*
        #swagger.description = 'Enregistrer un film en base'
    */
    const data = request.body;

    const movie = MOVIES[0];

    // -- si trouver
    // En edition
    if (movie) {
        const updatedMovie = MOVIES[0];

        return helper.buildResponse(response, "200", "Modification avec succès", updatedMovie);
    }

    return helper.buildResponse(response, "700", "Erreur inconnue", null);
});

app.post("/signup", async (request, response) => {
    // methode 1
    //const data = request.body;

    // methode 2
    const data = { email: request.body.email, pseudo: request.body.pseudo, password: request.body.password};
   
    // instancer le model mongo
    const user = USERS[0];

    // Save en base
    const savedUser = user;

    // Si reussi
    if (savedUser){
        return helper.buildResponse(response, "200", "Inscription complète", savedUser);
    }

    return helper.buildResponse(response, "700", "Erreur technique dans l'inscription", null);
});

// Oublier mot de passe
app.post("/reset-password", async (request, response) => {
    // methode 2
    const data = { email: request.body.email }
   
    // Cherche un user
    const user = USERS[0];

    // Si user existe
    if (user){
        // Generer un nouveau password
        const newPassword = (Math.random() + 1).toString(36).substring(7);

        // Modifier le paswword dans le model
        user.password = newPassword;

        // Sauvegarde en base
        const validateUser = USERS[0];

        // Si reussi
        if (validateUser){
            return helper.buildResponse(response, "200", "Un mail vous a été envoyé", true);
        }
    }

    console.log("Erreur technique");
    return helper.buildResponse(response, "201", "Un mail vous a été envoyé", false);
});

/**
 * Une fonction qui vérifie la validité de token 
 * @param {*} request 
 * @returns 
 */
async function tokenVerify(request)  {
    const token = request.headers['authorization'];

    // probleme 1 pas de token
    if (!token){
        return false;
    }

    // Probleme 2 : token non valide
    // ATTENTION => verify est asychrone donc il faut l'await
    let verifyResult = false;
    await jwt.verify(token, secretJwtKey, (err, decoded) => {
        // Si erreur
        if (err){
            return verifyResult;
        }
        // si valide
        // Decoded => objet encodé (possiblité de l'injecter dans la requete si besoin)
        request.user = decoded;
        // passer le middle (donc ok)

        verifyResult = true;
        return verifyResult;
    });

    return verifyResult;
}

/**
 * Tester la validité du token dans un middleware
 * @param {*} request 
 * @param {*} response 
 * @param {*} next 
 * @returns 
 */
async function tokenVerifyMiddlware(request, response, next) {

    const tokenVerifyResult = await tokenVerify(request);

    if (tokenVerifyResult){
        next();
    }
    return response.status(400).json(buildResponseJson("700", "Token invalide", null));
}

// Login
app.post("/login", async (request, response) => {
   
    // J'att un objet user depuis le post
    const user = { email: request.body.email, password: request.body.password };

    // Verifier si couple user/password correcte
    const foundUser = USERS[0];

    // Si user trouvé en base
    if (foundUser){
        // Génération du token
        const token = jwt.sign(user, secretJwtKey, { expiresIn: '4s'});

        return helper.buildResponse(response, "200", "Connecté(e) aves succès", token);
    }
   
    // Par défaut Erreur
    return helper.buildResponse(response, "726", "Couple email/mot de passe erroné", "");
});

/**
 * Route pour verifier token encore valide
 */
app.get("/verify-token", async (request, response) => {
   
    // Async donc await
    const tokenVerifyResult = await tokenVerify(request);

    // Si token valide alors code : 200
    if (tokenVerifyResult){
        return helper.buildResponse(response, "200", "Token valide", true);
    }
    // Sinon code 740
    return helper.buildResponse(response, "740", "Token invalide", false);
});


// Lancer le server
app.listen(3000, () => {
    console.log("Serveur démarré");
});