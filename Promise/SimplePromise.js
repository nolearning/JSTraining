const PENDING = 0;
const RESOLVED = 1;
const REJECTED = 2;

function SimplePromise(executor) {
  this.state = PENDING; 
  this.value = null;
  this.reason = null;
  this.handlers = [];
  self1 = this;
  console.log('self', self1);
  executor && executor(
    function(v) { self1.resolve.call(self1, v) },
    function(r) { self1.reject.call(self1, r) }
  )
}

SimplePromise.isThenable = function(value) {
  if (!value) return false;
  return (typeof value === 'object' || typeof value === 'function') && typeof value.then === 'function';
}
	 
SimplePromise.prototype.fulfill = function (value) {
  this.state = RESOLVED;
  this.value = value;
  this.executeHandlers();
}
	
SimplePromise.prototype.executeHandlers = function() {
  let self = this;
  if (self.state === PENDING) return null;
  setTimeout(function () {
    for(handler of self.handlers ) {
      	self.state == RESOLVED ? handler.onFulfilled(self.value) : handler.onRejected(self.reason);
    }
    self.handlers = []
  }, 0);
}

SimplePromise.prototype.resolve = function (v) {
  let self = this;
  try {
    if (SimplePromise.isThenable(v)) {
        v.then(function (v1) {
	  console.log('thenable', self);
          self.resolve(v1);
        }, function (e) {
          self.reject(e);
        })
     } else {
       console.log('fulfilled', v)
       self.fulfill(v);
    }
  } catch (e) {
    if (self.state == PENDING) {
      self.reject(e);
    }
  }
}

SimplePromise.prototype.reject = function (r) {
  this.state = REJECTED;
  self.executeHandlers();
}

SimplePromise.prototype.then = function(onFulfilled, onRejected) {
  let self = this;
  onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : function (v) {return v;};
  onRejected = typeof onRejected === 'function' ? onRejected : function (r) { return r; }
  return new SimplePromise(function (resolve, reject) {
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

module.exports = SimplePromise;
