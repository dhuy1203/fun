const canvas = document.getElementById("maze");
const ctx = canvas.getContext("2d");
const cols = 15;  // Tối ưu số cột cho phiên bản mobile
const rows = 15;  // Tối ưu số hàng cho phiên bản mobile
const cellSize = Math.min(canvas.width / cols, canvas.height / rows);

const message = document.getElementById("message");
const gift = document.getElementById("gift");
const hintButton = document.getElementById("hintButton");
const resetButton = document.getElementById("resetButton");

let hintPath = [];  // Đường đi gợi ý
let hasHint = false;  // Trạng thái gợi ý

// Lưu trữ mê cung
const grid = [];
const stack = [];

// Tọa độ của viên bi (người chơi)
let playerX = 0;
let playerY = 0;

// Tọa độ của điểm kết thúc
const endX = cols - 1;
const endY = rows - 1;

// Cell Object
class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.visited = false;

        // Các tường của ô
        this.walls = {
            top: true,
            right: true,
            bottom: true,
            left: true
        };
    }

    // Vẽ ô
    draw() {
        const x = this.x * cellSize;
        const y = this.y * cellSize;

        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;

        if (this.walls.top) ctx.strokeRect(x, y, cellSize, 1);
        if (this.walls.right) ctx.strokeRect(x + cellSize, y, 1, cellSize);
        if (this.walls.bottom) ctx.strokeRect(x, y + cellSize, cellSize, 1);
        if (this.walls.left) ctx.strokeRect(x, y, 1, cellSize);
    }

    // Kiểm tra các ô lân cận chưa thăm
    checkNeighbors() {
        const neighbors = [];

        const top = grid[index(this.x, this.y - 1)];
        const right = grid[index(this.x + 1, this.y)];
        const bottom = grid[index(this.x, this.y + 1)];
        const left = grid[index(this.x - 1, this.y)];

        if (top && !top.visited) neighbors.push(top);
        if (right && !right.visited) neighbors.push(right);
        if (bottom && !bottom.visited) neighbors.push(bottom);
        if (left && !left.visited) neighbors.push(left);

        if (neighbors.length > 0) {
            const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
            return randomNeighbor;
        } else {
            return undefined;
        }
    }

    // Loại bỏ tường giữa 2 ô
    removeWalls(next) {
        const x = this.x - next.x;
        const y = this.y - next.y;

        if (x === 1) {
            this.walls.left = false;
            next.walls.right = false;
        } else if (x === -1) {
            this.walls.right = false;
            next.walls.left = false;
        }

        if (y === 1) {
            this.walls.top = false;
            next.walls.bottom = false;
        } else if (y === -1) {
            this.walls.bottom = false;
            next.walls.top = false;
        }
    }
}

// Lấy chỉ số trong mảng lưới
function index(x, y) {
    if (x < 0 || y < 0 || x >= cols || y >= rows) {
        return -1;
    }
    return x + y * cols;
}

// Khởi tạo lưới
function createGrid() {
    grid.length = 0; // Xóa lưới cũ
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const cell = new Cell(x, y);
            grid.push(cell);
        }
    }
}

// Tạo mê cung nhanh hơn không cần hiệu ứng
function generateMazeFast() {
    console.log("Generating a new maze..."); // Thêm dòng này để kiểm tra
    const current = grid[0];  // Điểm bắt đầu
    current.visited = true;
    stack.push(current);

    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const next = current.checkNeighbors();

        if (next) {
            next.visited = true;
            stack.push(next);
            current.removeWalls(next);
        } else {
            stack.pop();
        }
    }

    drawMaze();  // Vẽ mê cung sau khi hoàn thành
}

