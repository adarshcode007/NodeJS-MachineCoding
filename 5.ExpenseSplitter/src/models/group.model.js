export class Group {
  constructor({ id, name }) {
    this.id = id;
    this.name = name;
    this.members = [];
    this.expenses = [];
  }
}
