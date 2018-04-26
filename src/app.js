export class App {
  stringArray = ['A', 'A', 'B', 'C'];

  objArray = [
    {name: 'Abi'},
    {name: 'Bob'},
    {name: 'Cherry'}
  ];

  fruits = ['Apple', 'Pineapple', 'Banana'];
  animals = ['Cow', 'Horse', 'Sheep', 'Goat'];
  insects = ['Grasshopper', 'Fly', 'Dragonfly', 'Frog'];

  objArrayReordered(objArray) {
    /* eslint no-console: 0 */
    console.log(JSON.stringify(objArray));
  }

  fruitsOrdered(list) {
    console.log('newFruits: ' + list);
  }

  animalsOrdered(list) {
    console.log('animals: ' + list);
  }

  insectsOrdered(list) {
    console.log('insects: ' + list);
  }
}
