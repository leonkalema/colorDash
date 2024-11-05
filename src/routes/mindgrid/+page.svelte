<script>
    import { onMount } from 'svelte';
import { fade, fly, scale } from 'svelte/transition';
import { elasticOut, bounceOut } from 'svelte/easing';

let canvas;
let ctx;
let containerWidth;
let containerHeight;
let tileSize;
let gridOffset;
let containerRef;

// Game state
let grid = [];
let score = 0;
let turnsLeft = 20;
let timeLeft = 60;
let currentMultiplier = 1;
let gameOver = false;
let gameStarted = false;
let showTutorial = false;
let hintCount = 3;
let message = '';
let isBonus = false;
let timer;
let revealedTiles = new Set();
let animations = [];
let highScore = 0;

// Emojis for tiles
const tileEmojis = {
    points: ['💎', '⭐', '🌟', '🎯', '🎪'],
    multiplier: ['✨', '🌈'],
    trap: ['💣', '⚡', '🌋'],
    bonus: ['🎲', '🎱', '🎮']
};

// Points configuration
const tileValues = {
    points: [50, 100, 150, 200, 250],
    multiplier: [2, 3],
    trap: [-100, -75, -50],
    bonus: [300]
};

// Colors with modern palette
const colors = {
    background: '#fff',
    grid: '#2c2e33',
    unrevealed: '#404349',
    points: '#22c55e',
    multiplier: '#3b82f6',
    trap: '#ef4444',
    bonus: '#8b5cf6',
    text: '#ffffff',
    highlight: '#fbbf24',
    disabled: '#e5e7eb'
};

// Animation class
class TileAnimation {
    constructor(x, y, emoji, value, type) {
        this.x = x;
        this.y = y;
        this.emoji = emoji;
        this.value = value;
        this.type = type;
        this.scale = 0;
        this.alpha = 1;
        this.rotation = 0;
        this.done = false;
    }

