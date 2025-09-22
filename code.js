const faces = ['♥️', '♦️', '♣️', '♠️'];
const numbers = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function Color(face) {
  return (face === 'Hearts' || face === 'Diamonds') ? 'red' : 'black';
}
let deck = [];
for (let face of faces) {
  for (let number of numbers) {
    let cards = {
      face: face,
      number: number,
      color: Color(face)
    };
    deck.push(cards);
  }
}

console.log(deck);
