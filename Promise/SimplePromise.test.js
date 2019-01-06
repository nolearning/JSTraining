const SimplePromise = require('./SimplePromise');

describe('Simple Promise Test', function () {
  describe('Resolved Promise Test', functoin() {
    it('promise state should be resolved', () => {
      let p1 = new SimplePromise((resolve, reject) => resolve(2));
      expect(p1.state).toEqual(1);
      expect(p1.value).toEqual(2);
      expect(p1.reason).toEqual(null);
    });
  });
});
