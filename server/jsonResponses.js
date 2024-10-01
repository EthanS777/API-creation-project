const fs = require('fs');

// load/parse pokemon from the JSON file - at startup (not in func)
const pokedex = JSON.parse(fs.readFileSync(`${__dirname}/../data/pokedex.json`));
const getPokemon = () => pokedex;

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


// endpoint /getEvolution: return 200 if evolution found, 400 if name not entered, else 404
// has query params ?name=
const getEvolution = (request, response) => {
  const pokemon = getPokemon();
  // use name query param
  const isValid = request.query.name;
  let evolvedPoke = null;

  // if name not even entered, 400- missing params
  if (!isValid) {
    const errorJSON = {
      message: "Missing Pokemon name!",
      id: 'userMissingParams'
    };
    return respondJSON(request, response, 400, errorJSON);
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

  // if entered but nothing found, return 404
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

// getImage: return 200 if found, 400/404 if not- similar to getEvolution
// also has query params ?name=
const getImage = (request, response) => {
   const pokemon = getPokemon();
   // use name query param
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

   // if user didn't type anything, 400
   if (!isValid) {
    const errorJSON = {
      message: "Missing Pokemon name!",
      id: "userMissingParams"
    };

    return respondJSON(request, response, 400, errorJSON);
   }

   // if text was entered but not found, return 404
  if (!foundImage) {
    const errorJSON = {
      message: "No valid pokemon entered!",
      id: "notFound"
    };
    return respondJSON(request, response, 404, errorJSON);
  }

  // if found, 200 - return URL
  return respondJSON(request, response, 200, foundImage);
};

// getName: will return 200, 400/404
const getName = (request, response) => {
  const pokemon = getPokemon();
  const { type, weakness } = request.query;

  // make array for list of names
  let names = [];

  pokemon.forEach(poke => {
    let added = false;

    // if type entered and exists in poke, add name
    if (type && poke.type.includes(type)) {
      names.push(poke.name);
      added = true;
    }
    // if weakness entered and exists in poke, also add name
    if (!added && weakness && poke.weaknesses.includes(weakness)) {
      names.push(poke.name);
    }
  });

  // if array isn't empty by now, return with either 200, 400, or 404
  if (names.length > 0) { 
   respondJSON(request, response, 200, { name: names });
  }
  // 404 
  else if (names.length == 0 && (type || weakness)){
   const errorJSON = {
    message: "No pokemon names found for your search!",
    id: "notFound"
   }
   respondJSON(request, response, 404, errorJSON);
  }
  // 400 with NO input at all
  else if (names.length == 0 && (!type && !weakness)) {
    const errorJSON = {
      message: "Missing type or weakness!",
      id: "userMissingParams",
    };

    respondJSON(request, response, 400, errorJSON);
  }
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
  getPokemon, getAll, getNonExistent, getEvolution, getImage, getName
};
