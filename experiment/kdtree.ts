class Point2 {
    constructor(public x: number, public y: number) { }

    distance(other: Point) {
        return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
    }
}

class Node2 {
    public left: Node2 | null;
    public right: Node2 | null;

    constructor(public point: Point2, public depth: number) {
        this.left = null;
        this.right = null;
    }
}

class KdTree {
    private root: Node2 | null;

    constructor(points: Point2[]) {
        this.root = this.build(points, 0);
    }

    private build(points: Point2[], depth: number): Node2 | null {
        if (points.length == 0) {
            return null;
        }

        const axis = depth % 2;
        points.sort((a, b) => a[axis] - b[axis]);
        const mid = Math.floor(points.length / 2);
        const node = new Node2(points[mid], depth);

        node.left = this.build(points.slice(0, mid), depth + 1);
        node.right = this.build(points.slice(mid + 1), depth + 1);

        return node;
    }

    public nearest(point: Point2): Point2 | null {
        let best: Point2 | null = null;
        let bestDist = Infinity;

        const search = (node: Node2 | null, target: Point2, dist: number) => {
            if (node == null) {
                return;
            }

            const d = node.point.distance(target);
            if (d < bestDist) {
                bestDist = d;
                best = node.point;
            }

            const axis = node.depth % 2;
            const diff = target[axis] - node.point[axis];
            const left = diff < 0;

            if (left) {
                search(node.left, target, dist + 1);
            } else {
                search(node.right, target, dist + 1);
            }

            if (Math.abs(diff) < bestDist) {
                if (left) {
                    search(node.right, target, dist + 1);
                } else {
                    search(node.left, target, dist + 1);
                }
            }
        };

        search(this.root, point, 0);
        return best;
    }
}
