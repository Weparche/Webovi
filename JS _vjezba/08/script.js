"use strict";

function ispis () {
    console.log("Zovem se Igor");
}

ispis();

const test = nutriBullet(7, 2);

function nutriBullet(jabuke, kruske) {
    console.log(jabuke, kruske);
    const sok = `Sok od ${jabuke} jabuka i ${kruske} krušaka`;
    return sok;
}

nutriBullet(5, 1);
nutriBullet(2, 4);

const sokodjabuke = nutriBullet(5, 1);
const sokodkruske = nutriBullet(2, 4);

console.log(sokodjabuke, sokodkruske);


// 

const godDoMirovine = (godRodjenja, imePrezime) => {
    const godine = 2024 - godRodjenja;
    const mirovina = 65 - godine;
    if (mirovina > 0) {
        return `${imePrezime} će se umiroviti za ${mirovina} godina/e`;
    } else {
        return `${imePrezime} je već u mirovini.`;
    }
};

console.log(godDoMirovine(2004, "Mile Kitić"));