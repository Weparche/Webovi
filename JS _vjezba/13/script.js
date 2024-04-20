"use strict";

const auti = [
    {ime: "mercedes", kategorija : "limuzina", godinaProizvodnje: 2015 },
    {ime: "audi", kategorija : "limuzina", godinaProizvodnje: 2017 },
    {ime: "ford", kategorija : "karavan", godinaProizvodnje: 2016 },
    {ime: "Volvo", kategorija : "karavan", godinaProizvodnje: 2021 },
    {ime: "BMW", kategorija : "karavan", godinaProizvodnje: 2019 },
];

// Koristimo map metodu za prolazak kroz svaki automobil i izdvajanje imena marki
const marke = auti.map(auto => auto.ime);

// Ispisujemo rezultate
console.log("Liste marki automobila:", marke);

const noviAuti = auti.map(auto => ({ marka: auto.ime, kategorija: auto.kategorija }));

// Ispisujemo rezultate
console.log("Novi automobili:", noviAuti);

const listaBrojeva = [1, 3, 5, 6];
const rezultat = listaBrojeva.map((broj) => Math.sqrt(broj));
console.log(rezultat)

const kosarica = [
    {id: 1, proizvod: "kruh", cijena: 1.5},
    {id: 2, proizvod: "mlijeko", cijena: 2},
    {id: 3, proizvod: "salama", cijena: 5},
    {id: 4, proizvod: "sapun", cijena: 4},
    {id: 5, proizvod: "salama", cijena: 3},
    
];

const ukupniZbroj = kosarica.reduce((zbroj, item) => zbroj + item.cijena, 0);

console.log("Ukupni zbroj:", ukupniZbroj);