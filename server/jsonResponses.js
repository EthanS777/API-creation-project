const fs = require('fs');

// get ALL the pokemon from the JSON file
const getPokemon = () => {
  const pokedex = fs.readFileSync(`${__dirname}/../data/pokedex.json`);
  return JSON.parse(pokedex);
};

// main re-usable respondJSON code
const respondJSON = (request, response, status, object) => {
  const content = JSON.stringify(object);

  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(content, 'utf8'),
  });

  // ONLY write response if request is GET
  if (request.method !== 'HEAD' || status !== 204) {
    response.write(content);
  }

  response.end();
};

// will return 200 success at endpoint /getAll
const getAll = (request, response) => {
  const pokemon = getPokemon();

  respondJSON(request, response, 200, pokemon);
};


// endpoint /getEvolution: return 200 if evolution found, else 404
// has query params ?name=
const getEvolution = (request, response) => {
  const pokemon = getPokemon();
  const isValid = request.query.name;
  let evolvedPoke = null;

  // if name not even entered
  if (!isValid) {
    const errorJSON = {
      message: "Missing Pokemon name!",
      id: 'notFound'
    };
    return respondJSON(request, response, 404, errorJSON);
  }

  // loop through each pokemon, check if the name is in query, and set evolvedPoke--
  // -- IF it has a next evolution
  pokemon.forEach(poke => {
    if (poke.name.toLowerCase() === isValid.toLowerCase()) {
      // if there IS a next evolution
      if (poke.next_evolution) {
        evolvedPoke = {
          name: poke.name,
          next_evolution: poke.next_evolution
        }
      }
    }
  })

  // if nothing was found, return 404
  if (!evolvedPoke) {
     const errorJSON = {
       message: "No next evolution found!",
       id: 'notFound'
     }

     return respondJSON(request, response, 404, errorJSON);
  }

  // else return the 200, found the next evolution
   return respondJSON(request, response, 200, evolvedPoke);
}

// getImage: return 200 if found, 404 if not- similar to getEvolution
// also has query params ?name=
const getImage = (request, response) => {
   const pokemon = getPokemon();
   const isValid = request.query.name;
   let foundImage;

   // loop through pokemon - if entered name is found, set foundImage
   pokemon.forEach(poke => {
     if (poke.name === isValid) {
        foundImage = {
          name: poke.name,
          image: poke.img
        };
     }
   });

   // if no text was found/entered, return 404
  if (!foundImage) {
    const errorJSON = {
      message: "No valid pokemon entered!",
      id: "notFound"
    };
    return respondJSON(request, response, 404, errorJSON);
  }

  // if found, 200 - return URL
  return respondJSON(request, response, 200, foundImage);
}

// will return 404 on non-existent endpoint
const getNonExistent = (request, response) => {
  const errorJSON = {
    message: "Sorry, this page hasn't been found!",
    id: 'notFound',
  };

  respondJSON(request, response, 404, errorJSON);
};

module.exports = {
  getPokemon, getAll, getNonExistent, getEvolution, getImage
};
