const canvas = document.getElementById('table');
const ctx = canvas.getContext('2d');

let DPR = window.devicePixelRatio || 1;
function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * DPR);
    canvas.height = Math.floor(rect.width * 0.4 * DPR);
    canvas.style.height = Math.floor(rect.width * 0.4) + 'px';
    draw();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

function createDeck() {
    const d = [];
    for (let s = 0; s < 4; s++) {
        for (let r = 0; r < 13; r++) {
            d.push({suit: suits[s], rank: r + 1, rIndex: r});
        }
    }
    return shuffle(d);
}
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/* Game state */
let deck = createDeck();
let hand = [];
let held = [false, false, false, false, false];
let chips = 0;
let handsLeft = 3;
let discardsLeft = 2;
let target = 100;

const UI = {
    dealBtn: document.getElementById('dealBtn'),
    discardBtn: document.getElementById('discardBtn'),
    playBtn: document.getElementById('playBtn'),
    resetBtn: document.getElementById('resetBtn'),
    chipsEl: document.getElementById('chips'),
    handsEl: document.getElementById('handsLeft'),
    discardsEl: document.getElementById('discardsLeft'),
    targetEl: document.getElementById('target'),
    logEl: document.getElementById('log')
};

UI.targetEl.textContent = target;

UI.dealBtn.onclick = () => {
    if (hand.length > 0) { log("Already dealt — play or discard"); return; }
    if (deck.length < 5) { deck = createDeck(); log("Shuffled new deck"); }
    hand = deck.splice(0, 5);
    held = [false, false, false, false, false];
    draw();
    log("Dealt 5 cards");
};

UI.discardBtn.onclick = () => {
    if (hand.length === 0) { log("Deal first"); return; }
    if (discardsLeft <= 0) { log("No discards left"); return; }
    const toDiscard = [];
    for (let i = 0; i < 5; i++) if (!held[i]) toDiscard.push(i);
    if (toDiscard.length === 0) { log("Nothing selected to discard (tap card to toggle hold)"); return; }
    for (const i of toDiscard) hand[i] = deck.shift();
    discardsLeft--;
    UI.discardsEl.textContent = discardsLeft;
    draw();
    log("Discarded and drew replacements");
};

UI.playBtn.onclick = () => {
    if (hand.length === 0) { log("Deal first"); return; }
    const score = evaluateHand(hand);
    const earned = score.chips;
    chips += earned;
    handsLeft--;
    UI.chipsEl.textContent = chips;
    UI.handsEl.textContent = handsLeft;
    log(`Played: ${score.name} → +${earned} chips`);
    hand = [];
    if (handsLeft <= 0) {
        if (chips >= target) log("Round cleared! You beat the blind!");
        else log("Round failed. Try Reset");
    }
    draw();
};

UI.resetBtn.onclick = () => {
    deck = createDeck();
    hand = [];
    held = [false, false, false, false, false];
    chips = 0;
    handsLeft = 3;
    discardsLeft = 2;
    UI.chipsEl.textContent = chips;
    UI.handsEl.textContent = handsLeft;
    UI.discardsEl.textContent = discardsLeft;
    log("Reset game");
    draw();
};

function log(msg) {
    const p = document.createElement('div');
    p.textContent = `[${new Date().toLocaleTimeString().slice(3,8)}] ${msg}`;
    UI.logEl.prepend(p);
}

/* Draw cards */
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!hand.length) return;
    const w = canvas.width / 6;
    const h = canvas.height * 0.9;
    for (let i = 0; i < hand.length; i++) {
        const x = i * (w * 1.1) + w * 0.1;
        const y = canvas.height * 0.05;
        drawCard(hand[i], x, y, w, h, held[i]);
    }
}

function drawCard(card, x, y, w, h, isHeld) {
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = isHeld ? "#f0a500" : "#000";
    ctx.lineWidth = 3;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = "#000";
    ctx.font = `${h/5}px sans-serif`;
    ctx.fillText(card.suit, x + 10, y + h/5 + 5);

    // Draw rank or shape
    if (card.rank <= 10) {
        ctx.fillText(card.rank, x + w - 25, y + h/5 + 5);
    } else {
        // J=trapezoid, Q=parallelogram, K=star
        ctx.save();
        ctx.translate(x + w/2, y + h/2);
        ctx.fillStyle = "#f05";
        if (card.rank === 11) drawTrapezoid(ctx, w/2, h/4);
        if (card.rank === 12) drawParallelogram(ctx, w/2, h/4);
        if (card.rank === 13) drawStar(ctx, w/4);
        ctx.restore();
    }
}

function drawTrapezoid(ctx, w, h) {
    ctx.beginPath();
    ctx.moveTo(-w/2, h/2);
    ctx.lineTo(w/2, h/2);
    ctx.lineTo(w*0.3, -h/2);
    ctx.lineTo(-w*0.3, -h/2);
    ctx.closePath();
    ctx.fill();
}

function drawParallelogram(ctx, w, h) {
    ctx.beginPath();
    ctx.moveTo(-w/2, h/2);
    ctx.lineTo(w/2, h/2);
    ctx.lineTo(w/2 - w/4, -h/2);
    ctx.lineTo(-w/2 - w/4, -h/2);
    ctx.closePath();
    ctx.fill();
}

function drawStar(ctx, r) {
    ctx.beginPath();
    for (let i=0;i<5;i++){
        ctx.lineTo(r*Math.cos((18+i*72)*Math.PI/180), -r*Math.sin((18+i*72)*Math.PI/180));
        ctx.lineTo(r/2*Math.cos((54+i*72)*Math.PI/180), -r/2*Math.sin((54+i*72)*Math.PI/180));
    }
    ctx.closePath();
    ctx.fill();
}

/* Toggle hold on click/tap */
canvas.addEventListener('click', e => {
    if (!hand.length) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * DPR;
    const w = canvas.width / 6;
    const h = canvas.height * 0.9;
    for (let i = 0; i < hand.length; i++) {
        const x = i * (w * 1.1) + w * 0.1;
        const y = canvas.height * 0.05;
        if (mx > x && mx < x + w) held[i] = !held[i];
    }
    draw();
});

/* Simple poker evaluator (very basic) */
function evaluateHand(cards) {
    // Count ranks
    const counts = {};
    for (const c of cards) counts[c.rank] = (counts[c.rank] || 0) + 1;
    const vals = Object.values(counts).sort((a,b)=>b-a);
    if (vals[0]===4) return {name:"Four of a Kind", chips:50};
    if (vals[0]===3 && vals[1]===2) return {name:"Full House", chips:25};
    if (vals[0]===3) return {name:"Three of a Kind", chips:10};
    if (vals[0]===2 && vals[1]===2) return {name:"Two Pair", chips:5};
    if (vals[0]===2) return {name:"Pair", chips:2};
    return {name:"High Card", chips:1};
}
