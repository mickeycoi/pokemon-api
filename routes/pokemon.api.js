const fs = require("fs");
const express = require("express");
const { throws } = require("assert");
const router = express.Router();

const allowedFilter = ["name", "type"];
const pokemonTypes = [
  "bug",
  "dragon",
  "fairy",
  "fire",
  "ghost",
  "ground",
  "normal",
  "psychic",
  "steel",
  "dark",
  "electric",
  "fighting",
  "flyingText",
  "grass",
  "ice",
  "poison",
  "rock",
  "water",
];
/*
method: get
note: get all pokemon, filter by name or type
*/
router.get("/", (req, res, next) => {
  try {
    let { page, limit, ...filterQuerry } = req.query;

    page = parseInt(page) || 1; // ??
    limit = parseInt(limit) || 10; // ??
    const filterKeys = Object.keys(filterQuerry);
    filterKeys.forEach((key) => {
      if (!allowedFilter.includes(key)) {
        const exception = new Error(
          JSON.stringify({
            errCode: 1,
            massage: `Query ${key} is not allowed`,
          })
        );
        exception.statusCode = 401;
        throw exception;
      }
      if (!filterKeys[key]) delete filterKeys[key];
    });
    let offset = limit * (page - 1);

    let db = JSON.parse(fs.readFileSync("db.json", "utf-8"));

    const { data, totalPokemons } = db;

    let result = [];
    if (filterKeys.length) {
      filterKeys.forEach((condition) => {
        result = result.length
          ? result.filter(
              (pokemon) =>
                pokemon[condition].indexOf(filterQuerry[condition]) !== -1
            )
          : data.filter(
              (pokemon) =>
                pokemon[condition === "type" ? "types" : "name"].indexOf(
                  filterQuerry[condition]
                ) !== -1
            );
      });
    } else {
      result = data;
    }

    result = {
      data: result.slice(offset, offset + limit),
      totalPokemons: totalPokemons,
    };

    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
});

/*
method: get
note: get detail pokemon
*/

router.get("/:pokemonId", (req, res, next) => {
  try {
    let db = JSON.parse(fs.readFileSync("db.json", "utf-8"));
    const { data } = db;
    const { pokemonId } = req.params;
    const pokemonNumId = parseInt(pokemonId);
    let result = [];
    parseInt(pokemonId) <= data.length
      ? (result = {
          data: {
            pokemon: data.find((p) => p.id === pokemonNumId),
            previousPokemon: data.find(
              (p) =>
                p.id === (pokemonNumId === 1 ? data.length : pokemonNumId - 1)
            ),
            nextPokemon: data.find(
              (p) =>
                p.id === (pokemonNumId === data.length ? 1 : pokemonNumId + 1)
            ),
          },
        })
      : (result = "Opp! we don't have this pokemon");

    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
});

/*
method: post
note: create a pokemon
*/

router.post("/", (req, res, next) => {
  try {
    let db = JSON.parse(fs.readFileSync("db.json", "utf-8"));
    const { data, totalPokemons } = db;
    const { id, name, types, url } = req.body;

    if (!id || !name || !types || !url) {
      const exception = new Error("Missing body info");
      exception.statusCode = 401;
      throw exception;
    }
    if (data.map((e) => e.id).includes(id)) {
      const exception = new Error("Pokemon's id already exists");
      exception.statusCode = 401;
      throw exception;
    }
    if (id - totalPokemons > 1) {
      const exception = new Error(
        `Curent Id is ${totalPokemons}. New Id must be ${totalPokemons + 1}`
      );
      exception.statusCode = 401;
      throw exception;
    }
    if (data.map((e) => e.name).includes(name)) {
      const exception = new Error("Pokemon's name already exists");
      exception.statusCode = 401;
      throw exception;
    }
    if (types.length > 2) {
      const exception = new Error("Pokémon can only have one or two types");
      exception.statusCode = 401;
      throw exception;
    }
    if (types.map((e) => pokemonTypes.includes(e)).includes(false)) {
      const exception = new Error("Pokémon’s types is invalid");
      exception.statusCode = 401;
      throw exception;
    }

    const newPokemon = { id, name, types, url };

    data.push(newPokemon);

    db.totalPokemons = totalPokemons + 1;

    fs.writeFileSync("db.json", JSON.stringify(db));
    res.status(201).send(newPokemon);
  } catch (error) {
    next(error);
  }
});

/*
method: put
note: update a pokemon
*/

router.put("/:pokemonId", (req, res, next) => {
  try {
    const { pokemonId } = req.params;
    const updates = req.body;
    const updateKeys = Object.keys(updates);
    const notAllow = updateKeys.filter((key) => !allowedFilter.includes(key));
    if (notAllow.length) {
      const exception = new Error("Update field not allow");
      exception.statusCode = 404;
      throw exception;
    }
    let db = JSON.parse(fs.readFileSync("db.json", "utf-8"));
    const { data } = db;
    const targetIndex = data.findIndex(
      (pokemon) => pokemon.id === parseInt(pokemonId)
    );
    if (targetIndex < 0) {
      const exception = new Error("Pokemon not found");
      exception.statusCode = 404;
      throw exception;
    }
    const updatePokemon = { ...db.data[targetIndex], ...updates };
    db.data[targetIndex] = updatePokemon;
    db = fs.writeFileSync("db.json", JSON.stringify(db));
    res.status(200).send(updatePokemon);
  } catch (error) {
    next(error);
  }
});

/*
method: delete
note: delete a pokemon
*/
router.delete("/:pokemonId", (req, res, next) => {
  try {
    const { pokemonId } = req.params;
    let db = JSON.parse(fs.readFileSync("db.json", "utf-8"));
    const { data, totalPokemons } = db;
    const targetIndex = data.findIndex(
      (pokemon) => pokemon.id === parseInt(pokemonId)
    );
    if (targetIndex < 0) {
      const exception = new Error("Pokemon not found");
      exception.statusCode = 404;
      throw exception;
    }
    db.data = data.filter((pokemon) => pokemon.id !== parseInt(pokemonId));
    db.totalPokemons = totalPokemons - 1;
    fs.writeFileSync("db.json", JSON.stringify(db));

    res.status(200).send(`Pokemon have been deleted`);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
