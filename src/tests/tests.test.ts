import {
  CheckCollisionCommand,
  Neighborhood,
  UpdateNeighborhoodCommand,
  MacroCommand,
} from "..";
import {
  projectSquare,
  projectionsOverlap,
  checkSquareCollision,
} from "../inCollision";

describe("Collision Detection Tests", () => {
  test("projectSquare should return correct projections", () => {
    const square = { x: 0, y: 0, width: 2, height: 2 };
    const axis = { x: 1, y: 0 }; // Ось X
    const projection = projectSquare(square, axis);

    expect(projection.min).toBe(0);
    expect(projection.max).toBe(2);
  });

  test("projectionsOverlap should detect overlapping projections", () => {
    const projection1 = { min: 1, max: 5 };
    const projection2 = { min: 3, max: 7 };

    expect(projectionsOverlap(projection1, projection2)).toBe(true);
  });

  test("checkSquareCollision should detect collision between rectangles", () => {
    const square1 = { x: 0, y: 0, width: 2, height: 2 };
    const square2 = { x: 1, y: 1, width: 2, height: 2 };

    expect(checkSquareCollision(square1, square2)).toBe(true);
  });

  test("CheckCollisionCommand should log collision", () => {
    console.log = jest.fn(); // Подменяем console.log

    const obj1 = { id: "A", x: 0, y: 0, width: 1, height: 1 };
    const obj2 = { id: "B", x: 0, y: 0, width: 1, height: 1 };
    const command = new CheckCollisionCommand(obj1, obj2);

    command.execute();

    expect(console.log).toHaveBeenCalledWith(
      "Collision detected between A and B"
    );
  });

  test("Neighborhood should add and retrieve objects (определяет окрестность, в которой присутствует игровой объект)", () => {
    const neighborhood = new Neighborhood(100);
    const obj = { id: "1", x: 10, y: 10, width: 1, height: 1 };
    neighborhood.addObject(obj);
    const objectsInCell = neighborhood.getObjectsInNeighborhood(10, 10);
    expect(objectsInCell.has(obj)).toBe(true);
  });

  test("Neighborhood should update objects (если объект попал в новую окрестность, то удаляет его из списка объектов старой окрестности и добавляет список объектов новой окрестности.)", () => {
    const neighborhood = new Neighborhood(100);
    const obj = { id: "1", x: 10, y: 10, width: 1, height: 1 };
    neighborhood.addObject(obj);
    obj.x = 50;
    obj.y = 50;
    neighborhood.updateObjectNeighborhood(obj, 10, 10);
    const objectsInNewCell = neighborhood.getObjectsInNeighborhood(50, 50);
    expect(objectsInNewCell.has(obj)).toBe(true);
  });

  test("UpdateNeighborhoodCommand should update object position", () => {
    const neighborhood = new Neighborhood(100);
    const obj = { id: "1", x: 10, y: 10, width: 1, height: 1 };
    neighborhood.addObject(obj);

    const command = new UpdateNeighborhoodCommand(
      obj,
      10,
      10,
      [neighborhood],
      [new MacroCommand()]
    );
    obj.x = 50;
    obj.y = 50;
    command.execute();

    const objectsInNewCell = neighborhood.getObjectsInNeighborhood(50, 50);
    expect(objectsInNewCell.has(obj)).toBe(true);
  });

  test("Neighborhood should add and retrieve objects (Написаны тесты к п. 3. 1 балл)", () => {
    const neighborhood = new Neighborhood(100);
    const neighborhood2 = new Neighborhood(50);

    const obj = { id: "1", x: 10, y: 10, width: 1, height: 1 };
    neighborhood.addObject(obj);
    neighborhood2.addObject(obj);
    obj.x = 60;
    obj.y = 60;
    neighborhood.updateObjectNeighborhood(obj, 10, 10);
    neighborhood2.updateObjectNeighborhood(obj, 10, 10);

    const undef = neighborhood2.getObjectsInNeighborhood(10, 10);
    const stillInFirstCell = neighborhood.getObjectsInNeighborhood(60, 60);
    const alreadyInScecondCell = neighborhood2.getObjectsInNeighborhood(60, 60);

    expect(stillInFirstCell.has(obj)).toBe(true);
    expect(alreadyInScecondCell.has(obj)).toBe(true);
    expect(!undef.has(obj)).toBe(true);
  });
});
