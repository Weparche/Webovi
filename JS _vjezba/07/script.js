const prijatelj1 = "Luka";

const prijatelji = ["Luka", "Ivan", "Hrvoje"];


console.log(prijatelji[0]);

console.log(prijatelji.length);

console.log(prijatelji[prijatelji.length -1]);

prijatelji[2] = "Stjepan";
console.log(prijatelji);

prijatelji.splice(0, 2, "Matej");

console.log(prijatelji);

const godine = new Array(24, 28, 32);

let x;

x = godine.includes(28);
x = godine.indexOf(28);
x = godine.indexOf(26);

console.log(godine, x);

var matrix = [[1, 2, 3], ["John", "Jane", "Mike"]];

matrix[0][1];

console.log(matrix)