    update() {
        if (this.scale < 1) {
            this.scale += 0.15;
            this.rotation += 0.2;
        } else if (this.alpha > 0) {
            this.alpha -= 0.03;
        } else {
            this.done = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x + tileSize/2, this.y + tileSize/2);
        ctx.scale(this.scale, this.scale);
        ctx.rotate(this.rotation);
        
        // Draw emoji
        ctx.fillStyle = colors.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${tileSize/2}px Arial`;
        ctx.fillText(this.emoji, 0, 0);
        
        // Draw value
        ctx.font = `${tileSize/4}px Arial`;
        ctx.fillText(this.value, 0, tileSize/4);
        
        ctx.restore();
    }
}

function startGame() {
    gameStarted = true;
    initializeGame();
}

function initializeGame() {
    calculateDimensions();
    grid = [];
    score = 0;
    turnsLeft = 20;
    timeLeft = 60;
    currentMultiplier = 1;
    gameOver = false;
    hintCount = 3;
    message = '';
    revealedTiles = new Set();
    animations = [];
    
    clearInterval(timer);
    timer = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);

    // Generate grid
    for (let i = 0; i < 6; i++) {
        const row = [];
        for (let j = 0; j < 6; j++) {
            row.push(generateTile());
        }
        grid.push(row);
    }
    
    requestAnimationFrame(render);
}

function generateTile() {
    const types = Object.keys(tileEmojis);
    const type = types[Math.floor(Math.random() * types.length)];
    const emojis = tileEmojis[type];
    const values = tileValues[type];
    const emojiIndex = Math.floor(Math.random() * emojis.length);
    
    return {
        type,
        emoji: emojis[emojiIndex],
        value: values[emojiIndex] || 0
    };
}

function calculateDimensions() {
    if (!containerRef) return;
    
    containerWidth = Math.min(400, containerRef.getBoundingClientRect().width - 32);
    containerHeight = containerWidth;
    
    tileSize = (containerWidth - 24) / 6;
    
    gridOffset = {
        x: 12,
        y: 12
    };
    
    if (canvas) {
        canvas.width = containerWidth;
        canvas.height = containerHeight;
    }
}

function handleCanvasClick(event) {
    if (!gameStarted || gameOver || isBonus) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const col = Math.floor((x - gridOffset.x) / tileSize);
    const row = Math.floor((y - gridOffset.y) / tileSize);
    
    if (row >= 0 && row < 6 && col >= 0 && col < 6) {
        handleTileClick(row, col);
    }
}

function handleTileClick(row, col) {
    if (!gameStarted || gameOver || revealedTiles.has(`${row}-${col}`)) return;

    const tile = grid[row][col];
    revealedTiles.add(`${row}-${col}`);
    
    animations.push(new TileAnimation(
        col * tileSize + gridOffset.x,
        row * tileSize + gridOffset.y,
        tile.emoji,
        tile.value,
        tile.type
    ));
    
    let currentScore = Number(score) || 0;
    let pointValue = Number(tile.value) || 0;
    
    switch (tile.type) {
        case 'points':
            currentScore += pointValue * currentMultiplier;
            message = `+${pointValue * currentMultiplier} 💎`;
            break;
        case 'multiplier':
            currentMultiplier = pointValue;
            message = `${pointValue}x Multiplier! ✨`;
            break;
        case 'trap':
            currentScore += pointValue;
            message = `${pointValue} 💣`;
            break;
        case 'bonus':
            currentScore += pointValue;
            timeLeft += 10;
            message = `+${pointValue} & +10s 🎲`;
            break;
    }

    // Clear message after 1.5 seconds
    setTimeout(() => {
        message = '';
    }, 1500);
    
    score = currentScore;
    highScore = Math.max(Number(highScore), score);
    localStorage.setItem('mindgrid-highscore', highScore.toString());

    turnsLeft--;
    if (turnsLeft <= 0) {
        endGame();
    }
}

function endGame() {
    gameOver = true;
    gameStarted = false;
    clearInterval(timer);
}

function render() {
    if (!ctx) return;
    
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, containerWidth, containerHeight);
    
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
            const x = j * tileSize + gridOffset.x;
            const y = i * tileSize + gridOffset.y;
            
            let fillColor = colors.unrevealed;
            if (gameOver) {
                fillColor = colors.disabled;
            } else if (revealedTiles.has(`${i}-${j}`)) {
                fillColor = colors[grid[i][j].type];
            }
            
            ctx.fillStyle = fillColor;
            ctx.beginPath();
            ctx.roundRect(x, y, tileSize - 4, tileSize - 4, 10);
            ctx.fill();
            
            if (revealedTiles.has(`${i}-${j}`)) {
                const tile = grid[i][j];
                ctx.fillStyle = colors.text;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = `${tileSize/2}px Arial`;
                ctx.fillText(tile.emoji, x + tileSize/2, y + tileSize/2);
            }
        }
    }
    
    animations = animations.filter(anim => !anim.done);
    animations.forEach(anim => {
        anim.update();
        anim.draw(ctx);
    });
    
    requestAnimationFrame(render);
}

onMount(() => {
    highScore = Number(localStorage.getItem('mindgrid-highscore')) || 0;
    ctx = canvas.getContext('2d');
    
    const resizeObserver = new ResizeObserver(() => {
        calculateDimensions();
    });
    resizeObserver.observe(containerRef);
    
    calculateDimensions();
    grid = [];
    for (let i = 0; i < 6; i++) {
        const row = [];
        for (let j = 0; j < 6; j++) {
            row.push(generateTile());
        }
        grid.push(row);
    }
    requestAnimationFrame(render);
    
    return () => {
        clearInterval(timer);
        resizeObserver.disconnect();
    };
});
    </script>
    
    <div class="min-h-screen bg-gray-50 p-4" bind:this={containerRef}>
        <div class="max-w-[400px] mx-auto bg-white rounded-2xl p-6 shadow-lg" 
             in:fly={{ y: 20, duration: 700, delay: 0 }} 
             out:fly={{ y: -20, duration: 500 }}>
            
            <!-- Game Header -->
            <div class="flex justify-between items-center mb-8"
                 in:fly={{ y: -20, duration: 700, delay: 200 }}>
                <h1 class="text-2xl font-bold">MindGrid</h1>
                <button
                    class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full text-sm font-medium transition-all"
                    on:click={() => showTutorial = true}
                >
                    How to Play
                </button>
            </div>
    
            <!-- Game Stats -->
            <div class="grid grid-cols-2 gap-2 mb-4">
                <div class="bg-gray-50 rounded-xl p-2"
                     in:fly={{ x: -20, duration: 700, delay: 400 }}>
                    <div class="text-xs text-gray-500 mb-1">High Score</div>
                    <div class="flex items-baseline gap-1">
                        <span class="text-yellow-500 text-base">🏆</span>
                        <span class="text-lg font-bold">{highScore}</span>
                    </div>
                </div>
                <div class="bg-gray-50 rounded-xl p-2"
                     in:fly={{ x: 20, duration: 700, delay: 400 }}>
                    <div class="text-xs text-gray-500 mb-1">Score</div>
                    <div class="text-lg font-bold">{score}</div>
                </div>
            </div>
    
            <!-- Game Info -->
            <div class="grid grid-cols-2 gap-2 mb-6">
                <div class="bg-gray-50 rounded-xl p-2"
                     in:fly={{ x: -20, duration: 700, delay: 600 }}>
                    <div class="text-xs text-gray-500 mb-1">Turns Left</div>
                    <div class="text-lg font-bold">{turnsLeft}</div>
                </div>
                <div class="bg-gray-50 rounded-xl p-2"
                     in:fly={{ x: 20, duration: 700, delay: 600 }}>
                    <div class="text-xs text-gray-500 mb-1">Time</div>
                    <div class="text-lg font-bold {timeLeft <= 10 ? 'text-red-500' : ''}">{timeLeft}s</div>
                </div>
            </div>
    
            <!-- Game Canvas Area -->
            <div class="relative mb-8"
                 in:scale={{ duration: 700, delay: 800, easing: elasticOut }}>
                
                <!-- Message Display -->
                {#if message && !gameOver}
                <div class="absolute top-4 left-1/2 -translate-x-1/2 z-10"
                     in:scale={{ duration: 300, easing: bounceOut }}>
                    <div class="px-4 py-2 rounded-full text-white font-medium text-sm shadow-lg"
                         style="background-color: {
                            message.includes('Multiplier') ? '#3b82f6' :
                            message.includes('Bonus') ? '#8b5cf6' :
                            message.includes('-') ? '#ef4444' :
                            '#22c55e'
                         }">
                        {message}
                    </div>
                </div>
                {/if}
    
                <canvas
                    bind:this={canvas}
                    class="w-full aspect-square rounded-2xl"
                    class:opacity-50={gameOver}
                    on:click={handleCanvasClick}
                />
    
                <!-- Start Game Overlay -->
                {#if !gameStarted && !gameOver}
                <div class="absolute inset-0 flex items-center justify-center"
                     transition:fade={{ duration: 300 }}>
                    <div class="text-center">
                        <h2 class="text-2xl font-bold mb-6"
                            in:scale={{ duration: 500, easing: elasticOut }}>
                            Ready to Play?
                        </h2>
                        <button
                            class="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium transition-all"
                            on:click={startGame}
                            in:scale={{ delay: 200, duration: 500, easing: elasticOut }}
                        >
                            Start Game
                        </button>
                    </div>
                </div>
                {/if}
    
                <!-- Game Over Overlay -->
                {#if gameOver}
                <div class="absolute inset-0 flex items-center justify-center"
                     transition:fade>
                    <div class="text-center bg-white/90 backdrop-blur-sm p-8 rounded-2xl w-full"
                         in:scale={{ duration: 400, easing: elasticOut }}>
                        <h2 class="text-2xl font-bold mb-2">Game Over!</h2>
                        <p class="text-gray-600 text-lg mb-6">Final Score: {score}</p>
                        {#if score > highScore}
                        <div class="text-yellow-500 font-bold text-lg mb-6"
                             in:scale={{ delay: 200, duration: 400, easing: bounceOut }}>
                            🏆 New High Score!
                        </div>
                        {/if}
                        <button
                            class="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium transition-all"
                            on:click={startGame}
                        >
                            Play Again
                        </button>
                    </div>
                </div>
                {/if}
            </div>
        </div>
    </div>
    
    <!-- Tutorial Modal -->
    {#if showTutorial}
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
         transition:fade={{ duration: 200 }}>
        <div class="bg-white rounded-2xl p-6 max-w-sm w-full"
             in:scale={{ duration: 400, easing: elasticOut }}>
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold">How to Play</h2>
                <button 
                    class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                    on:click={() => showTutorial = false}
                >
                    ✕
                </button>
            </div>
    
            <div class="space-y-6">
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        {#each [['💎', 'Points'], ['✨', 'Multiplier'], ['💣', 'Trap'], ['🎲', 'Bonus']] as [emoji, label]}
                        <div class="bg-gray-50 p-4 rounded-xl text-center"
                             in:fly={{ y: 20, duration: 300, delay: 200 }}>
                            <div class="text-2xl mb-2">{emoji}</div>
                            <div class="text-sm text-gray-600">{label}</div>
                        </div>
                        {/each}
                    </div>
                </div>
            </div>
    
            <button
                class="w-full mt-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium transition-all"
                on:click={() => showTutorial = false}
            >
                Got it!
            </button>
        </div>
    </div>
    {/if}
    
    <style>
        :global(body) {
            @apply bg-gray-50;
        }
    
        canvas {
            touch-action: none;
            -webkit-tap-highlight-color: transparent;
        }
    
        button {
            transition: all 0.2s ease;
        }
    
        button:active {
            transform: scale(0.98);
        }
    </style>