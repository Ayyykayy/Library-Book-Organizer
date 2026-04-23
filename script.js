/**
 * Library Book Organizer - Insertion Sort Logic
 */

// DOM Elements
const bookshelfEl = document.getElementById('bookshelf');
const diffBtns = document.querySelectorAll('.diff-btn');
const resetBtn = document.getElementById('reset-btn');
const hintBtn = document.getElementById('hint-btn');
const autoSolveBtn = document.getElementById('auto-solve-btn');
const timerEl = document.getElementById('timer');
const movesEl = document.getElementById('moves');
const comparisonsEl = document.getElementById('comparisons');
const instructionPrompt = document.getElementById('instruction-prompt');
const stepDescription = document.getElementById('step-description');
const gameStatus = document.getElementById('game-status');

// Modal Elements
const winModal = document.getElementById('win-modal');
const playAgainBtn = document.getElementById('play-again-btn');
const finalTime = document.getElementById('final-time');
const finalMoves = document.getElementById('final-moves');
const finalComp = document.getElementById('final-comp');

// Game State
let books = []; // Array of objects: { id, value, isSorted, el }
let numBooks = 5;
let sortedEndIndex = 0; // Index up to which books are sorted
let currentKeyIndex = 1; // Index of the element currently being sorted
let currentMode = 'IDLE'; // IDLE, PLAYING, AUTO
let moves = 0;
let comparisons = 0;

// Timer State
let timerInterval;
let secondsElapsed = 0;

// Layout Constants
const BOOK_WIDTH = 45; // Including gap visually

// Initialization
function init() {
    setupEventListeners();
}

function setupEventListeners() {
    diffBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            diffBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const level = e.target.dataset.level;
            if (level === 'easy') numBooks = 5;
            if (level === 'medium') numBooks = 8;
            if (level === 'hard') numBooks = 12;
            
            resetGame();
        });
    });

    resetBtn.addEventListener('click', resetGame);
    hintBtn.addEventListener('click', showHint);
    autoSolveBtn.addEventListener('click', toggleAutoSolve);
    playAgainBtn.addEventListener('click', () => {
        winModal.classList.add('hidden');
        resetGame();
    });
}

function generateBooks() {
    books = [];
    bookshelfEl.innerHTML = ''; // Clear DOM
    
    // Generate unique random values
    let values = [];
    while (values.length < numBooks) {
        let val = Math.floor(Math.random() * 90) + 10;
        if (!values.includes(val)) {
            values.push(val);
        }
    }
    
    // Create book objects and DOM elements
    for (let i = 0; i < numBooks; i++) {
        const book = {
            id: `book-${i}`,
            value: values[i],
            isSorted: i === 0, // First book is initially sorted
            el: null
        };
        
        // Calculate height based on value (min height 40px, max height 240px)
        const height = 40 + (book.value / 100) * 200;
        
        const el = document.createElement('div');
        el.className = `book ${book.isSorted ? 'sorted' : 'unsorted'}`;
        el.id = book.id;
        el.style.height = `${height}px`;
        el.innerHTML = `<span class="book-value">${book.value}</span>`;
        
        // Add dropzone element
        const dropzone = document.createElement('div');
        dropzone.className = 'dropzone';
        dropzone.dataset.index = i;
        dropzone.addEventListener('click', () => handleDropzoneClick(i));
        
        bookshelfEl.appendChild(el);
        bookshelfEl.appendChild(dropzone);
        
        book.el = el;
        books.push(book);
    }
    
    updateLayout();
}

function updateLayout() {
    // Calculate total width to center the books
    const totalWidth = numBooks * BOOK_WIDTH;
    const containerWidth = bookshelfEl.clientWidth;
    const startLeft = (containerWidth - totalWidth) / 2;
    
    // Update DOM positions
    const dropzones = document.querySelectorAll('.dropzone');
    
    books.forEach((book, index) => {
        const leftPos = startLeft + (index * BOOK_WIDTH);
        
        // If active, keep the translateY from CSS, just update left
        if (index === currentKeyIndex && currentMode === 'PLAYING') {
            book.el.style.transform = `translateX(${leftPos}px) translateY(-20px)`;
        } else {
            book.el.style.transform = `translateX(${leftPos}px)`;
        }
        
        // Update class
        book.el.className = `book ${book.isSorted ? 'sorted' : 'unsorted'}`;
        if (index === currentKeyIndex && currentMode === 'PLAYING') {
            book.el.classList.add('active');
        }
        
        // Update corresponding dropzone position
        if (dropzones[index]) {
            dropzones[index].style.transform = `translateX(${leftPos}px)`;
        }
    });
}

