const faces = ['♥️', '♦️', '♣️', '♠️'];
const numbers = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
function Color(face) {
  return (face === '♥️' || face === '♦️') ? 'red' : 'black';
}

let deck = [];
for (let i of faces) {
  for (let j of numbers) {
    let cards = {
         face: i, 
         number: j, color: 
         Color(i), faceUp: false };
    deck.push(cards);
  }
}
function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
deck = shuffleDeck(deck);
function dealCards(deck) {
  let tableau = [[], [], [], [], [], [], []];
  let deckIndex = 0;
  for (let col = 0; col < 7; col++) {
    for (let cardCount = 0; cardCount <= col; cardCount++) {
      let card = deck[deckIndex];
      card.faceUp = (cardCount === col);
      tableau[col].push(card);
      deckIndex++;
    }
  }
  let stock = deck.slice(deckIndex);
  return { tableau, stock };
}
 
let { tableau, stock } = dealCards(deck);
let waste = [];

let draggedCard = null;
let draggedStack = [];
 

function createCardElement(card) {
  const cardDiv = document.createElement('div');
  cardDiv.classList.add('card', card.faceUp ? 'face-up' : 'face-down');
cardDiv.style.position = 'relative';
  if (card.faceUp) {
    const span = document.createElement('span');
    span.classList.add('rank-suit');
    span.textContent = `${card.number}${card.face}`;
span.style.color = (card.color === 'red') ? 'red' : 'black';
    cardDiv.appendChild(span);
    cardDiv.setAttribute('draggable', true);
    cardDiv.addEventListener('dragstart', (e) => {
      e.dataTransfer.setDragImage(cardDiv, 40, 60);
      draggedCard = card;
      for (let col = 0; col < 7; col++) {
        const idx = tableau[col].indexOf(card);
        if (idx !== -1) {
          draggedStack = tableau[col].slice(idx);
          return;
        }
      }
      draggedStack = [card];
    });
    cardDiv.addEventListener('dragend', () => {
      draggedCard = null;
      draggedStack = [];
    });
  }
  return cardDiv;
}
 

function renderTableau(tableau) {
  for (let i = 0; i < tableau.length; i++) {
    const column = document.getElementById(`column-${i + 1}`);
    column.innerHTML = '';
    tableau[i].forEach(card => {
      const cardEl = createCardElement(card);
      column.appendChild(cardEl);
    });
  }
  addDragDropListeners();
}
 
function renderStock(stock) {
  const stockDiv = document.getElementById('stock');
  stockDiv.innerHTML = '';
  stock.forEach((card, index) => {
    const cardEl = document.createElement('div');
    cardEl.classList.add('card', 'face-down');
cardEl.style.position = 'absolute';
cardEl.style.top = `${index * 0.5}px`;
cardEl.style.left = `${index * 0.5}px`;
    stockDiv.appendChild(cardEl);
  });
}
 
function renderWaste(waste) {
  const wasteDiv = document.getElementById('waste');
  wasteDiv.innerHTML = '';
wasteDiv.style.position = 'relative';
  const start = Math.max(0, waste.length - 3);
  const visibleCards = waste.slice(start);
  visibleCards.forEach((card, index) => {
    const cardEl = createCardElement(card);
cardEl.style.position = 'absolute';
cardEl.style.left = `${index * 20}px`;
cardEl.style.top = '0px';
cardEl.style.zIndex = index;
    if (index === visibleCards.length - 1) {
      cardEl.setAttribute('draggable', true);
      cardEl.addEventListener('dragstart', (e) => {
        e.dataTransfer.setDragImage(cardEl, 40, 60);
        draggedCard = card;
        draggedStack = [card];
      });
      cardEl.addEventListener('dragend', () => {
        draggedCard = null;
        draggedStack = [];
      });
    }
    wasteDiv.appendChild(cardEl);
  });
}
 let foundationPiles = [[], [], [], []];