// Vẽ mê cung
function drawMaze() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    grid.forEach(cell => cell.draw());

    // Vẽ điểm bắt đầu (Start)
    ctx.fillStyle = "green";
    ctx.fillRect(playerX * cellSize, playerY * cellSize, cellSize, cellSize);

    // Vẽ điểm kết thúc (End)
    ctx.fillStyle = "red";
    ctx.fillRect(endX * cellSize, endY * cellSize, cellSize, cellSize);

    // Vẽ viên bi của người chơi
    ctx.fillStyle = "blue";
    ctx.beginPath();
    ctx.arc((playerX + 0.5) * cellSize, (playerY + 0.5) * cellSize, cellSize / 4, 0, Math.PI * 2);
    ctx.fill();

    // Vẽ gợi ý đường đi nếu có
    if (hintPath.length > 0 && hasHint) {
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo((playerX + 0.5) * cellSize, (playerY + 0.5) * cellSize);
        hintPath.forEach(step => {
            ctx.lineTo((step.x + 0.5) * cellSize, (step.y + 0.5) * cellSize);
        });
        ctx.stroke();
    }
}

// Di chuyển người chơi
function movePlayer(x, y) {
    const current = grid[index(playerX, playerY)];

    if (x === -1 && !current.walls.left) playerX--;
    if (x === 1 && !current.walls.right) playerX++;
    if (y === -1 && !current.walls.top) playerY--;
    if (y === 1 && !current.walls.bottom) playerY++;

    // Kiểm tra xem người chơi đã đến điểm kết thúc chưa
    if (playerX === endX && playerY === endY) {
        displayWinMessage();
    }

    drawMaze();
}

// Hiển thị thông báo khi thắng và xuất hiện hộp quà
function displayWinMessage() {
    message.style.display = "block";  // Hiển thị thông báo
    gift.style.display = "block";     // Hiển thị hộp quà

    // Thêm sự kiện nhấn vào hộp quà để mở trang mới
    gift.onclick = function() {
        bouncyGifts(); // Gọi hàm bắn ra hộp quà
    };
}

// Hàm bắn ra nhiều hộp quà
function bouncyGifts() {
    // Rung màn hình
    document.body.classList.add('shake');

    // Tạo và bắn ra nhiều hộp quà
    for (let i = 0; i < 100; i++) {
        const newGift = document.createElement('img');
        newGift.src = "image/tym.png"; // Đường dẫn tới hình ảnh của hộp quà
        newGift.className = 'gift';
        newGift.style.top = Math.random() * window.innerHeight + 'px';
        newGift.style.left = Math.random() * window.innerWidth + 'px';
        newGift.style.opacity = '1';
        document.body.appendChild(newGift);

        // Tạo hiệu ứng di chuyển
        setTimeout(() => {
            newGift.style.transform = 'scale(0)'; // Nhỏ lại hộp quà
            newGift.style.opacity = '0'; // Ẩn hộp quà
            window.location.href = 'gift.html';
        }, 1000);

        // Xóa hộp quà sau khi di chuyển
        setTimeout(() => {
            document.body.removeChild(newGift);
            window.location.href = 'gift.html';
        }, 1000);
    }

    // Xóa hiệu ứng rung sau 200ms
    setTimeout(() => {
        document.body.classList.remove('shake');
        window.location.href = 'gift.html';
    }, 1000);
}

// Bắt sự kiện phím di chuyển
window.addEventListener("keydown", (e) => {
    switch (e.key) {
        case "ArrowUp":
            movePlayer(0, -1);
            break;
        case "ArrowDown":
            movePlayer(0, 1);
            break;
        case "ArrowLeft":
            movePlayer(-1, 0);
            break;
        case "ArrowRight":
            movePlayer(1, 0);
            break;
    }
});

