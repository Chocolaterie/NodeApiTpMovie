const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// ============= BDD =======================/
// Preparer un model (une classe Person)
const Movie = mongoose.model('Movie', { id: Number, title: String, synopsis: String, duration: String, year: String, thumbnail_url: String }, "movies");

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

    // Retourner le json des personnes
    response.json(movies);
});

app.get("/movies/:id", async (request, response) => {
    /*
        #swagger.description = 'Récupérer une personne grace a id'
    */
    const idRequest = parseInt(request.params.id);

    const movie = await Movie.findOne({ id: idRequest });

    response.json(movie);
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
        await Movie.findOneAndUpdate({ id: data.id }, data);

        return response.json(data);
    }

    return response.json({ message : "error"});
});


// Lancer le server
app.listen(3000, () => {
    console.log("Serveur démarré");
});