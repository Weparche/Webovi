"use strict";

/*const lopta = "nogometna";

const sport = () => {
    const lopta = "košarkaška";
    const lopta2 = "rukometna";
    console.log(lopta, lopta2);
};

sport(); */

const lopta = "nogometna";

const sport = () => {
    const lopta2 = "rukometna";
    return {
        sport2: () => {
            return console.log(lopta, lopta2);
        },
    };
};

const noviSport = sport();
noviSport.sport2();

console.log(lopta, lopta3);

var lopta3 = "košarkaška";



