const key = 'pkmList';

// Makes a callout to the api for the list of all pokemon names
let getPokemonList = () => {
    const req = new Request('https://pokeapi.co/api/v2/pokemon?limit=1118');
    return response = fetch(req)
        .then(response => {
            if (!response.ok) {
                throw new Error(response);
            }
            return response.json();
        });
}

// Retrieves the list of all pokemon and caches it
let cachePokemonList = () => {
    return getPokemonList()
        .then(response => {

            // If the response was good, we'll cache the response
            localStorage.setItem(key, JSON.stringify(response));
            return Promise.resolve(true);
        })
        .catch(error => {

            // If the response was bad, we'll output the error
            console.error(`The list query resulted in an error: ${error}`);
            return Promise.resolve(false);
        });
}

// Loads the list if the list is not cached
let loadList = () => {
    let pList = localStorage.getItem(key);

    // If there's no cached value, load and cache the list
    if (!pList) {
        return cachePokemonList()
            .then(() => {
                pList = localStorage.getItem(key);
                return Promise.resolve('42');
            });
    }
    return Promise.resolve('42');
}

// Reduces the list of all pokemon down to the best match
let findPokemon = (pokemon) => {
    let isMega = (pokemon.indexOf("-mega") != -1 || pokemon.indexOf("mega ") != -1);

    // If we're looking for a mega, use the mega search
    if (isMega) return findMega(pokemon);

    // Pull in the pokemon list from the cache
    let pList = JSON.parse(localStorage.getItem(key)).results;

    // Finds the name that has the earliest index of the search string
    const reducer = (previous, current) => {
        let pIndex = previous.name.indexOf(pokemon);
        let cIndex = current.name.indexOf(pokemon);
        if (pIndex < 0 || current.name == pokemon) pIndex = 100;
        return (cIndex >= 0 && cIndex < pIndex) ? current : previous;
    };

    // Reduce and return the name
    return pList.reduce(reducer).name;
}

let findMega = (pokemon) => {
    if (pokemon.indexOf("-mega") == -1) pokemon = megaConversion(pokemon);

    // Pull in the pokemon list from the cache
    let pList = JSON.parse(localStorage.getItem(key)).results;

    // Get only the megas
    pList = pList.map(value => (value.name.indexOf("-mega") != -1) ? value.name : "zzzz");
    pList.sort();
    let pkmRaw = pokemon.substr(0, pokemon.indexOf("-"));

    // Finds the name that has the earliest index of the search string
    const reducer = (previous, current) => {
        let pIndex = previous.indexOf(pkmRaw);
        let cIndex = current.indexOf(pkmRaw);
        if (pIndex < 0 || current == pokemon) pIndex = 100;
        return (cIndex >= 0 && cIndex < pIndex) ? current : previous;
    };

    // Reduce and return the name
    return pList.reduce(reducer);
}

// Makes a callout for the requested pokemon
let makeCallout = (pokemon) => {

    // Match the input string to a valid pokemon name
    pokemon = findPokemon(pokemon.toLowerCase());

    // Fetch the resource
    const req = new Request('https://pokeapi.co/api/v2/pokemon/' + pokemon);
    return fetch(req)
        .then(response => {
            if (!response.ok) {
                throw new Error(response);
            }

            // If the response was a success, then return the json
            return response.json();
        });
}

// This function returns a promise of the requested data
let pokeapiCallout = (pokemon) => {

    // First, we need to load the list of all pokemon
    return loadList()
        .then(() => {

            // Then, we make the callout and return the response
            return makeCallout(pokemon)
                .then(response => {
                    return response;
                });
        });
}

// Makes a callout for the next pokemon in the pokedex
let getNextPokemon = pkmData => {
    let pList = JSON.parse(localStorage.getItem(key)).results;
    let nextId = pkmData.id;
    nextId = mapId(nextId);
    if (nextId >= pList.length) nextId = 0;

    let nextName = pList[nextId].name;
    return pokeapiCallout(nextName);
}

// Makes a callout for the previous pokemon in the pokedex
let getPrevPokemon = pkmData => {
    let pList = JSON.parse(localStorage.getItem(key)).results;
    let prevId = pkmData.id - 2;
    if (prevId < 0) prevId = pList.length - 1;
    prevId = mapId(prevId);

    let prevName = pList[prevId].name;
    return pokeapiCallout(prevName);
}

// Returns a string with the first letter of each word capitalized
let capitalize = word => {
    word = megaConversion(word);
    let allWords = word.split('-');
    let ret = "";
    for (let word of allWords) {
        ret += capitalizeWord(word) + " ";
    }
    return ret.substr(0, ret.length - 1);
}

// Converts a single word to a capitalized word
let capitalizeWord = word => {
    let wordBody = word.substring(1);
    return word[0].toUpperCase() + wordBody;
}

// Converts a word from normal mega syntax to pokeApi mega syntax
let megaConversion = word => {
    if (word.indexOf("mega") == -1) return word;

    // Don't skip Meganium
    if (word.indexOf("megan") != -1 || word == "mega") return word;

    if (word.indexOf("-") != -1) return megaFromKebab(word);

    return megaToKebab(word);
}

// Converts pokeApi kebab mega name to a normal readable mega name
let megaFromKebab = word => "mega-" + word.replace("-mega", "");

// Converts a normal readable mega name to a kebab pokeApi name
let megaToKebab = word => {
    word = word.replace("mega ", "");
    if (word.indexOf(" ") == -1) return word + "-mega";
    word = word.replace(" ", "-mega-");
    return word.replaceAll(" ", "-");
}

// pokeApi uses 10000 + as special forms, so convert these to a sequential number
let mapId = id => {
    if (id > 10000) return 898 + (id - 10000);
    return id;
}

export { pokeapiCallout as getPokemon, capitalize, getNextPokemon, getPrevPokemon };