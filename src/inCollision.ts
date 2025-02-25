export interface Square {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Projection {
  min: number;
  max: number;
}

/**
 * Calculates the projection of a square (now a rectangle) onto an axis.
 *
 * @param square The square/rectangle to project.
 * @param axis An object representing the axis.  Must be normalized (length of 1).
 * @returns An object with `min` and `max` properties representing the projection.
 */
export function projectSquare(
  square: Square,
  axis: { x: number; y: number }
): Projection {
  // Calculate the coordinates of the four vertices of the rectangle.
  const vertices = [
    { x: square.x, y: square.y },
    { x: square.x + square.width, y: square.y },
    { x: square.x, y: square.y + square.height },
    { x: square.x + square.width, y: square.y + square.height },
  ];

  // Project each vertex onto the axis and find the minimum and maximum projections.
  let minProjection = Infinity;
  let maxProjection = -Infinity;

  for (const vertex of vertices) {
    const projection = vertex.x * axis.x + vertex.y * axis.y; // Dot product

    minProjection = Math.min(minProjection, projection);
    maxProjection = Math.max(maxProjection, projection);
  }

  return { min: minProjection, max: maxProjection };
}

/**
 * Checks if two projections overlap.
 *
 * @param projection1 The first projection.
 * @param projection2 The second projection.
 * @returns `true` if the projections overlap, `false` otherwise.
 */
export function projectionsOverlap(
  projection1: Projection,
  projection2: Projection
): boolean {
  return !(
    projection1.max < projection2.min || projection2.max < projection1.min
  );
}

/**
 * Checks if two squares (now rectangles) are colliding using the Separating Axis Theorem (SAT).
 *
 * @param square1 The first square.
 * @param square2 The second square.
 * @returns `true` if the squares are colliding, `false` otherwise.
 */
export function checkSquareCollision(
  square1: Square,
  square2: Square
): boolean {
  // Define the axes to project onto.  For rectangles, we need to check the normals of the sides.
  // These normals are already normalized.
  const axes = [
    { x: 1, y: 0 }, // X-axis (normal to the left/right sides)
    { x: 0, y: 1 }, // Y-axis (normal to the top/bottom sides)
  ];

  // For each axis, project both rectangles onto the axis and check for overlap.
  for (const axis of axes) {
    const projection1 = projectSquare(square1, axis);
    const projection2 = projectSquare(square2, axis);

    if (!projectionsOverlap(projection1, projection2)) {
      // If the projections don't overlap on any axis, the rectangles are not colliding.
      return false;
    }
  }

  // If the projections overlap on all axes, the rectangles are colliding.
  return true;
}
