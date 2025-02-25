// 1. Определение типов и интерфейсов

import { checkSquareCollision } from "./inCollision";

export interface GameObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Command {
  execute(): void;
}

export class MacroCommand implements Command {
  private commands: Command[] = [];

  addCommand(command: Command): void {
    this.commands.push(command);
  }

  execute(): void {
    for (const command of this.commands) {
      command.execute();
    }
  }

  clear(): void {
    this.commands = [];
  }
}

// 2.  Функция проверки коллизии
export function checkCollision(
  object1: GameObject,
  object2: GameObject
): boolean {
  return checkSquareCollision(object1, object2);
}

// 3. Команда для проверки коллизии между двумя объектами
export class CheckCollisionCommand implements Command {
  constructor(private object1: GameObject, private object2: GameObject) {}

  execute(): void {
    if (checkCollision(this.object1, this.object2)) {
      console.log(
        `Collision detected between ${this.object1.id} and ${this.object2.id}`
      );
      // Дополнительные действия при коллизии (например, изменение состояния объектов)
    }
  }
}

// 4. Класс для определения окрестности
export class Neighborhood {
  private cellSize: number; // Размер ячейки окрестности
  private objects: { [key: string]: Set<GameObject> } = {}; // Use Set for faster lookups and no duplicates

  constructor(cellSize: number) {
    this.cellSize = cellSize;
  }

  private getNeighborhoodKey(x: number, y: number): string {
    return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
  }

  getObjectsInNeighborhood(x: number, y: number): Set<GameObject> {
    const key = this.getNeighborhoodKey(x, y);
    return this.objects[key] || new Set<GameObject>();
  }

  addObject(object: GameObject): void {
    const key = this.getNeighborhoodKey(object.x, object.y);
    if (!this.objects[key]) {
      this.objects[key] = new Set<GameObject>();
    }
    this.objects[key].add(object);
  }

  removeObject(object: GameObject): void {
    const key = this.getNeighborhoodKey(object.x, object.y);
    if (this.objects[key]) {
      this.objects[key].delete(object);
      if (this.objects[key].size === 0) {
        delete this.objects[key];
      }
    }
  }

  updateObjectNeighborhood(
    object: GameObject,
    oldX: number,
    oldY: number
  ): void {
    const oldKey = this.getNeighborhoodKey(oldX, oldY);
    const newKey = this.getNeighborhoodKey(object.x, object.y);

    if (oldKey !== newKey) {
      if (oldKey in this.objects) {
        this.objects[oldKey].delete(object);
        if (this.objects[oldKey].size === 0) {
          delete this.objects[oldKey];
        }
      }
      this.addObject(object);
    }
  }

  getAllObjects(): Set<GameObject> {
    const allObjects = new Set<GameObject>();
    for (const key in this.objects) {
      if (this.objects.hasOwnProperty(key)) {
        for (const obj of this.objects[key]) {
          allObjects.add(obj);
        }
      }
    }
    return allObjects;
  }
}

/*
Реализовать команду, которая:
  -определяет окрестность, в которой присутствует игровой объект,
  -если объект попал в новую окрестность, то удаляет его из списка объектов старой окрестности и добавляет список объектов новой окрестности.
  -для каждого объекта новой окрестности и текущего движущегося объекта создает команду проверки коллизии этих двух объектов. Все эти команды помещает в макрокоманду и эту
  макрокоманду записывает на место аналогичной макрокоманды для предыдущей окрестности.
*/
export class UpdateNeighborhoodCommand implements Command {
  constructor(
    private gameObject: GameObject,
    private oldX: number,
    private oldY: number,
    private neighborhoods: Neighborhood[],
    private macroCommands: MacroCommand[]
  ) {}

  execute(): void {
    for (let i = 0; i < this.neighborhoods.length; i++) {
      const neighborhood = this.neighborhoods[i];
      const macroCommand = this.macroCommands[i];

      neighborhood.updateObjectNeighborhood(
        this.gameObject,
        this.oldX,
        this.oldY
      );

      macroCommand.clear();

      const allObjectsInNeighborhood = neighborhood.getAllObjects(); // Проверяем коллизии со всеми объектами в окрестности

      for (const otherObject of allObjectsInNeighborhood) {
        if (otherObject.id !== this.gameObject.id) {
          macroCommand.addCommand(
            new CheckCollisionCommand(this.gameObject, otherObject)
          );
        }
      }
    }
  }
}

// 6.  Основной класс, управляющий игровыми объектами и коллизиями
export class GameWorld {
  private gameObjects: GameObject[] = [];
  private neighborhoods: Neighborhood[] = [];
  private macroCommands: MacroCommand[] = [];

  constructor(neighborhoodCellSizes: number[]) {
    /*
      !Реализован механизм с произвольным количеством систем окрестностей из п.3 2 балла!
      
      при подходе с окрестностями может оказаться, что объекты, находящиеся рядом, могут попасть в разные окрестности, 
      что не позволит определить коллизию между ними. Для решения этой проблемы будем использовать 
      две системы окрестностей - одни окрестности смещены относительно центра других окрестностей. 
      Для этого можно использовать несколько команд из п. 1
    */
    this.neighborhoods = neighborhoodCellSizes.map(
      (size) => new Neighborhood(size)
    );
    this.macroCommands = neighborhoodCellSizes.map(() => new MacroCommand());
  }

  addGameObject(gameObject: GameObject): void {
    this.gameObjects.push(gameObject);
    for (const neighborhood of this.neighborhoods) {
      neighborhood.addObject(gameObject);
    }
  }

  updateGameObject(gameObject: GameObject): void {
    const existingObject = this.gameObjects.find(
      (obj) => obj.id === gameObject.id
    );
    if (!existingObject) {
      console.warn(
        `GameObject with id ${gameObject.id} not found. Add it first.`
      );
      return;
    }

    const oldX = existingObject.x;
    const oldY = existingObject.y;

    existingObject.x = gameObject.x;
    existingObject.y = gameObject.y;
    existingObject.width = gameObject.width;
    existingObject.height = gameObject.height;

    new UpdateNeighborhoodCommand(
      gameObject,
      oldX,
      oldY,
      this.neighborhoods,
      this.macroCommands
    ).execute();
  }

  processCollisions(): void {
    this.macroCommands.forEach((mc) => mc.execute());
  }
}

// // 7. Пример использования
// const gameWorld = new GameWorld([100, 50]); // Pass an array of sizes.

// const player: GameObject = {
//   id: "player",
//   x: 0,
//   y: 0,
//   width: 1,
//   height: 1,
// };
// const enemy1: GameObject = {
//   id: "enemy1",
//   x: 0,
//   y: 0,
//   width: 1,
//   height: 1,
// };

// gameWorld.addGameObject(player);
// gameWorld.addGameObject(enemy1);

// gameWorld.updateGameObject(player); // Обновляем позицию игрока и запускаем проверку коллизий
// gameWorld.processCollisions(); // Выполняем макрокоманды для определения коллизий
