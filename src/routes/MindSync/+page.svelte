<script>
    import { onMount } from 'svelte';
    import { fade, slide, scale } from 'svelte/transition';
    
    const GRID_SIZE = 4;
    const TIME_PER_TURN = 30;
    const COLORS = [
      '#FF6B6B', // Red
      '#4ECDC4', // Teal
      '#45B7D1', // Blue
      '#96CEB4', // Green
      '#FFEEAD', // Yellow
      '#D4A5A5', // Pink
      '#9B59B6', // Purple
      '#3498DB'  // Dark Blue
    ];
    
    let canvas;
    let ctx;
    let score = 0;
    let highScore = 0;
    let timeLeft = TIME_PER_TURN;
    let timer;
    let gameOver = false;
    let showInstructions = false;
    let animationFrame;
    let gameStarted = false;
    let isTransitioning = false;
    
    let playerGrid = [];
    let targetGrid = [];
    let selectedCell = null;
    let animations = [];
    let lastMatchCount = 0;
    
    class Particle {
        constructor(x, y, color, type = 'basic') {
            this.x = x;
            this.y = y;
            this.type = type;
            this.color = color;
            this.originalSize = Math.random() * 4 + 2;
            this.size = this.originalSize;
            this.speedX = (Math.random() - 0.5) * (type === 'explode' ? 12 : 6);
            this.speedY = (Math.random() - 0.5) * (type === 'explode' ? 12 : 6);
            this.gravity = 0.15;
            this.life = 1;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.2;
            
            if (type === 'sparkle') {
                this.decay = 0.02;
                this.speedX *= 0.5;
                this.speedY *= 0.5;
                this.pulseSpeed = Math.random() * 0.1 + 0.05;
            } else if (type === 'explode') {
                this.decay = Math.random() * 0.02 + 0.02;
            } else {
                this.decay = Math.random() * 0.03 + 0.015;
            }
        }

        update() {
            this.speedY += this.gravity;
            this.x += this.speedX;
            this.y += this.speedY;
            this.rotation += this.rotationSpeed;
            
            if (this.type === 'sparkle') {
                this.size = this.originalSize * (1 + Math.sin(Date.now() * this.pulseSpeed) * 0.5);
            }
            
            this.life -= this.decay;
            
            if (this.type === 'explode' && this.y > canvas.height) {
                this.y = canvas.height;
                this.speedY *= -0.6;
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = this.life;
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            
            if (this.type === 'sparkle') {
                ctx.fillStyle = `rgba(${this.color}, ${this.life})`;
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i * Math.PI * 2) / 5;
                    const x = Math.cos(angle) * this.size;
                    const y = Math.sin(angle) * this.size;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
            } else {
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
                gradient.addColorStop(0, `rgba(${this.color}, ${this.life})`);
                gradient.addColorStop(1, `rgba(${this.color}, 0)`);
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }

        isDead() {
            return this.life <= 0;
        }
    }

    class Animation {
        constructor(x, y, type, duration = 500) {
            this.x = x;
            this.y = y;
            this.type = type;
            this.startTime = Date.now();
            this.duration = duration;
        }
        
        isComplete() {
            return Date.now() - this.startTime > this.duration;
        }
        
        draw(ctx) {
            const progress = Math.min(Math.max((Date.now() - this.startTime) / this.duration, 0), 1);
            if (this.type === 'match') {
                ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * (1 - progress)})`;
                ctx.beginPath();
                const radius = Math.max(30 * progress, 0);
                ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 * (1 - progress)})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                const outerRadius = Math.max(35 * progress, 0);
                ctx.arc(this.x, this.y, outerRadius, 0, Math.PI * 2);
                ctx.stroke();
            } else if (this.type === 'select') {
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * (1 - progress)})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                const selectRadius = Math.max(20 * (1 - progress), 0);
                ctx.arc(this.x, this.y, selectRadius, 0, Math.PI * 2);
                ctx.stroke();
            } else if (this.type === 'swap') {
                ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * (1 - progress)})`;
                ctx.beginPath();
                const swapRadius = Math.max(15 * (1 - progress), 0);
                ctx.arc(this.x, this.y, swapRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    let particles = [];
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let selectedCellTouch = null;

    onMount(() => {
        loadHighScore();
        
        setTimeout(() => {
            initializeCanvas();
            draw();
        }, 100);

        return () => {
            if (timer) clearInterval(timer);
            if (animationFrame) cancelAnimationFrame(animationFrame);
        };
    });

    function loadHighScore() {
        const savedHighScore = localStorage.getItem('mindsync-highscore');
        if (savedHighScore) {
            highScore = parseInt(savedHighScore);
        }
    }

    function saveHighScore() {
        localStorage.setItem('mindsync-highscore', highScore.toString());
    }

    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }

    function initializeCanvas() {
        if (!canvas) return;
        
        const maxWidth = Math.min(canvas.parentElement.clientWidth, 400);
        const playerCellSize = Math.min((maxWidth - 32) / (GRID_SIZE + 1), 50);
        const targetCellSize = playerCellSize * 0.6;
        
        canvas.width = playerCellSize * (GRID_SIZE + 1);
        canvas.height = targetCellSize * (GRID_SIZE + 1) + playerCellSize * (GRID_SIZE + 1);
        ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
    }

    function createRandomGrid() {
        const totalCells = GRID_SIZE * GRID_SIZE;
        const colorsNeeded = Math.min(COLORS.length, Math.ceil(totalCells / 2));
        
        let grid = [];
        for (let i = 0; i < colorsNeeded; i++) {
            const count = Math.floor(totalCells / colorsNeeded);
            grid = grid.concat(Array(count).fill(COLORS[i]));
        }
        
        while (grid.length < totalCells) {
            grid.push(COLORS[Math.floor(Math.random() * colorsNeeded)]);
        }
        
        for (let i = grid.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [grid[i], grid[j]] = [grid[j], grid[i]];
        }
        
        return grid;
    }

    function createPlayerGrid(targetGrid) {
        let playerGrid = [...targetGrid];
        let attempts = 0;
        let matches;
        
        do {
            for (let i = playerGrid.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [playerGrid[i], playerGrid[j]] = [playerGrid[j], playerGrid[i]];
            }
            
            matches = 0;
            for (let i = 0; i < playerGrid.length; i++) {
                if (playerGrid[i] === targetGrid[i]) matches++;
            }
            attempts++;
        } while (matches > playerGrid.length / 3 && attempts < 10);
        
        return playerGrid;
    }

    function createCelebrationParticles(x, y, color, type = 'basic', count = 20) {
        const rgb = hexToRgb(color);
        for (let i = 0; i < count; i++) {
            particles.push(new Particle(x, y, `${rgb.r}, ${rgb.g}, ${rgb.b}`, type));
        }
        if (!animationFrame) {
            animationFrame = requestAnimationFrame(draw);
        }
    }

    function celebrateMatch(x, y, color) {
        createCelebrationParticles(x, y, color, 'basic', 10);
        createCelebrationParticles(x, y, color, 'sparkle', 5);
    }

    function celebrateLevelComplete() {
        isTransitioning = true;
        const playerCellSize = canvas.width / (GRID_SIZE + 1);
        const targetCellSize = playerCellSize * 0.6;
        const gridArea = {
            x: playerCellSize * 0.5,
            y: targetCellSize * (GRID_SIZE + 1.2),
            width: playerCellSize * GRID_SIZE,
            height: playerCellSize * GRID_SIZE
        };

        // Create celebratory particles
        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
                const x = gridArea.x + j * playerCellSize + playerCellSize/2;
                const y = gridArea.y + i * playerCellSize + playerCellSize/2;
                const color = COLORS[Math.floor(Math.random() * COLORS.length)];
                createCelebrationParticles(x, y, color, 'explode', 8);
                createCelebrationParticles(x, y, color, 'sparkle', 5);
            }
        }

        // Show level complete overlay
        const timeBonus = Math.ceil(timeLeft * 10);
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        const showOverlay = () => {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.fillText('Level Complete!', centerX, centerY - 40);
            
            ctx.font = '18px Arial';
            ctx.fillStyle = '#4CAF50';
            ctx.fillText(`+${timeBonus} Time Bonus!`, centerX, centerY);
            
            ctx.restore();
        };

        let overlayDuration = 0;
        const animateOverlay = () => {
            draw();
            showOverlay();
            overlayDuration += 16;
            
            if (overlayDuration < 2000) {
                requestAnimationFrame(animateOverlay);
            } else {
                isTransitioning = false;
                nextLevel();
            }
        };
        
        animateOverlay();
    }

    function addCellAnimation(index, type) {
        const playerCellSize = canvas.width / (GRID_SIZE + 1);
        const targetCellSize = playerCellSize * 0.6;
        const x = playerCellSize * 0.5 + (index % GRID_SIZE) * playerCellSize;
        const y = targetCellSize * (GRID_SIZE + 1.2) + Math.floor(index / GRID_SIZE) * playerCellSize;
        animations.push(new Animation(x + playerCellSize/2, y + playerCellSize/2, type));
        
        if (!animationFrame) {
            animationFrame = requestAnimationFrame(draw);
        }
    }

    function draw() {
        if (!ctx) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const playerCellSize = canvas.width / (GRID_SIZE + 1);
        const targetCellSize = playerCellSize * 0.6;
        
        const targetOffsetX = (canvas.width - (targetCellSize * GRID_SIZE)) / 2;
        
        if (gameStarted) {
            ctx.fillStyle = '#666666';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Target Pattern:', canvas.width / 2, targetCellSize * 0.5);
            
            const currentMatches = countMatches();
            const totalCells = GRID_SIZE * GRID_SIZE;
            ctx.fillStyle = '#666666';
            ctx.font = '12px Arial';
            ctx.fillText(`${currentMatches}/${totalCells} matched`, canvas.width / 2, targetCellSize * (GRID_SIZE + 0.8));
            
            drawGrid(targetGrid, targetCellSize, targetCellSize, false, targetOffsetX);
            
            ctx.fillStyle = '#E5E7EB';
            ctx.fillRect(0, targetCellSize * (GRID_SIZE + 1), canvas.width, 2);
            
            drawGrid(playerGrid, playerCellSize, targetCellSize * (GRID_SIZE + 1.2), true);
        }
        
        animations = animations.filter(anim => !anim.isComplete());
        animations.forEach(anim => anim.draw(ctx));
        
        particles = particles.filter(particle => {
            particle.update();
            particle.draw(ctx);
            return !particle.isDead();
        });
        
        if (animations.length > 0 || particles.length > 0) {
            animationFrame = requestAnimationFrame(draw);
        } else {
            animationFrame = null;
        }
    }

    function drawGrid(grid, cellSize, startY, isPlayer = false, offsetX = cellSize * 0.5) {
        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
                const x = offsetX + j * cellSize;
                const y = startY + i * cellSize;
                const index = i * GRID_SIZE + j;
                
                ctx.fillStyle = grid[index];
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = isPlayer ? 2 : 1;
                
                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(x, y, cellSize - 2, cellSize - 2, isPlayer ? 6 : 4);
                } else {
                    ctx.rect(x, y, cellSize - 2, cellSize - 2);
                }
                ctx.fill();
                ctx.stroke();
                
                if (isPlayer && selectedCell === index) {
                    ctx.strokeStyle = '#FFF';
                    ctx.lineWidth = 4;
                    ctx.stroke();
                }
                
                if (isPlayer && grid[index] === targetGrid[index]) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                    ctx.fill();
                    
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.font = `${cellSize * 0.4}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('✓', x + cellSize/2, y + cellSize/2);
                }
            }
        }
    }

    function nextLevel() {
        if (isTransitioning) return;
        
        const oldGrid = [...playerGrid];
        targetGrid = createRandomGrid();
        playerGrid = createPlayerGrid(targetGrid);
        timeLeft = Math.max(TIME_PER_TURN - Math.floor(score / 100), 10);
        lastMatchCount = 0;
        
        // Animate transition to new level
        let progress = 0;
        const playerCellSize = canvas.width / (GRID_SIZE + 1);
        const targetCellSize = playerCellSize * 0.6;
        
        const animateTransition = () => {
            progress += 0.05;
            if (progress <= 1) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Draw the target pattern
                const targetOffsetX = (canvas.width - (targetCellSize * GRID_SIZE)) / 2;
                drawGrid(targetGrid, targetCellSize, targetCellSize, false, targetOffsetX);
                
                // Draw old grid fading out
                ctx.globalAlpha = 1 - progress;
                drawGrid(oldGrid, playerCellSize, targetCellSize * (GRID_SIZE + 1.2), true);
                
                // Draw new grid fading in
                ctx.globalAlpha = progress;
                drawGrid(playerGrid, playerCellSize, targetCellSize * (GRID_SIZE + 1.2), true);
                
                ctx.globalAlpha = 1;
                requestAnimationFrame(animateTransition);
            } else {
                draw();
            }
        };
        
        animateTransition();
    }

    function handleCellClick(index) {
        if (!ctx || gameOver || !gameStarted || isTransitioning) return;
        
        if (selectedCell === null) {
            selectedCell = index;
            addCellAnimation(index, 'select');
            draw();
        } else {
            const previousMatches = countMatches();
            
            // Animate the swap
            const cell1 = selectedCell;
            const cell2 = index;
            let progress = 0;
            let isAnimating = true;
            
            const animateSwap = () => {
                if (!isAnimating) return;
                
                progress += 0.1;
                if (progress <= 1) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    
                    const playerCellSize = canvas.width / (GRID_SIZE + 1);
                    const targetCellSize = playerCellSize * 0.6;
                    const targetOffsetX = (canvas.width - (targetCellSize * GRID_SIZE)) / 2;
                    
                    // Draw target grid
                    drawGrid(targetGrid, targetCellSize, targetCellSize, false, targetOffsetX);
                    
                    // Draw player grid with animated swap
                    const tempGrid = [...playerGrid];
                    if (progress < 1) {
                        [tempGrid[cell1], tempGrid[cell2]] = [tempGrid[cell2], tempGrid[cell1]];
                    }
                    
                    drawGrid(tempGrid, playerCellSize, targetCellSize * (GRID_SIZE + 1.2), true);
                    
                    requestAnimationFrame(animateSwap);
                } else {
                    isAnimating = false;
                    
                    [playerGrid[cell1], playerGrid[cell2]] = [playerGrid[cell2], playerGrid[cell1]];
                    addCellAnimation(cell1, 'swap');
                    addCellAnimation(cell2, 'swap');
                    
                    const newMatches = countMatches();
                    if (newMatches > previousMatches) {
                        score += (newMatches - previousMatches) * 5;
                        const playerCellSize = canvas.width / (GRID_SIZE + 1);
                        const targetCellSize = playerCellSize * 0.6;
                        
                        for(let i = 0; i < playerGrid.length; i++) {
                            if(playerGrid[i] === targetGrid[i] && i !== cell1 && i !== cell2) {
                                const x = playerCellSize * 0.5 + (i % GRID_SIZE) * playerCellSize + playerCellSize/2;
                                const y = targetCellSize * (GRID_SIZE + 1.2) + Math.floor(i / GRID_SIZE) * playerCellSize + playerCellSize/2;
                                celebrateMatch(x, y, playerGrid[i]);
                                addCellAnimation(i, 'match');
                            }
                        }
                    }
                    
                    selectedCell = null;
                    playerGrid = [...playerGrid];
                    checkForWin();
                    draw();
                }
            };
            
            animateSwap();
        }
    }

    function handleClick(event) {
        if (!ctx || gameOver || !gameStarted) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const cellInfo = getCellFromCoordinates(x, y);
        if (cellInfo) {
            handleCellClick(cellInfo.index);
        }
    }

    function countMatches() {
        let matches = 0;
        for (let i = 0; i < playerGrid.length; i++) {
            if (playerGrid[i] === targetGrid[i]) matches++;
        }
        return matches;
    }
    
    function checkForWin() {
        const matches = countMatches();
        if (matches === playerGrid.length) {
            score += Math.ceil(timeLeft * 10);
            if (score > highScore) {
                highScore = score;
                saveHighScore();
            }
            celebrateLevelComplete();
        }
    }
    
    function startNewGame() {
        if (timer) clearInterval(timer);
        if (animationFrame) cancelAnimationFrame(animationFrame);
        
        gameStarted = true;
        targetGrid = createRandomGrid();
        playerGrid = createPlayerGrid(targetGrid);
        score = 0;
        timeLeft = TIME_PER_TURN;
        gameOver = false;
        selectedCell = null;
        animations = [];
        lastMatchCount = 0;
        particles = [];
        isTransitioning = false;
        
        timer = setInterval(() => {
            if (!isTransitioning) {
                timeLeft--;
                if (timeLeft <= 0) {
                    endGame();
                }
            }
        }, 1000);
        
        draw();
    }
    
    function endGame() {
        gameOver = true;
        if (timer) clearInterval(timer);
        
        if (score > highScore) {
            highScore = score;
            saveHighScore();
            
            // Celebration particles for new high score
            for(let i = 0; i < 150; i++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const color = COLORS[Math.floor(Math.random() * COLORS.length)];
                createCelebrationParticles(x, y, color, 'sparkle');
            }
        }
    }
    
    function handleTouchStart(event) {
        event.preventDefault();
        if (!ctx || gameOver || !gameStarted) return;
        
        const touch = event.touches[0];
        const rect = canvas.getBoundingClientRect();
        touchStartX = touch.clientX - rect.left;
        touchStartY = touch.clientY - rect.top;
        touchStartTime = Date.now();
        
        const cellInfo = getCellFromCoordinates(touchStartX, touchStartY);
        if (cellInfo) {
            selectedCellTouch = cellInfo.index;
            handleCellClick(cellInfo.index);
        }
    }

    function handleTouchMove(event) {
        event.preventDefault();
    }

    function handleTouchEnd(event) {
        event.preventDefault();
        selectedCellTouch = null;
    }

    function getCellFromCoordinates(x, y) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const scaledX = x * scaleX;
        const scaledY = y * scaleY;
        
        const playerCellSize = canvas.width / (GRID_SIZE + 1);
        const targetCellSize = playerCellSize * 0.6;
        const playerGridStartY = targetCellSize * (GRID_SIZE + 1.2);
        
        if (scaledY >= playerGridStartY) {
            const gridX = Math.floor((scaledX - playerCellSize * 0.5) / playerCellSize);
            const gridY = Math.floor((scaledY - playerGridStartY) / playerCellSize);
            
            if (gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE) {
                return {
                    index: gridY * GRID_SIZE + gridX,
                    x: gridX,
                    y: gridY
                };
            }
        }
        return null;
    }
    
    let resizeTimer;
    function handleResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            initializeCanvas();
            draw();
        }, 250);
    }
</script>

<main class="min-h-screen bg-gray-100 p-2">
    <div class="max-w-md mx-auto relative">
        <header class="bg-white rounded-lg shadow-sm p-4 mb-3">
            <div class="text-center mb-4">
                <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
                    MindSync
                </h1>
                <p class="text-gray-600 text-sm leading-relaxed max-w-sm mx-auto">
                    A pattern-matching puzzle game that challenges your memory and strategic thinking
                </p>
            </div>

            {#if gameStarted}
                <div class="flex justify-between items-center text-sm border-t pt-3">
                    <div class="space-y-1">
                        <div class="font-semibold text-lg">Score: {score}</div>
                        <div class="text-gray-600">Best: {highScore}</div>
                    </div>
                    
                    <div class="text-xl font-bold text-center">
                        <div class={`${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-gray-700'}`}>
                            {timeLeft}s
                        </div>
                    </div>
                    
                    <div class="space-x-2">
                        <button
                            class="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors font-medium text-sm"
                            on:click={() => showInstructions = !showInstructions}
                        >
                            {showInstructions ? 'Hide Help' : 'How to Play'}
                        </button>
                        <button
                            class="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-medium text-sm"
                            on:click={startNewGame}
                        >
                            New Game
                        </button>
                    </div>
                </div>
            {/if}
        </header>

        {#if showInstructions}
            <div class="bg-white rounded-lg shadow-sm p-4 mb-3" transition:slide>
                <h2 class="font-bold text-lg mb-3">How to Play:</h2>
                <ul class="space-y-2.5 text-gray-700">
                    <li class="flex items-start">
                        <span class="mr-2 text-lg">🎯</span>
                        <span>Study the target pattern at the top and recreate it in your grid below</span>
                    </li>
                    <li class="flex items-start">
                        <span class="mr-2 text-lg">🔄</span>
                        <span>Click two cells to swap their colors and match the pattern</span>
                    </li>
                    <li class="flex items-start">
                        <span class="mr-2 text-lg">⏱️</span>
                        <span>Complete the pattern before time runs out - work fast for bonus points!</span>
                    </li>
                    <li class="flex items-start">
                        <span class="mr-2 text-lg">⭐</span>
                        <span>Score more points by making matches quickly and completing levels</span>
                    </li>
                </ul>
            </div>
        {/if}

        <div class="bg-white rounded-lg shadow-sm p-3 relative">
            <canvas
                bind:this={canvas}
                on:click={handleClick}
                on:touchstart={handleTouchStart}
                on:touchmove={handleTouchMove}
                on:touchend={handleTouchEnd}
                class="w-full"
            ></canvas>

            {#if !gameStarted}
                <div 
                    class="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-blue-500 to-purple-600 rounded-lg"
                    transition:fade={{ duration: 300 }}
                >
                    <div 
                        class="text-center text-white p-6 space-y-6"
                        transition:scale={{ duration: 300 }}
                    >
                        <div class="space-y-2">
                            <h2 class="text-4xl font-bold">Welcome to MindSync!</h2>
                            <p class="text-lg text-blue-100">Train your brain with this pattern-matching challenge</p>
                        </div>
                        
                        {#if highScore > 0}
                            <p class="text-xl text-blue-200">Your Best Score: {highScore}</p>
                        {/if}
                        
                        <div class="space-y-3">
                            <button
                                class="w-full px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transform hover:scale-105 transition-all duration-200 shadow-lg text-xl font-bold"
                                on:click={startNewGame}
                            >
                                Start Game
                            </button>
                            
                            <button
                                class="px-6 py-3 text-white hover:bg-white/10 rounded-lg transition-colors text-lg"
                                on:click={() => showInstructions = true}
                            >
                                How to Play
                            </button>
                        </div>
                    </div>
                </div>
            {/if}

            {#if gameOver}
                <div 
                    class="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-85"
                    transition:fade={{ duration: 300 }}
                >
                    <div 
                        class="text-center text-white space-y-4"
                        transition:scale={{ duration: 300, delay: 300 }}
                    >
                        <h2 class="text-4xl font-bold mb-4">Game Over!</h2>
                        <div class="space-y-2 mb-6">
                            <p class="text-2xl">Final Score: <span class="text-blue-400">{score}</span></p>
                            <p class="text-xl">High Score: <span class="text-purple-400">{highScore}</span></p>
                        </div>
                        <button
                            class="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-200 shadow-lg text-lg font-medium"
                            on:click={startNewGame}
                        >
                            Play Again
                        </button>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</main>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        -webkit-tap-highlight-color: transparent;
    }

    canvas {
        touch-action: none;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
    }

    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }

    :global(.animate-pulse) {
        animation: pulse 2s infinite;
    }

    :global(.bg-clip-text) {
        -webkit-background-clip: text;
        background-clip: text;
    }

    :global(.transition-all) {
        transition-property: all;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }

    :global(.transform) {
        transform: translateZ(0);
    }

    :global(.hover\:scale-105:hover) {
        transform: scale(1.05);
    }

    :global(.hover\:bg-white\/10:hover) {
        background-color: rgb(255 255 255 / 0.1);
    }
</style>