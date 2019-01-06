const PENDING = 0;
const RESOLVED = 1;
const REJECTED = 2;

function Promise(executor) {
  this.state = PENDING; 
  this.value = null;
  this.reason = null;
  this.handlers = [];
  self = this
  executor && executor(
    function(v) { self.resolve.call(self, v) },
    function(r) { self.reject.call(self, r) }
  )
}

Promise.isThenable = function(value) {
  if (!value) return false;
  return (typeof value === 'object' || typeof value === 'function') && typeof value.then === 'function';
}
	 
Promise.fulfill = function (value) {
  this.state = RESOLVED;
  this.value = value;
  this.executeHandlers();
}
	
Promise.executeHandlers = function() {
  if (this.state === PENDING) return null;
  setTimeout(function () {
    for(handler of this.handlers ) {
      	this.state == RESOLVED ? handler.onFulfilled(vavlue) : handler.onRejected(reason);
    }
    self.handlers = []
  }, 0);
}

Promise.prototype.resolve = function (v) {
  let self = this;
  try {
    if (Promise.isThenable(v)) {
        v.then(function (v1) {
          self.resolve(v1);
        }, function (e) {
          self.reject(e);
        })
     } else {
       self.fulfill(v1);
    }
  } catch (e) {
    if (self.state == PENDING) {
      self.reject(e);
    }
  }
}

Promise.prototype.reject = function (r) {
  this.state = REJECTED;
  self._executeHandlers();
}

Promise.prototype.then = function(onFulfilled, onRejected) {
  let self = this;
  onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : function (v) {return v;};
  onRejected = typeof onRejected === 'function' ? onRejected : function (r) { return r; }
  return new Promise(function (resolve, reject) {
    let handler = {
      onFulfilled : function (value) {
	try {
	  resolve(onFulfilled(value));
	} catch (e) {
          reject(e);
	}
      },
      onRejected: function(reason) {
	try {
          resolve(onRejected(reason))
	} catch (e) {
	  reject(e);
        }
      }
    }

    self.handlers.push(handler);
    if (this.state !== PENDING) self.executeHandlers();
  })
}
