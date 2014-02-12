asset = require 'assert'
path = require 'path'
fs = require 'fs'
RacksJS = require '../lib/racks.js'

describe "RacksJS", ->
  it "should authenticate", (ok) ->
    new RacksJS {
      username: 'someJunk!',
      apiKey: 'someOtherJunk!!!',
      test: yes,
      verbosity: 1
    }, (rs) ->
      ok()
      describe "HTTP verbs", ->
        it "should work without error! (HTTP calls mocked)", (ok) ->
          rs.get 'http://github.com/erulabs/racksjs', (reply) ->
            rs.post 'http://github.com/erulabs/racksjs', {}, (reply) ->
              rs.delete 'http://github.com/erulabs/racksjs', (reply) ->
                rs.put 'http://github.com/erulabs/racksjs', (reply) ->
                  ok()
      describe "Service catalog", ->
        it "parsing should have occured (even against our mock catalog)", (ok) ->
          for product in rs.serviceCatalog
            if !rs.products[product.name]? then return ok(throw new Error('Error parsing catalog!'))
          ok()