function renderFoundations() {
  for (let i = 0; i < 4; i++) {
    const foundationDiv = document.getElementById(`foundation-${i + 1}`);
    foundationDiv.innerHTML = '';
    const pile = foundationPiles[i];
    pile.forEach(card => {
      const cardEl = createCardElement(card);
      foundationDiv.appendChild(cardEl);
    });
  }
}
 let gameWon = false;  
function checkWin() {
  if (!gameWon && foundationPiles.every(pile => pile.length === 13)) {
    gameWon = true;
    document.getElementById("winPopup").style.display = "flex";

    // Hide popup and restart after 5 seconds
    setTimeout(() => {
      document.getElementById("winPopup").style.display = "none";
      restartGame();
    }, 5000);
  }
}
function restartGame() {
  // your restart logic here (reshuffle, redeal, etc.)
  gameWon = false;
  document.getElementById("winPopup").style.display = "none";
  window.onload = function () {
  renderTableau(tableau);
  renderStock(stock);
  renderWaste(waste);
  renderFoundations();
  setupFoundationDrops();
};
}

 
document.getElementById('stock').addEventListener('click', () => {
  if (stock.length === 0) {
    stock = waste.reverse().map(card => {
      card.faceUp = false;
      return card;
    });
    waste = [];
  } else {
    const card = stock.shift();
    card.faceUp = true;
    waste.push(card);
  }
  renderStock(stock);
  renderWaste(waste);
});
 
function addDragDropListeners() {
  for (let i = 1; i <= 7; i++) {
    const column = document.getElementById(`column-${i}`);
    column.addEventListener('dragover', (e) => e.preventDefault());
    column.addEventListener('drop', (e) => {
      e.preventDefault();
      if (!draggedCard) return;

      const toColumnIndex = i - 1;
      const toColumn = tableau[toColumnIndex];
      const topCard = toColumn[toColumn.length - 1];

      let fromColumnIndex = -1;
      let cardIndex = -1;
      let fromWaste = false;

      // Find source column
      for (let col = 0; col < 7; col++) {
        const idx = tableau[col].indexOf(draggedCard);
        if (idx !== -1) {
          fromColumnIndex = col;
          cardIndex = idx;
          break;
        }
      }

      // If not from tableau, check waste
      if (fromColumnIndex === -1) {
        const idx = waste.indexOf(draggedCard);
        if (idx !== -1) {
          fromWaste = true;
        } else return;
      }

      // Check tableau placement rules (same as your rule)
      const draggedValue = numbers.indexOf(draggedCard.number);
      if (!topCard) {
        if (draggedCard.number == '') return;
      } else {
        const topValue = numbers.indexOf(topCard.number);
        if (draggedCard.color !== topCard.color) return;
        if (draggedValue !== topValue - 1) return;
      }

      // Remove from source — track if we flipped a card
      let wasFlipped = false;
      let flippedCard = null;

      if (fromWaste) {
        waste = waste.filter(c => c !== draggedCard);
      } else {
        // remove the moved stack from source column
        tableau[fromColumnIndex].splice(cardIndex);

        // if there is now a new last card, and it was face-down, flip it and record
        if (tableau[fromColumnIndex].length > 0) {
          const last = tableau[fromColumnIndex][tableau[fromColumnIndex].length - 1];
          if (!last.faceUp) {
            last.faceUp = true;
            wasFlipped = true;
            flippedCard = last; // save reference so undo can flip it back
          }
        }
      }

      // Add to destination
      tableau[toColumnIndex] = tableau[toColumnIndex].concat(draggedStack);

      // Save move to history (including flipped info)
      moveHistory.push({
        stack: [...draggedStack],
        from: fromWaste ? "waste" : "tableau",
        fromIndex: fromWaste ? -1 : fromColumnIndex,
        to: "tableau",
        toIndex: toColumnIndex,
        flipped: wasFlipped,
        flippedCard: flippedCard || null
      });

      renderTableau(tableau);
      renderWaste(waste);
    });
  }
}

 
function setupFoundationDrops() {
  for (let i = 1; i <= 4; i++) {
    const foundation = document.getElementById(`foundation-${i}`);
    foundation.addEventListener('dragover', (e) => e.preventDefault());
    foundation.addEventListener('drop', (e) => {
      e.preventDefault();
      if (!draggedCard) return;
      const pile = foundationPiles[i - 1];
      if (pile.length === 0) {
        if (draggedCard.number !== 'A') return;
      } else {
        const topCard = pile[pile.length - 1];
        const draggedValue = numbers.indexOf(draggedCard.number);
        const topValue = numbers.indexOf(topCard.number);
        if (draggedCard.face !== topCard.face) return;
        if (draggedValue !== topValue + 1) return;
      }
      let removed = false;
      for (let col = 0; col < 7; col++) {
        const idx = tableau[col].indexOf(draggedCard);
        if (idx !== -1) {
          tableau[col].splice(idx, 1);
          if (tableau[col].length > 0) {
            const last = tableau[col][tableau[col].length - 1];
            if (!last.faceUp) last.faceUp = true;
          }
          removed = true;
          break;
        }
      }
      if (!removed) {
        const idx = waste.indexOf(draggedCard);
        if (idx !== -1) waste.splice(idx, 1);
      }
      foundationPiles[i - 1].push(draggedCard);

// Save move for undo
moveHistory.push({
  stack: [draggedCard],
  from: removed ? "tableau" : "waste",
  fromIndex: removed ? tableau.findIndex(col => col.includes(draggedCard)) : -1,
  to: "foundation",
  toIndex: i - 1
});

renderTableau(tableau);
renderWaste(waste);
renderFoundations();
checkWin();

    });
  }


}
 let moveHistory = [];

