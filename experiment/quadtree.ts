// import { Quadtree } from '@timohausmann/quadtree-ts';
// const myTree = new Quadtree({
//     width: 800,
//     height: 600,
//     x: 0,           // optional, default:  0
//     y: 0,           // optional, default:  0
//     maxObjects: 10, // optional, default: 10
//     maxLevels: 4    // optional, default:  4
// }, 10);


class Point {
    constructor(public x: number, public y: number) { }
}

class Rectangle {
    constructor(public x: number, public y: number, public w: number, public h: number) { }

    contains(point: Point) {
        return (
            point.x >= this.x &&
            point.x <= this.x + this.w &&
            point.y >= this.y &&
            point.y <= this.y + this.h
        );
    }

    intersects(range: Rectangle) {
        return !(
            range.x > this.x + this.w ||
            range.x + range.w < this.x ||
            range.y > this.y + this.h ||
            range.y + range.h < this.y
        );
    }
}

class Quadtree {
    points: Point[];
    boundary: Rectangle;
    capacity: number;
    divided: boolean;
    nw: Quadtree | null;
    ne: Quadtree | null;
    sw: Quadtree | null;
    se: Quadtree | null;

    constructor(boundary: Rectangle, capacity: number) {
        this.points = [];
        this.boundary = boundary;
        this.capacity = capacity;
        this.divided = false;
        this.nw = null;
        this.ne = null;
        this.sw = null;
        this.se = null;
    }

    subdivide() {
        const x = this.boundary.x;
        const y = this.boundary.y;
        const w = this.boundary.w / 2;
        const h = this.boundary.h / 2;

        const nwBoundary = new Rectangle(x, y, w, h);
        this.nw = new Quadtree(nwBoundary, this.capacity);

        const neBoundary = new Rectangle(x + w, y, w, h);
        this.ne = new Quadtree(neBoundary, this.capacity);

        const swBoundary = new Rectangle(x, y + h, w, h);
        this.sw = new Quadtree(swBoundary, this.capacity);

        const seBoundary = new Rectangle(x + w, y + h, w, h);
        this.se = new Quadtree(seBoundary, this.capacity);

        this.divided = true;
    }

    insert(point: Point) {
        if (!this.boundary.contains(point)) {
            return;
        }

        if (this.points.length < this.capacity) {
            this.points.push(point);
            return;
        }

        if (!this.divided) {
            this.subdivide();
        }

        this.nw?.insert(point);
        this.ne?.insert(point);
        this.sw?.insert(point);
        this.se?.insert(point);
    }

    query(range: Rectangle) {
        const result: Point[] = [];

        if (!this.boundary.intersects(range)) {
            return result;
        }

        for (const point of this.points) {
            if (range.contains(point)) {
                result.push(point);
            }
        }

        if (this.divided) {
            result.push(...this.nw?.query(range) ?? []);
            result.push(...this.ne?.query(range) ?? []);
            result.push(...this.sw?.query(range) ?? []);
            result.push(...this.se?.query(range) ?? []);
        }

        return result;
    }
}