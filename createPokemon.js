const fs = require("fs");
const csv = require("csvtojson");

const createPokemon = async () => {
  let newData = await csv().fromFile("pokemon.csv");
  let data = JSON.parse(fs.readFileSync("db.json"));
  newData = newData
    .map((e, index) => {
      return {
        id: index + 1,
        name: e.Name,
        types: e.Type2
          ? [e.Type1.toLowerCase(), e.Type2.toLowerCase()]
          : [e.Type1.toLowerCase()],
        url: `http://localhost:5000/images/${index + 1}.jpg`,
      };
    })
    .slice(0, 721);
  data.data = newData;
  data.totalPokemons = newData.length;
  fs.writeFileSync("db.json", JSON.stringify(data));
};

createPokemon();