// Example: moving a card
function moveCard(card, fromPile, toPile) {
  // Remove card from source
  fromPile.pop();
  // Add card to destination
  toPile.push(card);

  // Save move for undo
  moveHistory.push({
  stack: [draggedCard],
  from: removed ? "tableau" : "waste",   // where the card came from
  fromIndex: removed ? tableau.findIndex(col => col.includes(draggedCard)) : -1,
  to: "foundation",
  toIndex: i - 1
});

}

// Undo last move
function undoLastMove() {
  if (!moveHistory || moveHistory.length === 0) return;

  const lastMove = moveHistory.pop();
  const { stack, from, fromIndex, to, toIndex, flipped, flippedCard } = lastMove;

  // 1) Remove the moved cards from destination
  if (to === "tableau") {
    // remove last `stack.length` cards from that tableau column
    const col = tableau[toIndex];
    col.splice(col.length - stack.length, stack.length);
  } else if (to === "foundation") {
    const f = foundationPiles[toIndex];
    f.splice(f.length - stack.length, stack.length);
  } else if (to === "waste") {
    waste.splice(waste.length - stack.length, stack.length);
  } else if (to === "stock") {
    // if a move somehow went to stock, remove them from front
    stock.splice(0, stack.length);
  }

  // 2) Return cards to their original source
  if (from === "tableau") {
    // put them back on top of that tableau column
    tableau[fromIndex] = tableau[fromIndex].concat(stack);

    // If the move had flipped a card behind, flip it back down
    if (flipped && flippedCard) {
      flippedCard.faceUp = false;
    }
  } else if (from === "waste") {
    waste = waste.concat(stack);
  } else if (from === "stock") {
    // put back to front of stock (preserve order)
    stock = stack.concat(stock);
  } else if (from === "foundation") {
    foundationPiles[fromIndex] = foundationPiles[fromIndex].concat(stack);
  }

  // 3) Re-render everything
  renderTableau(tableau);
  renderStock(stock);
  renderWaste(waste);
  renderFoundations();
}




// Example: button
const undoBtn = document.getElementById("undoBtn");
undoBtn.addEventListener("click", undoLastMove);


window.onload = function () {
  renderTableau(tableau);
  renderStock(stock);
  renderWaste(waste);
  renderFoundations();
  setupFoundationDrops();
};