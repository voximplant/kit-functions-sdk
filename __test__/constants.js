const notStringAndNumber = [Infinity, -Infinity, () => undefined, null, new Error(), () => null, NaN, {}, [], true, false];
const notString = [11, -11, ...notStringAndNumber];
const notNumber = ['11', '-11',...notStringAndNumber];

module.exports = {
  notStringAndNumber,
  notString,
  notNumber
}