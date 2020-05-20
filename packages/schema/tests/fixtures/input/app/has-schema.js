import Model, { attr, belongsTo } from '@ember-data/model';

export default class User extends Model {
  @attr firstName;
  @attr() lastName;
  @attr('string', { defaultValue: 0 }) age;
  @belongsTo user;
  @belongsTo('user') friend;
  @belongsTo('user', { async: false, polymorphic: true, inverse: null })
  bestFriend;
}
