const notStringAndNumber = [ null, new Error(), new Function(), NaN, {}, [], true, false];
const notString = [11, -11, Infinity, -Infinity, ...notStringAndNumber];
const notNumber = ['11', '-11',...notStringAndNumber];

module.exports = {
  notStringAndNumber,
  notString,
  notNumber
}
