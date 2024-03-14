const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const helper = require('./helper.js');

// La clé
const secretJwtKey = 'UnBonMatelasEmma';

// ============= BDD =======================/
// Preparer un model (une classe Person)
const Movie = mongoose.model('Movie', { id: Number, title: String, synopsis: String, duration: String, year: String, thumbnail_url: String }, "movies");

const User = mongoose.model('User', { email: String, pseudo: String, password: String }, "users");

// Url mongo
const urlMongo = "mongodb://127.0.0.1:27017/db_movie";

// Connexion à la base
mongoose.connect(urlMongo);

// si connexion ok
mongoose.connection.once('open', () => {
    console.log("Connecté à la base Mongo !");
});

// si connexion error
mongoose.connection.on('error', (error) => {
    console.log("Erreur de connexion à la base Mongo !");
});

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

// Déclarer des routes
app.get("/movies", async (request, response) => {
    /*
        #swagger.description = 'Récupérer la liste des personnes'
    */

    // Select all avec mongodb
    const movies = await Movie.find();

    // Retourner la réponse
    return helper.buildResponse(response, "200", "Liste des films", movies);
});

app.get("/movies/:id", async (request, response) => {
    /*
        #swagger.description = 'Récupérer une personne grace a id'
    */
    const idRequest = parseInt(request.params.id);

    const movie = await Movie.findOne({ id: idRequest });

    return helper.buildResponse(response, "200", "Film récupéré avec succès", movie);
});

app.post("/movies", async (request, response) => {
    /*
        #swagger.description = 'Enregistrer un film en base'
    */
    const data = request.body;

    const movie = await Movie.findOne({ id: data.id });

    // -- si trouver
    // En edition
    if (movie) {
        const updatedMovie = await Movie.findOneAndUpdate({ id: data.id }, data);

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
    const user = User(data);

    // Save en base
    const savedUser = await user.save();

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
    const user = await User.findOne({email : data.email});

    // Si user existe
    if (user){
        // Generer un nouveau password
        const newPassword = (Math.random() + 1).toString(36).substring(7);

        // Modifier le paswword dans le model
        user.password = newPassword;

        // Sauvegarde en base
        const validateUser = await user.save();

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
function tokenVerify(request){
    const token = request.headers['authorization'];

    // probleme 1 pas de token
    if (!token){
        return false;
    }

    // Probleme 2 : token non valide
    jwt.verify(token, secretJwtKey, (err, decoded) => {
        // Si erreur
        if (err){
            return false;
        }
        // si valide
        // Decoded => objet encodé (possiblit" de l'injecter dans la requete si besoin)
        request.user = decoded;
        // passer le middle (donc ok)
        return true;
    });

    return false;
}

/**
 * Tester la validité du token dans un middleware
 * @param {*} request 
 * @param {*} response 
 * @param {*} next 
 * @returns 
 */
function tokenVerifyMiddlware(request, response, next){

    if (tokenVerify(request)){
        next();
    }
    return response.status(400).json(buildResponseJson("700", "Token invalide", null));
}

// Login
app.post("/login", async (request, response) => {
   
    // J'att un objet user depuis le post
    const user = { email: request.body.email, password: request.body.password };

    // Verifier si couple user/password correcte
    const foundUser = await User.findOne({ email: user.email, password : user.password });

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
   
    // Si token valide alors code : 200
    if (tokenVerify(request)){
        return helper.buildResponse(response, "200", "Token valide", true);
    }
    // Sinon code 740
    return helper.buildResponse(response, "740", "Token invalide", false);
});


// Lancer le server
app.listen(3000, () => {
    console.log("Serveur démarré");
});