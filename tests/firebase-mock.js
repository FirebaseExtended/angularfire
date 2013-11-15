var Firebase = function (url) {
  this._url = url;
  this.on = function () {};

  this.startAt = function (num) {
    this._startAt = num;
    return this;
  };

  this.limit = function (num) {
    this._limit = num;
    return this;
  }
}