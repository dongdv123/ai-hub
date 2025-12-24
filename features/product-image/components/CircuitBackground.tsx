import React, { useRef, useEffect } from 'react';

const CircuitBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        let grid: Point[][] = [];

        const config = {
            bgColor: '#f1f5f9', // slate-100
            traceColor: '#cbd5e1', // slate-300
            particleColor: '#3b82f6', // blue-500
            particleGlowColor: 'rgba(59, 130, 246, 0.4)',
            particleRadius: 1.5,
            particleCount: 50,
            particleSpeed: 1,
            gridSize: 30,
            turnChance: 0.8,
            maxTurnCount: 10,
        };

        class Point {
            x: number;
            y: number;
            connections: { [key: string]: Point | null };
            isEnd: boolean;

            constructor(x: number, y: number) {
                this.x = x;
                this.y = y;
                this.connections = { n: null, s: null, e: null, w: null };
                this.isEnd = false;
            }

            draw() {
                if (ctx) {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
                    ctx.fillStyle = config.traceColor;
                    ctx.fill();
                }
            }

            drawConnections() {
                if (ctx) {
                    ctx.strokeStyle = config.traceColor;
                    ctx.lineWidth = 1;
                    if (this.connections.n) {
                        ctx.beginPath();
                        ctx.moveTo(this.x, this.y);
                        ctx.lineTo(this.connections.n.x, this.connections.n.y);
                        ctx.stroke();
                    }
                    if (this.connections.s) {
                        ctx.beginPath();
                        ctx.moveTo(this.x, this.y);
                        ctx.lineTo(this.connections.s.x, this.connections.s.y);
                        ctx.stroke();
                    }
                    if (this.connections.e) {
                        ctx.beginPath();
                        ctx.moveTo(this.x, this.y);
                        ctx.lineTo(this.connections.e.x, this.connections.e.y);
                        ctx.stroke();
                    }
                    if (this.connections.w) {
                        ctx.beginPath();
                        ctx.moveTo(this.x, this.y);
                        ctx.lineTo(this.connections.w.x, this.connections.w.y);
                        ctx.stroke();
                    }
                }
            }
        }

        class Particle {
            x: number;
            y: number;
            target: Point;
            origin: Point;
            speed: number;

            constructor(origin: Point) {
                this.origin = origin;
                this.target = this.findNewTarget(origin);
                this.x = origin.x;
                this.y = origin.y;
                this.speed = (Math.random() * 0.5 + 0.5) * config.particleSpeed;
            }

            findNewTarget(point: Point): Point {
                const availableConnections = Object.values(point.connections).filter(c => c !== null) as Point[];
                if (availableConnections.length === 0) {
                     this.reset();
                     return this.target;
                }
                const randomIndex = Math.floor(Math.random() * availableConnections.length);
                return availableConnections[randomIndex];
            }
            
            reset() {
                const startPoint = grid[Math.floor(Math.random() * grid.length)][Math.floor(Math.random() * grid[0].length)];
                this.origin = startPoint;
                this.target = this.findNewTarget(startPoint);
                this.x = this.origin.x;
                this.y = this.origin.y;
            }

            update() {
                const dx = this.target.x - this.x;
                const dy = this.target.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < this.speed) {
                    this.origin = this.target;
                    this.target = this.findNewTarget(this.origin);
                    this.x = this.origin.x;
                    this.y = this.origin.y;
                } else {
                    this.x += (dx / dist) * this.speed;
                    this.y += (dy / dist) * this.speed;
                }
            }

            draw() {
                if(ctx){
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, config.particleRadius, 0, Math.PI * 2);
                    ctx.fillStyle = config.particleColor;
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = config.particleGlowColor;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }
        }

        const createGrid = () => {
            grid = [];
            const cols = Math.ceil(window.innerWidth / config.gridSize);
            const rows = Math.ceil(window.innerHeight / config.gridSize);
            
            for (let i = 0; i < rows; i++) {
                grid[i] = [];
                for (let j = 0; j < cols; j++) {
                    grid[i][j] = new Point(j * config.gridSize, i * config.gridSize);
                }
            }
            
            const walkers = Array.from({ length: Math.floor((rows * cols) * 0.1) }, () => ({
                x: Math.floor(Math.random() * cols),
                y: Math.floor(Math.random() * rows),
                dir: ['n', 's', 'e', 'w'][Math.floor(Math.random() * 4)],
                turnCount: 0,
            }));

            for (let i = 0; i < 5000; i++) { // Limit iterations to prevent infinite loops
                walkers.forEach(walker => {
                    const currentPoint = grid[walker.y]?.[walker.x];
                    if (!currentPoint) return;

                    let nextX = walker.x;
                    let nextY = walker.y;
                    
                    if(Math.random() < config.turnChance && walker.turnCount < config.maxTurnCount) {
                        const newDir = ['n', 's', 'e', 'w'][Math.floor(Math.random() * 4)];
                        if(newDir !== walker.dir) {
                            walker.dir = newDir;
                            walker.turnCount++;
                        }
                    }

                    switch(walker.dir) {
                        case 'n': nextY--; break;
                        case 's': nextY++; break;
                        case 'e': nextX++; break;
                        case 'w': nextX--; break;
                    }

                    if (nextY >= 0 && nextY < rows && nextX >= 0 && nextX < cols) {
                        const nextPoint = grid[nextY][nextX];
                        if (walker.dir === 'n' && !currentPoint.connections.n) {
                           currentPoint.connections.n = nextPoint;
                           nextPoint.connections.s = currentPoint;
                        } else if (walker.dir === 's' && !currentPoint.connections.s) {
                           currentPoint.connections.s = nextPoint;
                           nextPoint.connections.n = currentPoint;
                        } else if (walker.dir === 'e' && !currentPoint.connections.e) {
                           currentPoint.connections.e = nextPoint;
                           nextPoint.connections.w = currentPoint;
                        } else if (walker.dir === 'w' && !currentPoint.connections.w) {
                           currentPoint.connections.w = nextPoint;
                           nextPoint.connections.e = currentPoint;
                        }
                        walker.x = nextX;
                        walker.y = nextY;
                    } else {
                         walker.x = Math.floor(Math.random() * cols);
                         walker.y = Math.floor(Math.random() * rows);
                         walker.turnCount = 0;
                    }
                });
            }
        };

        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            createGrid();

            particles = [];
            while(particles.length < config.particleCount) {
                 const startPoint = grid[Math.floor(Math.random() * grid.length)][Math.floor(Math.random() * grid[0].length)];
                 const hasConnections = Object.values(startPoint.connections).some(c => c !== null);
                 if(hasConnections) {
                     particles.push(new Particle(startPoint));
                 }
            }
        };

        const animate = () => {
            ctx.fillStyle = config.bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            grid.forEach(row => row.forEach(point => point.drawConnections()));
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            
            animationFrameId = requestAnimationFrame(animate);
        };

        const handleResize = () => {
            cancelAnimationFrame(animationFrameId);
            setup();
            animate();
        };

        setup();
        animate();

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: -1 }} />;
};

export default CircuitBackground;
