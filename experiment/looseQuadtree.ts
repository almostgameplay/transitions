class Point3 {
    constructor(public x: number, public y: number) { }
}

class Bounds {
    constructor(public minX: number, public minY: number, public maxX: number, public maxY: number) { }

    contains(point: Point): boolean {
        return (
            point.x >= this.minX &&
            point.y >= this.minY &&
            point.x <= this.maxX &&
            point.y <= this.maxY
        );
    }

    intersects(bounds: Bounds): boolean {
        return !(
            bounds.minX > this.maxX ||
            bounds.maxX < this.minX ||
            bounds.minY > this.maxY ||
            bounds.maxY < this.minY
        );
    }
}

class LooseQuadtree<T> {
    private readonly MAX_OBJECTS = 10;
    private readonly MAX_LEVELS = 5;

    private objects: T[] = [];
    private bounds: Bounds;
    private nodes: LooseQuadtree<T>[] = [];

    constructor(private level: number, private maxObjects: number, bounds: Bounds) { }

    insert(object: T, point: Point): void {
        if (!this.bounds.contains(point)) {
            return;
        }

        if (this.objects.length < this.maxObjects || this.level === this.MAX_LEVELS) {
            this.objects.push(object);
        } else {
            if (this.nodes.length === 0) {
                this.split();
            }

            for (const node of this.nodes) {
                node.insert(object, point);
            }
        }
    }

    search(bounds: Bounds): T[] {
        const results: T[] = [];

        if (!this.bounds.intersects(bounds)) {
            return results;
        }

        for (const object of this.objects) {
            if (bounds.contains(object as unknown as Point)) {
                results.push(object);
            }
        }

        for (const node of this.nodes) {
            results.push(...node.search(bounds));
        }

        return results;
    }

    private split(): void {
        const subWidth = (this.bounds.maxX - this.bounds.minX) / 2;
        const subHeight = (this.bounds.maxY - this.bounds.minY) / 2;
        const x = this.bounds.minX;
        const y = this.bounds.minY;

        this.nodes.push(
            new LooseQuadtree<T>(this.level + 1, this.maxObjects, new Bounds(x, y, x + subWidth, y + subHeight)),
            new LooseQuadtree<T>(
                this.level + 1,
                this.maxObjects,
                new Bounds(x + subWidth, y, x + subWidth * 2, y + subHeight)
            ),
            new LooseQuadtree<T>(
                this.level + 1,
                this.maxObjects,
                new Bounds(x, y + subHeight, x + subWidth, y + subHeight * 2)
            ),
            new LooseQuadtree<T>(
                this.level + 1,
                this.maxObjects,
                new Bounds(x + subWidth, y + subHeight, x + subWidth * 2, y + subHeight * 2)
            )
        );
    }
}
