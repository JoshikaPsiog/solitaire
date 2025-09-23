const faces = ['♥️', '♦️', '♣️', '♠️'];
const numbers = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
function Color(face){ return (face==='♥️'||face==='♦️')?'red':'black'; }

let deck = [];
for(let f of faces){
  for(let n of numbers){
    deck.push({ 
        face:f, 
        number:n, 
        color:Color(f), faceUp:false });
  }
}

function shuffleDeck(deck){
  for(let i=deck.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [deck[i],deck[j]]=[deck[j],deck[i]];
  }
  return deck;
}
deck = shuffleDeck(deck);

function dealCards(deck){
  let tableau=[[],[],[],[],[],[],[]];
  let deckIndex=0;
  for(let col=0;col<7;col++){
    for(let cardCount=0;cardCount<=col;cardCount++){
      let card=deck[deckIndex];
      card.faceUp = (cardCount===col);
      tableau[col].push(card);
      deckIndex++;
    }
  }
  let stock = deck.slice(deckIndex);
  return { tableau, stock };
}

let { tableau, stock } = dealCards(deck);
let waste = [];
let foundationPiles = [[],[],[],[]];
let draggedCard = null;
let draggedStack = [];
let moveHistory = []; 

function createCardElement(card){
  const div = document.createElement('div');
  div.classList.add('card', card.faceUp?'face-up':'face-down');
  if(card.faceUp){
    div.textContent = `${card.number}${card.face}`;
    div.style.color = card.color;
    div.setAttribute('draggable', true);
    div.addEventListener('dragstart',(e)=>{
      draggedCard = card;
      for(let col=0;col<7;col++){
        const idx = tableau[col].indexOf(card);
        if(idx!==-1){ draggedStack=tableau[col].slice(idx); return; }
      }
      draggedStack = [card];
    });
    div.addEventListener('dragend',()=>{
      draggedCard = null;
      draggedStack = [];
    });
  }
  return div;
}

function renderTableau(tableau){
  for(let i=0;i<7;i++){
    const col = document.getElementById(`column-${i+1}`);
    col.innerHTML = '';
    tableau[i].forEach((card, idx)=>{
      const cardEl = createCardElement(card);
      cardEl.style.top = `${idx*20}px`;
      col.appendChild(cardEl);
    });
  }
}

function renderStock(stock){
  const stockDiv = document.getElementById('stock');
  stockDiv.innerHTML = '';
  stock.forEach((card, i)=>{
    const div = document.createElement('div');
    div.classList.add('card','face-down');
    div.style.position='absolute';
    div.style.top = `${i*0.5}px`;
    div.style.left = `${i*0.5}px`;
    stockDiv.appendChild(div);
  });
}

function renderWaste(waste){
  const wasteDiv = document.getElementById('waste');
  wasteDiv.innerHTML='';
  const start = Math.max(0, waste.length-3);
  const visible = waste.slice(start);
  visible.forEach((card,i)=>{
    const div = createCardElement(card);
    div.style.position='absolute';
    div.style.left = `${i*20}px`;
    div.style.top='0px';
    div.style.zIndex=i;
    if(i===visible.length-1){ div.setAttribute('draggable',true); }
    wasteDiv.appendChild(div);
  });
}

function renderFoundations(){
  for(let i=0;i<4;i++){
    const fd = document.getElementById(`foundation-${i+1}`);
    fd.innerHTML='';
    foundationPiles[i].forEach(card=>{
      const div = createCardElement(card);
      fd.appendChild(div);
    });
  }
}

function addDragDropListeners(){
  for(let i=1;i<=7;i++){
    const col = document.getElementById(`column-${i}`);
    col.addEventListener('dragover',e=>e.preventDefault());
    col.addEventListener('drop',e=>{
      e.preventDefault();
      if(!draggedCard) return;
      const toColIdx = i-1;
      const toCol = tableau[toColIdx];

      let fromColIdx=-1, fromWaste=false;
      for(let c=0;c<7;c++){
        const idx = tableau[c].indexOf(draggedCard);
        if(idx!==-1){ fromColIdx=c; break; }
      }
      if(fromColIdx===-1){
        const idx = waste.indexOf(draggedCard);
        if(idx!==-1) fromWaste=true;
        else return;
      }

      if(fromWaste) waste = waste.filter(c=>c!==draggedCard);
      else{
        const idx = tableau[fromColIdx].indexOf(draggedCard);
        tableau[fromColIdx].splice(idx);
        if(tableau[fromColIdx].length>0){
          const last = tableau[fromColIdx][tableau[fromColIdx].length-1];
          if(!last.faceUp) last.faceUp=true;
        }
      }

      tableau[toColIdx] = tableau[toColIdx].concat(draggedStack);


      moveHistory.push({
        stack: draggedStack.slice(),
        from: fromWaste?-1:fromColIdx,
        to: toColIdx,
        fromWaste: fromWaste
      });

      renderTableau(tableau);
      renderWaste(waste);
    });
  }
}

document.getElementById('stock').addEventListener('click',()=>{
  if(stock.length===0){
    stock = waste.reverse().map(c=>{ c.faceUp=false; return c; });
    waste=[];
  } else{
    const card = stock.shift();
    card.faceUp=true;
    waste.push(card);

    moveHistory.push({
      stack: [card],
      from: 'stock',
      to: 'waste',
      fromWaste:false
    });
  }
  renderStock(stock);
  renderWaste(waste);
});


function undoLastMove(){
  if(moveHistory.length===0) return;
  const move = moveHistory.pop();


  if(typeof move.to==='number') tableau[move.to].splice(tableau[move.to].length - move.stack.length, move.stack.length);
  else if(move.to==='waste') waste.splice(waste.length - move.stack.length, move.stack.length);


  if(move.from===-1) waste=waste.concat(move.stack);
  else if(move.from==='stock') stock = move.stack.concat(stock);
  else if(typeof move.from==='number') tableau[move.from] = tableau[move.from].concat(move.stack);

  renderTableau(tableau);
  renderWaste(waste);
  renderFoundations();
}

document.getElementById("undoBtn").addEventListener("click", undoLastMove);


window.onload = function(){
  renderTableau(tableau);
  renderStock(stock);
  renderWaste(waste);
  renderFoundations();
  addDragDropListeners();
};