const fs = require('fs');

// load/parse pokemon from the JSON file - at startup (not in func)
const pokedex = JSON.parse(fs.readFileSync(`${__dirname}/../data/pokedex.json`));
const getPokemon = () => pokedex;

// main re-usable respondJSON code
const respondJSON = (request, response, status, object) => {
  const content = JSON.stringify(object);

  if (status === 204) {
    response.writeHead(status);
    return response.end();
  }

  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(content, 'utf8'),
  });

  // ONLY write response if request is GET
  if (request.method !== 'HEAD' || status !== 204) {
    response.write(content);
  }

  return response.end();
};

// will return 200 success at endpoint /getAll
const getAll = (request, response) => {
  const pokemon = getPokemon();

  return respondJSON(request, response, 200, pokemon);
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
      message: 'Missing Pokemon name!',
      id: 'userMissingParams',
    };
    return respondJSON(request, response, 400, errorJSON);
  }

  // loop through each pokemon, check if the name is in query, and set evolvedPoke--
  // -- IF it has a next evolution
  pokemon.forEach((poke) => {
    if (poke.name.toLowerCase() === isValid.toLowerCase()) {
      // if there IS a next evolution (array)
      if (Array.isArray(poke.next_evolution) && poke.next_evolution.length > 0) {
        evolvedPoke = {
          name: poke.name,
          next_evolution: poke.next_evolution.map((evo) => ({
            name: evo.name || '',
          })),
        };
      }
    }
  });

  if (evolvedPoke) {
    // return the 200, found the next evolution
    return respondJSON(request, response, 200, evolvedPoke);
  }

  // else if entered but nothing found, return 404

  const errorJSON = {
    message: 'No next evolution found!',
    id: 'notFound',
  };

  return respondJSON(request, response, 404, errorJSON);
};

// getImage: return 200 if found, 400/404 if not- similar to getEvolution
// also has query params ?name=
const getImage = (request, response) => {
  const pokemon = getPokemon();
  // use name query param - if valid, make it lowercase
  const isValid = request.query.name ? request.query.name.toLowerCase() : '';
  let foundImage;

  // loop through pokemon - if entered name is found, set foundImage
  pokemon.forEach((poke) => {
    if (poke.name.toLowerCase() === isValid) {
      foundImage = {
        name: poke.name,
        image: poke.img,
      };
    }
  });

  // if user didn't type anything, 400
  if (!isValid) {
    const errorJSON = {
      message: 'Missing Pokemon name!',
      id: 'userMissingParams',
    };

    return respondJSON(request, response, 400, errorJSON);
  }

  // if text was entered but not found, return 404
  if (!foundImage) {
    const errorJSON = {
      message: 'No valid pokemon entered!',
      id: 'notFound',
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
  const names = [];

  pokemon.forEach((poke) => {
    let added = false;

    // if type entered and exists in poke, add name
    // make sure input is case-insensitive
    if (type && poke.type.map((typeTime) => typeTime.toLowerCase()).includes(type.toLowerCase())) {
      names.push(poke.name);
      added = true;
    }
    // if weakness entered and exists in poke, also add name, plus case-insensitivity
    if (!added && weakness && poke.weaknesses.map((weaknessTime) => weaknessTime.toLowerCase())
      .includes(weakness.toLowerCase())) {
      names.push(poke.name);
    }
  });

  // if array isn't empty by now, return with either 200, 400, or 404
  if (names.length > 0) {
    respondJSON(request, response, 200, { name: names });
  } else if (names.length === 0 && (type || weakness)) { // 404
    const errorJSON = {
      message: 'No pokemon names found for your search!',
      id: 'notFound',
    };
    respondJSON(request, response, 404, errorJSON);
  } else if (names.length === 0 && (!type && !weakness)) { // 400 with NO input at all
    const errorJSON = {
      message: 'Missing type or weakness!',
      id: 'userMissingParams',
    };

    respondJSON(request, response, 400, errorJSON);
  }
};

// add a pokemon! 201
const addPoke = (request, response) => {
  const {
    name, type, weaknesses, nextEvo, img,
  } = request.body;

  // if no name entered, return 400
  if (!name) {
    const errorJSON = {
      message: 'Name required!',
      id: 'nameMissing',
    };
    return respondJSON(request, response, 400, errorJSON);
  }

  // if pokemon with same name already exists, return a 400
  const pokeExists = pokedex.find((poke) => poke.name.toLowerCase() === name.toLowerCase());

  if (pokeExists) {
    const errorJSON = {
      message: 'This pokemon already exists!',
      id: 'badRequest',
    };
    return respondJSON(request, response, 400, errorJSON);
  }

  // for the new pokemon object:
  // make sure type/weakness is an array or else bugs in code
  // if array then return type, but if not, still always return array
  let typesList = [];
  if (Array.isArray(type)) {
    typesList = type;
  } else if (type) {
    typesList = type.split(',');
  }

  let weaknessesList = [];
  if (Array.isArray(weaknesses)) {
    weaknessesList = weaknesses;
  } else if (weaknesses) {
    weaknessesList = weaknesses.split(',');
  }

  // if not provided, default to empty
  const newPoke = {
    name,
    type: typesList,
    weaknesses: weaknessesList,
    next_evolution: [{ name: nextEvo }] || [],
    img: img || '',
  };

  // add newly created one to list
  pokedex.push(newPoke);

  // send back 201 (created) code
  return respondJSON(request, response, 201, { message: 'New Pokemon added!', newPoke });
};

// update a pokemon! 204
const updatePoke = (request, response) => {
  const {
    name, type, weaknesses, nextEvo, img,
  } = request.body;

  // same as addPoke.. if no name entered, 400
  if (!name) {
    const errorJSON = {
      message: 'Name required!',
      id: 'nameMissing',
    };

    return respondJSON(request, response, 400, errorJSON);
  }

  // check for name in the pokedex, see if it matches the name typed
  const pokemon = pokedex.find((poke) => poke.name.toLowerCase() === name.toLowerCase());

  // if it doesn't, return 404 not found
  if (!pokemon) {
    const errorJSON = {
      message: "That pokemon doesn't exist!",
      id: 'notFound',
    };

    return respondJSON(request, response, 404, errorJSON);
  }

  // update pokemon
  pokemon.type = type ? type.split(',') : pokemon.type;
  pokemon.weaknesses = weaknesses ? weaknesses.split(',') : pokemon.weaknesses;
  pokemon.next_evolution = nextEvo ? [{ name: nextEvo.split(',') }] : pokemon.next_evolution;
  pokemon.img = img || pokemon.img;

  // return 204
  return respondJSON(request, response, 204);
};

// will return 404 on non-existent endpoint
const getNonExistent = (request, response) => {
  const errorJSON = {
    message: "Sorry, this page hasn't been found!",
    id: 'notFound',
  };

  respondJSON(request, response, 404, errorJSON);
};

module.exports = {
  getPokemon, getAll, getNonExistent, getEvolution, getImage, getName, addPoke, updatePoke,
};
