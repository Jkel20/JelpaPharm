describe('Basic Test Suite', () => {
  it('should pass a simple test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle string operations', () => {
    expect('Hello' + ' ' + 'World').toBe('Hello World');
  });

  it('should handle array operations', () => {
    const array = [1, 2, 3];
    expect(array.length).toBe(3);
    expect(array[0]).toBe(1);
  });
});

describe('Math Operations', () => {
  it('should add numbers correctly', () => {
    expect(5 + 3).toBe(8);
  });

  it('should multiply numbers correctly', () => {
    expect(4 * 6).toBe(24);
  });

  it('should handle division', () => {
    expect(10 / 2).toBe(5);
  });
});
