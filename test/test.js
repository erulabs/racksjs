(function() {
  var RacksJS, asset, fs, path;

  asset = require('assert');

  path = require('path');

  fs = require('fs');

  RacksJS = require('../dist/racks.js');

  describe("RacksJS", function() {
    return it("should authenticate", function(ok) {
      return new RacksJS({
        username: 'somefake',
        apiKey: 'somefake',
        verbosity: 0,
        test: true
      }, function(rs) {
        ok();
        describe("HTTP verbs", function() {
          return it("should work without error! (HTTP calls mocked)", function(ok) {
            return rs.get('http://github.com/erulabs/racksjs', function(reply) {
              return rs.post('http://github.com/erulabs/racksjs', {}, function(reply) {
                return rs["delete"]('http://github.com/erulabs/racksjs', function(reply) {
                  return rs.put('http://github.com/erulabs/racksjs', {}, function(reply) {
                    ok();
                    return describe("Service catalog", function() {
                      return it("parsing should have occured (even against our mock catalog)", function(ok) {
                        var product, _i, _len, _ref;
                        _ref = rs.serviceCatalog;
                        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                          product = _ref[_i];
                          if (rs.products[product.name] == null) {
                            return ok((function() {
                              throw new Error('Error parsing catalog!');
                            })());
                          }
                        }
                        ok();
                        describe("NextGen Flavors", function() {
                          return it("can retrieve a list of flavors", function(ok) {
                            return rs.cloudServersOpenStack.flavors.all(function(reply) {
                              return ok();
                            });
                          });
                        });
                        describe("NextGen Images", function() {
                          return it("can retrieve a list of images", function(ok) {
                            return rs.cloudServersOpenStack.images.all(function(reply) {
                              return ok();
                            });
                          });
                        });
                        return describe("NextGen Servers", function() {
                          return it(".new() should create a new server", function(ok) {
                            return rs.cloudServersOpenStack.servers["new"]({
                              name: 'racksjs-testBuild-01',
                              imageRef: '1eb491c1-c5fb-4b34-be53-196a0c0588ba',
                              flavorRef: 'performance1-1'
                            }, function(server) {
                              return ok();
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
        return describe("Racks meta", function() {
          return it("products should successfully target, even in test mode", function(ok) {
            if (rs.cloudServersOpenStack.servers._racksmeta.target() !== void 0) {
              if (rs.cloudBlockStorage.volumes._racksmeta.target() !== void 0) {
                return ok();
              }
            }
          });
        });
      });
    });
  });

}).call(this);
