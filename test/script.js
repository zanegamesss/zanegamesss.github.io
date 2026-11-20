const defaultColors = ["#f44d4d", "#f28830", "#facc15", "#3aef7d", "#3399fe", "#6967f5", "#e879f9"];
let nextColorIndex = 0;

function createPokemon(name, color) {
  const assignedColor = color ?? defaultColors[nextColorIndex % defaultColors.length];
  nextColorIndex += 1;
  return { name, color: assignedColor };
}

function getDefaultTextColor(color) {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(color.slice(offset, offset + 2), 16) / 255);
  const luminance = channels
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  return luminance > 0.42 ? "#111827" : "#ffffff";
}

const choices = [
  createPokemon("Bulbasaur"),
  createPokemon("Charmander"),
  createPokemon("Squirtle"),
];

const canvas = document.querySelector("#wheel");
const context = canvas.getContext("2d");
const wheelButton = document.querySelector("#wheel-button");
const winnerOverlay = document.querySelector("#winner-overlay");
const winnerPokemon = document.querySelector("#winner-pokemon");
const closeWinnerButton = document.querySelector("#close-winner");
const fullTurn = Math.PI * 2;

let rotation = 0;
let isSpinning = false;

function drawWheel() {
  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  const size = Math.round(bounds.width * pixelRatio);
  if (!size) return;

  if (canvas.width !== size || canvas.height !== size) {
    canvas.width = size;
    canvas.height = size;
  }
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const center = bounds.width / 2;
  const radius = center - 4;

  context.clearRect(0, 0, bounds.width, bounds.height);
  if (!choices.length) return;

  const sliceAngle = fullTurn / choices.length;
  context.save();
  context.translate(center, center);
  context.rotate(rotation);

  choices.forEach((pokemon, index) => {
    const startAngle = -Math.PI / 2 + index * sliceAngle;
    const endAngle = startAngle + sliceAngle;
    const middleAngle = startAngle + sliceAngle / 2;

    context.beginPath();
    context.moveTo(0, 0);
    context.arc(0, 0, radius, startAngle, endAngle);
    context.closePath();
    context.fillStyle = pokemon.color;
    context.fill();
    context.strokeStyle = "#ffffff";
    context.lineWidth = 3;
    context.stroke();

    const textRadius = radius * 0.68;
    const maxLabelWidth = 2 * textRadius * Math.sin(sliceAngle / 2) * 0.85;
    const fontSize = Math.max(10, Math.min(19, 230 / choices.length));
    let label = pokemon.name;

    context.font = `800 ${fontSize}px "Avenir Next", "Trebuchet MS", ui-rounded, system-ui, sans-serif`;
    while (context.measureText(label).width > maxLabelWidth && label.length > 3) {
      label = `${label.slice(0, -2)}…`;
    }

    context.save();
    context.translate(
      Math.cos(middleAngle) * textRadius,
      Math.sin(middleAngle) * textRadius,
    );
    context.rotate(middleAngle + Math.PI / 2);
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = getDefaultTextColor(pokemon.color);
    context.fillText(label, 0, 0, maxLabelWidth);
    context.restore();
  });

  context.restore();
}

function showWinner(pokemon) {
  winnerPokemon.textContent = pokemon.name;
  winnerOverlay.hidden = false;
  closeWinnerButton.focus();
}

function closeWinner() {
  winnerOverlay.hidden = true;
  wheelButton.disabled = false;
  wheelButton.focus();
}

function spin() {
  if (isSpinning || !choices.length) return;

  isSpinning = true;
  wheelButton.disabled = true;

  const startRotation = rotation;
  const endRotation = startRotation + fullTurn * (5 + Math.random() * 3);
  const startTime = performance.now();
  const duration = 2500;

  function animate(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const easedProgress = 1 - (1 - progress) ** 4;
    rotation = startRotation + (endRotation - startRotation) * easedProgress;
    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animate);
      return;
    }

    rotation = ((endRotation % fullTurn) + fullTurn) % fullTurn;
    drawWheel();

    const pointerAngle = ((-rotation % fullTurn) + fullTurn) % fullTurn;
    const sliceAngle = fullTurn / choices.length;
    const winnerIndex = Math.floor(pointerAngle / sliceAngle);
    isSpinning = false;
    showWinner(choices[winnerIndex]);
  }

  requestAnimationFrame(animate);
}

wheelButton.addEventListener("click", spin);
closeWinnerButton.addEventListener("click", closeWinner);
winnerOverlay.addEventListener("click", (event) => {
  if (event.target === winnerOverlay) closeWinner();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !winnerOverlay.hidden) closeWinner();
});
new ResizeObserver(drawWheel).observe(canvas);

drawWheel();