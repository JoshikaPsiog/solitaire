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
let foundationPiles = [[],[],[],[]];
let draggedCard = null;
let draggedStack = [];
let moveHistory = []; 

function createCardElement(card){
  const div = document.createElement('div');
  div.classList.add('card', card.faceUp?'face-up':'face-down');
  div.style.position='relative';
  if(card.faceUp){
    const span = document.createElement('span');
    span.textContent = `${card.number}${card.face}`;
    span.style.color = card.color;
    div.appendChild(span);

    div.setAttribute('draggable', true);
    div.addEventListener('dragstart', (e)=>{
      draggedCard = card;
      for(let col=0;col<7;col++){
        const idx = tableau[col].indexOf(card);
        if(idx!==-1){ draggedStack = tableau[col].slice(idx); return; }
      }
      draggedStack = [card];
    });
    div.addEventListener('dragend', ()=>{
      draggedCard = null;
      draggedStack = [];
    });
  }
  return div;
}
function renderTableau(tableau){
  for(let i=0;i<7;i++){
    const col = document.getElementById(`column-${i+1}`);
    col.innerHTML='';
    tableau[i].forEach(card=>{
      const el = createCardElement(card);
      col.appendChild(el);
    });
  }
  addDragDropListeners();
}

function renderStock(stock){
  const stockDiv=document.getElementById('stock');
  stockDiv.innerHTML='';
  stock.forEach((card,i)=>{
    const div=document.createElement('div');
    div.classList.add('card','face-down');
    div.style.position='absolute';
    div.style.top=`${i*0.5}px`;
    div.style.left=`${i*0.5}px`;
    stockDiv.appendChild(div);
  });
}

function renderWaste(waste){
  const wasteDiv=document.getElementById('waste');
  wasteDiv.innerHTML='';
  wasteDiv.style.position='relative';
  const start = Math.max(0, waste.length-3);
  const visible = waste.slice(start);
  visible.forEach((card,i)=>{
    const div = createCardElement(card);
    div.style.position='absolute';
    div.style.left = `${i*20}px`;
    div.style.top='0px';
    div.style.zIndex=i;
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
    col.addEventListener('dragover', e=>e.preventDefault());
    col.addEventListener('drop', e=>{
      e.preventDefault();
      if(!draggedCard) return;
      const toColIdx=i-1;
      let fromColIdx=-1, fromWaste=false;
      for(let c=0;c<7;c++){
        const idx = tableau[c].indexOf(draggedCard);
        if(idx!==-1){ fromColIdx=c; break; }
      }
      if(fromColIdx===-1){
        if(waste.indexOf(draggedCard)!==-1) fromWaste=true;
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
document.getElementById('stock').addEventListener('click', ()=>{
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
  const lastMove = moveHistory.pop();


  if(typeof lastMove.to==='number'){
    tableau[lastMove.to].splice(tableau[lastMove.to].length - lastMove.stack.length, lastMove.stack.length);
  } else if(lastMove.to==='waste'){
    waste.splice(waste.length - lastMove.stack.length, lastMove.stack.length);
  }

  if(lastMove.from===-1){
    waste = waste.concat(lastMove.stack);
  } else if(lastMove.from==='stock'){
    stock = lastMove.stack.concat(stock);
  } else if(typeof lastMove.from==='number'){
    tableau[lastMove.from] = tableau[lastMove.from].concat(lastMove.stack);
  }

  renderTableau(tableau);
  renderWaste(waste);
  renderFoundations();
}

document.getElementById("undoBtn").addEventListener("click", undoLastMove);

function setupFoundationDrops(){
  for(let i=1;i<=4;i++){
    const fd = document.getElementById(`foundation-${i}`);
    fd.addEventListener('dragover', e=>e.preventDefault());
    fd.addEventListener('drop', e=>{
      e.preventDefault();
      if(!draggedCard) return;
      const pile = foundationPiles[i-1];
      if(pile.length===0 && draggedCard.number!=='A') return;
      if(pile.length>0){
        const top = pile[pile.length-1];
        if(top.face!==draggedCard.face) return;
        if(numbers.indexOf(draggedCard.number)!==numbers.indexOf(top.number)+1) return;
      }
      let removed=false;
      for(let c=0;c<7;c++){
        const idx = tableau[c].indexOf(draggedCard);
        if(idx!==-1){
          tableau[c].splice(idx,1);
          if(tableau[c].length>0){
            const last=tableau[c][tableau[c].length-1];
            if(!last.faceUp) last.faceUp=true;
          }
          removed=true;
          break;
        }
      }
      if(!removed){
        const idx=waste.indexOf(draggedCard);
        if(idx!==-1) waste.splice(idx,1);
      }
      pile.push(draggedCard);
      renderTableau(tableau);
      renderWaste(waste);
      renderFoundations();
      checkWin();
    });
  }
}
let gameWon=false;
function checkWin(){
  if(!gameWon && foundationPiles.every(p=>p.length===13)){
    gameWon=true;
    document.getElementById("winPopup").style.display="flex";
    setTimeout(()=>{
      document.getElementById("winPopup").style.display="none";
      restartGame();
    },5000);
  }
}

function restartGame(){
  gameWon=false;
  document.getElementById("winPopup").style.display="none";
  window.onload=function(){
    renderTableau(tableau);
    renderStock(stock);
    renderWaste(waste);
    renderFoundations();
    setupFoundationDrops();
  }
}
let timerInterval = null;
let secondsElapsed = 0;
 
function updateTimerDisplay() {
    const mins = Math.floor(secondsElapsed / 60);
    const secs = secondsElapsed % 60;
    document.getElementById("timerDisplay").textContent =
        `⏱️ ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
 
function startTimer() {
    if (timerInterval) return;  // Prevent multiple intervals
    timerInterval = setInterval(() => {
        secondsElapsed++;
        updateTimerDisplay();
    }, 1000);
}
 
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}
 
function resetTimer() {
    stopTimer();
    secondsElapsed = 0;
    updateTimerDisplay();
}
 
window.onload = function () {
    // Your existing render calls
    renderTableau(tableau);
    renderStock(stock);
    renderWaste(waste);
    renderFoundations();
    setupFoundationDrops();
    // Timer start/reset here
    resetTimer();
    startTimer();
};
 
function restartGame() {
    gameWon = false;
    document.getElementById("winPopup").style.display = "none";
    resetTimer();
    // You'll want to call your existing initialization logic here:
    window.onload();
    startTimer();
}
 
function checkWin() {
    if (!gameWon && foundationPiles.every(p => p.length === 13)) {
        gameWon = true;
        stopTimer();
        document.getElementById("winPopup").style.display = "flex";
        setTimeout(() => {
            document.getElementById("winPopup").style.display = "none";
            restartGame();
        }, 5000);
    }
}