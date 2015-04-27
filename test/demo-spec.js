describe("My first test suite", function () {

  it("can match using toEqual", function() {
    expect(HelloWorld()).toEqual("Hello, World!");
  });

  it("can match using toContain", function() {
    expect(HelloWorld()).toContain("hello");
  });
});