function startTimer() {
    clearInterval(timerInterval);
    secondsElapsed = 0;
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        secondsElapsed++;
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function updateTimerDisplay() {
    const m = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
    const s = (secondsElapsed % 60).toString().padStart(2, '0');
    timerEl.innerText = `${m}:${s}`;
}

function updateStats() {
    movesEl.innerText = moves;
    comparisonsEl.innerText = comparisons;
}

function resetGame() {
    stopTimer();
    currentMode = 'PLAYING';
    sortedEndIndex = 0;
    currentKeyIndex = 1;
    moves = 0;
    comparisons = 0;
    
    generateBooks();
    startTimer();
    updateStats();
    
    gameStatus.innerText = 'Sorting in Progress';
    gameStatus.style.background = '#e0e7ff';
    gameStatus.style.color = '#4f46e5';
    
    autoSolveBtn.innerText = 'Auto Solve';
    
    setupNextTurn();
}

function setupNextTurn() {
    if (currentKeyIndex >= numBooks) {
        // Game Won
        currentMode = 'IDLE';
        stopTimer();
        gameStatus.innerText = 'Completed!';
        gameStatus.style.background = '#d1fae5';
        gameStatus.style.color = '#059669';
        
        books.forEach(b => {
            b.isSorted = true;
            b.el.classList.remove('active', 'comparing');
        });
        updateLayout();
        hideDropzones();
        
        instructionPrompt.innerText = "Congratulations! You sorted all books.";
        stepDescription.innerHTML = "<strong>Insertion Sort Complete!</strong><br>The array is fully sorted.";
        
        // Show Modal
        setTimeout(() => {
            finalTime.innerText = timerEl.innerText;
            finalMoves.innerText = moves;
            finalComp.innerText = comparisons;
            winModal.classList.remove('hidden');
        }, 800);
        
        return;
    }
    
    // Setup for current key element
    const keyBook = books[currentKeyIndex];
    
    instructionPrompt.innerText = `Place book '${keyBook.value}' into the correct sorted position.`;
    stepDescription.innerHTML = `<strong>Current Key: ${keyBook.value}</strong><br>Compare it with the sorted books to its left and click the correct slot to insert it.`;
    
    updateLayout();
    showValidDropzones();
}

function showValidDropzones() {
    if (currentMode !== 'PLAYING') return;
    
    const dropzones = document.querySelectorAll('.dropzone');
    hideDropzones(); // Reset all
    
    // Show dropzones from index 0 up to currentKeyIndex (inclusive)
    for (let i = 0; i <= currentKeyIndex; i++) {
        dropzones[i].classList.add('active');
    }
}

function hideDropzones() {
    document.querySelectorAll('.dropzone').forEach(dz => dz.classList.remove('active'));
}

async function handleDropzoneClick(targetIndex) {
    if (currentMode !== 'PLAYING') return;
    
    // Determine the correct index where the key element SHOULD be placed
    const correctIndex = findCorrectIndex(currentKeyIndex);
    
    if (targetIndex !== correctIndex) {
        // Wrong move
        instructionPrompt.innerText = "Incorrect position! Compare values again.";
        stepDescription.innerHTML = `<strong>Error!</strong> Book ${books[currentKeyIndex].value} is not smaller/greater than the necessary elements. Try again.`;
        
        // Shake animation
        const dz = document.querySelectorAll('.dropzone')[targetIndex];
        dz.classList.add('shake');
        setTimeout(() => dz.classList.remove('shake'), 400);
        
        // Temporarily highlight the books being incorrectly compared
        // Increment comparisons (penalty)
        comparisons++;
        updateStats();
        return;
    }
    
    // Correct move!
    currentMode = 'ANIMATING';
    hideDropzones();
    
    const targetBookValue = books[currentKeyIndex].value;
    instructionPrompt.innerText = "Correct! Shifting books...";
    stepDescription.innerHTML = `Inserting <strong>${targetBookValue}</strong> at index ${correctIndex}. Shifting larger elements to the right.`;
    
    // Calculate how many comparisons were actually needed for this correct move
    // It's the distance from currentKeyIndex down to targetIndex + 1 (if targetIndex > 0)
    let compsForThisMove = currentKeyIndex - correctIndex;
    if (correctIndex > 0) compsForThisMove++; // one more comparison against the element that is smaller
    comparisons += compsForThisMove;
    moves++;
    updateStats();
    
    await animateInsertion(currentKeyIndex, correctIndex);
    
    // Update state logically
    const bookToMove = books.splice(currentKeyIndex, 1)[0];
    bookToMove.isSorted = true;
    books.splice(correctIndex, 0, bookToMove);
    
    // Set everything up to currentKeyIndex as sorted logically
    for (let i = 0; i <= currentKeyIndex; i++) {
        books[i].isSorted = true;
    }
    
    currentKeyIndex++;
    sortedEndIndex++;
    
    currentMode = 'PLAYING';
    setupNextTurn();
}

function findCorrectIndex(keyIdx) {
    const keyVal = books[keyIdx].value;
    let i = keyIdx - 1;
    while (i >= 0 && books[i].value > keyVal) {
        i--;
    }
    return i + 1;
}

function animateInsertion(fromIdx, toIdx) {
    return new Promise(resolve => {
        // Visual shift
        const bookToMove = books[fromIdx];
        bookToMove.el.style.transition = `transform ${getComputedStyle(document.documentElement).getPropertyValue('--transition-speed')} ease-in-out`;
        
        // Temporarily change data structure to animate correctly
        let tempArray = [...books];
        const b = tempArray.splice(fromIdx, 1)[0];
        tempArray.splice(toIdx, 0, b);
        
        const totalWidth = numBooks * BOOK_WIDTH;
        const containerWidth = bookshelfEl.clientWidth;
        const startLeft = (containerWidth - totalWidth) / 2;
        
        tempArray.forEach((book, idx) => {
            const leftPos = startLeft + (idx * BOOK_WIDTH);
            if (book === bookToMove) {
                // Keep it lifted while moving horizontally
                book.el.style.transform = `translateX(${leftPos}px) translateY(-20px)`;
            } else {
                book.el.style.transform = `translateX(${leftPos}px)`;
            }
        });
        
        setTimeout(() => {
            // Drop the book
            bookToMove.el.classList.remove('active');
            bookToMove.el.classList.add('sorted');
            
            // Re-apply translation without Y offset
            tempArray.forEach((book, idx) => {
                const leftPos = startLeft + (idx * BOOK_WIDTH);
                book.el.style.transform = `translateX(${leftPos}px)`;
            });
            
            setTimeout(resolve, 300);
        }, 500);
    });
}

function showHint() {
    if (currentMode !== 'PLAYING') return;
    
    const correctIndex = findCorrectIndex(currentKeyIndex);
    const dropzones = document.querySelectorAll('.dropzone');
    
    // Highlight correct dropzone
    const dz = dropzones[correctIndex];
    dz.style.backgroundColor = 'rgba(16, 185, 129, 0.4)';
    dz.style.borderStyle = 'solid';
    dz.style.borderColor = '#10b981';
    
    setTimeout(() => {
        dz.style.backgroundColor = '';
        dz.style.borderStyle = '';
        dz.style.borderColor = '';
    }, 1500);
    
    // Add penalty to score
    comparisons += 2;
    updateStats();
}

async function toggleAutoSolve() {
    if (currentMode === 'AUTO') {
        currentMode = 'PLAYING';
        autoSolveBtn.innerText = 'Auto Solve';
        setupNextTurn();
        return;
    }
    
    if (currentMode === 'IDLE' || currentKeyIndex >= numBooks) {
        resetGame();
        await new Promise(r => setTimeout(r, 500)); // Wait for reset
    }
    
    currentMode = 'AUTO';
    autoSolveBtn.innerText = 'Stop Auto';
    hideDropzones();
    
    while (currentMode === 'AUTO' && currentKeyIndex < numBooks) {
        const correctIndex = findCorrectIndex(currentKeyIndex);
        await handleDropzoneClick(correctIndex);
        await new Promise(r => setTimeout(r, 800)); // Delay between steps
    }
}

// Start app
window.addEventListener('DOMContentLoaded', init);