// Hàm hiển thị đường đi gợi ý
function findHintPath() {
    hintPath = [];
    hasHint = true;

    let queue = [[{ x: playerX, y: playerY }]];
    let visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    visited[playerY][playerX] = true;

    while (queue.length > 0) {
        const path = queue.shift();
        const current = path[path.length - 1];

        if (current.x === endX && current.y === endY) {
            hintPath = path;
            break;
        }

        const currentCell = grid[index(current.x, current.y)];

        // Di chuyển đến các ô hợp lệ và chưa thăm
        const neighbors = [
            { x: current.x, y: current.y - 1, wall: "top" },    // Lên
            { x: current.x + 1, y: current.y, wall: "right" },  // Phải
            { x: current.x, y: current.y + 1, wall: "bottom" }, // Xuống
            { x: current.x - 1, y: current.y, wall: "left" }    // Trái
        ];

        neighbors.forEach(neighbor => {
            if (neighbor.x >= 0 && neighbor.x < cols && neighbor.y >= 0 && neighbor.y < rows) {
                const neighborCell = grid[index(neighbor.x, neighbor.y)];
                if (!visited[neighbor.y][neighbor.x] && !currentCell.walls[neighbor.wall]) {
                    visited[neighbor.y][neighbor.x] = true;
                    queue.push([...path, { x: neighbor.x, y: neighbor.y }]);
                }
            }
        });
    }

    drawMaze();
}

// Reset trò chơi
resetButton.addEventListener("click", () => {
    playerX = 0;
    playerY = 0;
    hintPath = [];
    hasHint = false;
    message.style.display = "none"; // Ẩn thông báo khi reset
    gift.style.display = "none"; // Ẩn hộp quà khi reset
    generateMazeFast();
});

// Thay đổi chức năng của nút "Hint"
hintButton.addEventListener("click", () => {
    if (hasHint) {
        // Nếu đã có gợi ý, ẩn nó
        hasHint = false;
        hintPath = []; // Xóa đường đi gợi ý
    } else {
        // Nếu chưa có gợi ý, tìm kiếm gợi ý
        findHintPath();
    }
});

// Khởi tạo trò chơi
createGrid();
generateMazeFast();
document.getElementById("upButton").addEventListener("click", () => {
    movePlayer(0, -1);
});
document.getElementById("downButton").addEventListener("click", () => {
    movePlayer(0, 1);
});
document.getElementById("leftButton").addEventListener("click", () => {
    movePlayer(-1, 0);
});
document.getElementById("rightButton").addEventListener("click", () => {
    movePlayer(1, 0);
});

// Thêm vào sự kiện cho nút đổi mê cung
document.getElementById("newMazeButton").addEventListener("click", () => {
    createGrid(); // Tạo lưới mới
    generateMazeFast(); // Tạo mê cung mới
    playerX = 0; // Đặt lại vị trí người chơi về ô đầu
    playerY = 0; // Đặt lại vị trí người chơi về ô đầu
    hintPath = []; // Xóa đường gợi ý
    hasHint = false; // Đặt trạng thái gợi ý về false
    message.style.display = "none"; // Ẩn thông báo khi đổi mê cung
    gift.style.display = "none"; // Ẩn hộp quà khi đổi mê cung
    drawMaze(); // Vẽ mê cung mới
});

// Hàm tạo lưới
function createGrid() {
    grid.length = 0; // Xóa lưới cũ
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const cell = new Cell(x, y);
            grid.push(cell);
        }
    }
}

document.getElementById("goToEndButton").addEventListener("click", () => {
    playerX = endX; // Đặt vị trí người chơi tại điểm kết thúc
    playerY = endY; // Đặt vị trí người chơi tại điểm kết thúc
    drawMaze(); // Vẽ lại mê cung
    displayWinMessage(); // Hiển thị thông báo thắng
});

// Thêm sự kiện cho nút Tới Đích
document.getElementById("goToEndButton").addEventListener("click", () => {
    playerX = endX; // Đặt vị trí người chơi về điểm kết thúc
    playerY = endY; // Đặt vị trí người chơi về điểm kết thúc
    drawMaze(); // Vẽ mê cung để cập nhật vị trí người chơi

    // Hiển thị thông báo thắng
    if (playerX === endX && playerY === endY) {
        displayWinMessage();
    }
});
