var Firebase = function (url) {
  this._url = url;
  this.on = function (event, callback) {
    this._on = this._on || [];
    this._on.push(event);

    this._events = this._events || {};
    this._events[event] = callback;
  };

  this.startAt = function (num) {
    this._startAt = num;
    return this;
  };

  this.limit = function (num) {
    this._limit = num;
    return this;
  }
}